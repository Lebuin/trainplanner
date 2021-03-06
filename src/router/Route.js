class Route {
  static buildId(stops) {
    return stops
      .map(stop => stop.id)
      .join('-');
  }


  constructor(stops) {
    this.id = Route.buildId(stops);
    this.stops = stops;
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
