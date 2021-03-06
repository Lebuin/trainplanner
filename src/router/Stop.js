class Stop {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    // Every route is a tuple (route, stopoverIndex)
    this.routes = [];
  }


  addRoute(route, stopoverIndex) {
    this.routes.push([route, stopoverIndex]);
  }
}

module.exports = Stop;
