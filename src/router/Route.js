const util = require('util');

class Route {
  static buildId(stops, takesBikes) {
    let stopStr = stops
      .map(stop => stop.id)
      .join('-');

    return util.format('%s:%s', stopStr, takesBikes);
  }


  constructor(stops, takesBikes) {
    this.id = Route.buildId(stops, takesBikes);
    this.stops = stops;
    this.takesBikes = takesBikes;
    this.trips = [];

    for(let i = 0; i < stops.length; i++) {
      stops[i].addRoute(this, i);
    }
  }


  addTrip(trip) {
    this.trips.push(trip);
  }

  orderTrips() {
    this.trips.sort((t1, t2) => t1.schedule[0].departure - t2.schedule[0].departure);
  }
}

module.exports = Route;
