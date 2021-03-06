const BaseCrawler = require('./Base');
const createClient = require('hafas-client');
const withRetrying = require('hafas-client/retry');
const sncbProfile = require('hafas-client/p/sncb');
const sequelize = require('../../db');
const models = sequelize.models;
const autoBind = require('auto-bind');

const retryingSncbProfile = withRetrying(sncbProfile, {
  retries: 3,
  minTimeout: 5 * 1000,
  factor: 2,
});


const SHOULD_FETCH_PRODUCT_TYPES = {
  bus: false,
  tram: false,
  metro: false,
  'local-train': true,
  's-train': true,
  'intercity-p': true,
  'high-speed-train': true,
};
const BATCH_SIZE = 6 * 60; // Minutes


class NMBSCrawler extends BaseCrawler {
  constructor() {
    super();
    autoBind(this);

    this.source = 'NMBS';
    this.seedId = '8814001';

    this.client = createClient(retryingSncbProfile, 'trainplanner');
  }


  async fetchStop(sourceId) {
    let stopInfo = await this.client.stop(sourceId);

    let parentId = null;
    // TODO: get this to work. The naive case already works, but NMBS has circular parent
    // references, so yeah.
    // if(stopInfo.station) {
    //   let parentSourceId = stopInfo.station.id;
    //   let parent = await this.getOrCreateStop(parentSourceId);
    //   parentId = parent.id;
    // }

    return models.Stop.create({
      source: this.source,
      sourceId: stopInfo.id,
      name: stopInfo.name,
      parentId: parentId,

      latitude: stopInfo.location.latitude,
      longitude: stopInfo.location.longitude,
    })
  }


  async crawlStopBatch(stop) {
    let crawlFrom = stop.crawledUntil;
    let crawlUntil = new Date(stop.crawledUntil.getTime() + BATCH_SIZE * 60 * 1000)
    console.info(
      'Getting the trips at %s between %s and %s',
      stop.name,
      crawlFrom.toISOString(),
      crawlUntil.toISOString(),
    );

    let departureInfos = await this.client.departures(stop.sourceId, {
      when: crawlFrom,
      duration: BATCH_SIZE,
    });
    departureInfos = departureInfos.filter(this.shouldFetchTrip);
    console.info('  Found %s trips', departureInfos.length);

    for(let departureInfo of departureInfos) {
      await this.getOrCreateTrip(departureInfo.tripId);
    }

    stop.crawledUntil = crawlUntil;
    await stop.save();
  }


  shouldFetchTrip(departureInfo) {
    let productType = departureInfo.line.product;
    let shouldFetchProductType = SHOULD_FETCH_PRODUCT_TYPES[productType];
    if(shouldFetchProductType == null) {
      throw new Error('Unknown product type: ' + productType);
    }
    return shouldFetchProductType;
  }


  async fetchTrip(sourceId) {
    let tripInfo = await this.client.trip(sourceId, 'noop');

    console.info(
      '  Getting a trip at %s from %s to %s',
      new Date(tripInfo.plannedDeparture).toISOString(),
      tripInfo.origin.name,
      tripInfo.destination.name,
    );

    let stopoverInfos = tripInfo.stopovers;
    let stopovers = [];
    for(let stopoverInfo of stopoverInfos) {
      let stopSourceId = stopoverInfo.stop.id;
      let stop = await this.getOrCreateStop(stopSourceId);
      let stopover = models.Stopover.build({
        stopId: stop.id,
        arrival: stopoverInfo.plannedArrival,
        departure: stopoverInfo.plannedDeparture,
      });
      stopovers.push(stopover);
    }


    let trip = await sequelize.transaction(async t => {
      let trip = await models.Trip.create({
        source: this.source,
        sourceId: tripInfo.id,
      }, { transaction: t });

      for(let stopover of stopovers) {
        stopover.tripId = trip.id;
        await stopover.save({ transaction: t });
      }

      return trip;
    });

    return trip;
  }
}


module.exports = NMBSCrawler;
