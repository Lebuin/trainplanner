const { models } = require('../../db');
const { Op } = require('sequelize');


class BaseCrawler {
  constructor() {
    this.source = 'OVERRIDE ME';
    this.seedId = 'OVERRIDE ME';
  }


  async init() {
    await this.getOrCreateStop(this.seedId);
  }


  async crawl(from, until) {
    while(true) {
      let stop = await this.getNextStopToCrawl(until);
      if(!stop) {
        break;
      }
      if(!stop.crawledUntil) {
        stop.crawledUntil = from;
      }

      await this.crawlStopBatch(stop);
    }
  }


  async getNextStopToCrawl(until) {
    return await models.Stop.findOne({
      where: {
        crawledUntil: {
          [Op.or]: {
            [Op.eq]: null,
            [Op.lt]: until,
          },
        },
      },
      order: [
        ['crawledUntil', 'ASC NULLS FIRST']
      ],
    });
  }


  async getOrCreateStop(sourceId) {
    let stop = await models.Stop.findOne({
      where: {
        source: this.source,
        sourceId: sourceId,
      },
    });

    if(!stop) {
      stop = await this.fetchStop(sourceId);
    }

    return stop;
  }


  async getOrCreateTrip(sourceId) {
    let trip = await models.Trip.findOne({
      where: {
        source: this.source,
        sourceId: sourceId,
      },
    });

    if(!trip) {
      trip = await this.fetchTrip(sourceId);
    }

    return trip;
  }


  async fetchStop(sourceId) {  // eslint-disable-line no-unused-vars
    throw new Error('Implement me');
  }

  async crawlStopBatch(stop) {  // eslint-disable-line no-unused-vars
    throw new Error('Implement me');
  }
}


module.exports = BaseCrawler;
