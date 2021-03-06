const sequelize = require('../db');
const models = sequelize.models;
const Stop = require('./Stop');
const Route = require('./Route');
const Trip = require('./Trip');
const Journey = require('./Journey');
const myUtil = require('../util');


class Router {
  constructor() {
    this.stops = [];
    this.routes = {};
    this.trips = [];

    this.transferTime = 5 * 60 * 1000;  // 10 minutes
  }


  async init() {
    await this.buildStops();
    await this.buildRoutes();
  }


  async buildStops() {
    let dbStops = await models.Stop.findAll();
    for(let dbStop of dbStops) {
      let stop = new Stop(dbStop.id, dbStop.name);
      this.stops[stop.id] = stop;
    }
  }


  async buildRoutes() {
    let dbTrips = await models.Trip.findAll();
    for(let dbTrip of dbTrips) {
      let trip = new Trip(dbTrip.id);
      this.trips[trip.id] = trip;
    }

    let dbStopovers = await models.Stopover.findAll({
      order: [
        ['departure', 'ASC NULLS LAST']
      ]
    });
    for(let dbStopover of dbStopovers) {
      let trip = this.trips[dbStopover.tripId];
      let stop = this.stops[dbStopover.stopId];
      trip.addStopover(stop, dbStopover.arrival, dbStopover.departure);
    }

    // TODO: building routes should happen offline, once
    for(let trip of this.trips) {
      if(trip) {
        let route = this.getOrCreateRoute(trip.stops);
        trip.setRoute(route);
      }
    }

    Object.values(this.routes).forEach(route => route.orderTrips());
  }


  getOrCreateRoute(stops) {
    let id = Route.buildId(stops);
    if(!(id in this.routes)) {
      let route = new Route(stops);
      this.routes[route.id] = route;
    }
    return this.routes[id];
  }



  run(fromStopId, toStopId, fromDate, toDate) {
    let fromStop = this.stops[fromStopId];
    if(fromStop == null) {
      throw new Error(`Stop ${fromStopId} does not exist`);
    }

    let toStop = this.stops[toStopId];
    if(toStop == null) {
      throw new Error(`Stop ${toStopId} does not exist`);
    }

    let departures;
    if(toDate == null) {
      departures = [fromDate];
    } else {
      departures = this.getTripDepartures(fromStop, fromDate, toDate);
    }
    let arrivals = [];
    let journeys = [];

    let start = myUtil.time();
    for(let departure of departures) {
      let connections = this.runRangeRouter(fromStop, toStop, departure, arrivals);
      journeys.push(...this.buildJourneys(connections, toStop));
    }
    let end = myUtil.time();

    console.log('Elapsed time: %s s', (end - start) / 1000);
    journeys = journeys
      .sort((j1, j2) => j1.departure - j2.departure)
      .filter(journey => toDate == null || journey.departure < toDate);
    this.printJourneys(journeys, fromStop, toStop);
  }


  getTripDepartures(stop, fromDate, toDate) {
    let departures = new Set();
    for(let [route, stopoverIndex] of stop.routes) {
      let trips = this.findTripsBetween(route, stopoverIndex, fromDate, toDate);
      for(let trip of trips) {
        let departure = trip.schedule[stopoverIndex][1];
        departures.add(departure);
      }
    }

    departures = Array.from(departures);
    departures.sort().reverse();
    return departures;
  }


  runRangeRouter(fromStop, toStop, departure, arrivals) {
    // This is the rRAPTOR variant of the algorithm. This means the local pruning is not
    // implemented, even when you are using this for instant queries. This shouldn't be a problem:
    // instant queries are fast anyways.
    // Comments like /***this***/ are references to the original RAPTOR algorithm as described
    // in the paper "Round-Based Public Transit Routing"

    /***Initialization of the algorithm***/
    let connections = [];
    connections[0] = [];
    let round = 0;

    if(arrivals == null) {
      arrivals = [];
    }
    if(arrivals.length === 0) {
      arrivals[0] = Array(this.stops.length).fill(Infinity);
    }

    // Initialize the first round
    arrivals[0][fromStop.id] = departure;
    let markedStops = new Set([fromStop]);

    while(markedStops.size > 0) {  /***foreach k ← 1, 2,... do***/
      round++;
      connections[round] = [];

      if(arrivals.length <= round) {
        arrivals[round] = arrivals[round - 1].slice();
      } else {
        for(let i = 0; i < this.stops.length; i++) {
          if(arrivals[round - 1][i] < arrivals[round][i]) {
            arrivals[round][i] = arrivals[round - 1][i];
          }
        }
      }

      /***Accumulate routes serving marked stops from previous round***/
      let routesToTraverse = this.getRoutesToTraverse(markedStops);
      markedStops = new Set();

      /***Traverse each route***/
      for(let [route, minStopoverIndex] of routesToTraverse) {
        let trip = null;
        let boardingStopoverIndex = null;

        for(
          let stopoverIndex = minStopoverIndex;
          stopoverIndex < route.stops.length;
          stopoverIndex++
        ) {
          /***Can the label be improved in this round? Includes local and target pruning***/
          let stop = route.stops[stopoverIndex];
          if(trip) {
            let arrival = trip.schedule[stopoverIndex][0];
            if(arrival < Math.min(arrivals[round][stop.id], arrivals[round][toStop.id])) {
              arrivals[round][stop.id] = arrival;
              connections[round][stop.id] = [trip, boardingStopoverIndex, stopoverIndex];
              markedStops.add(stop);
            }
          }

          /***Can we catch an earlier tripat p_i?***/
          let previousArrival = arrivals[round - 1][stop.id];
          if(isFinite(previousArrival)) {
            let previousDeparture = new Date(previousArrival.getTime() + this.transferTime);
            if(!trip || previousDeparture <= trip.schedule[stopoverIndex][1]) {
              let newTrip = this.findEarliestTrip(
                route,
                stopoverIndex,
                previousDeparture,
              );
              if(newTrip !== trip) {
                trip = newTrip;
                boardingStopoverIndex = stopoverIndex;
              }
            }
          }
        }
      }
    }

    return connections;
  }


  getRoutesToTraverse(markedStops) {
    let queue = new Map();
    for(let stop of markedStops) {
      for(let [route, stopoverIndex] of stop.routes) {
        // If this is the last stop in the route, we can't traverse it.
        if(stopoverIndex < route.stops.length - 1) {
          if(queue.has(route)) {
            queue.set(route, Math.min(queue.get(route), stopoverIndex));
          } else {
            queue.set(route, stopoverIndex);
          }
        }
      }
    }
    return queue;
  }


  findEarliestTrip(route, stopoverIndex, fromDate) {
    // TODO: rewrite this as a binary search?
    return route.trips.find(trip => {
      let tripDeparture = trip.schedule[stopoverIndex][1];
      return tripDeparture > fromDate;
    });
  }

  findTripsBetween(route, stopoverIndex, fromDate, toDate) {
    return route.trips.filter(trip => {
      let tripDeparture = trip.schedule[stopoverIndex][1];
      return tripDeparture >= fromDate && tripDeparture < toDate;
    });
  }


  buildJourneys(connections, toStop) {
    let journeys = [];
    for(let numTrips = 1; numTrips < connections.length; numTrips++) {
      if(connections[numTrips][toStop.id]) {
        journeys.push(this.buildJourney(connections, toStop, numTrips));
      }
    }
    return journeys;
  }

  buildJourney(connections, journeyToStop, numTrips) {
    let journey = new Journey();
    let stop = journeyToStop;
    for(let round = numTrips; round > 0; round--) {
      let [trip, fromStopoverIndex, toStopoverIndex] = connections[round][stop.id];
      journey.insertLeg(trip, fromStopoverIndex, toStopoverIndex);
      stop = trip.route.stops[fromStopoverIndex];
    }

    return journey;
  }


  printJourneys(journeys) {
    for(let journey of journeys) {
      journey.printStats();
      journey.printTable();
    }
  }
}


module.exports = Router;
