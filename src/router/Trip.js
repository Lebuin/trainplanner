class Trip {
  constructor(id) {
    this.id = id;
    this.route = null;
    this.stops = [];
    // Every schedule item is a tuple (arrival, departure)
    this.schedule = [];
  }


  addStopover(stop, arrival, departure) {
    this.stops.push(stop);
    this.schedule.push([arrival, departure]);
  }


  setRoute(route) {
    this.route = route;
    this.stops = this.route.stops;
    this.route.addTrip(this);
  }
}

module.exports = Trip;
