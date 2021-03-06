const myUtil = require('../util');
const Table = require('cli-table');


class Journey {
  constructor() {
    this.legs = [];
  }

  getStop(index) {
    if(index < this.legs.length) {
      let leg = this.legs[index];
      return leg.trip.route.stops[leg.fromStopoverIndex]
    } else {
      let leg = this.legs[this.legs.length - 1];
      return leg.trip.route.stops[leg.toStopoverIndex];
    }
  }

  getTripDeparture(index) {
    let leg = this.legs[index];
    return leg.trip.schedule[leg.fromStopoverIndex][1];
  }
  getTripArrival(index) {
    let leg = this.legs[index];
    return leg.trip.schedule[leg.toStopoverIndex][0];
  }

  get departure() {
    return this.getTripDeparture(0);
  }
  get arrival() {
    return this.getTripArrival(this.legs.length - 1);
  }


  insertLeg(trip, fromStopoverIndex, toStopoverIndex) {
    this.legs.unshift({
      trip,
      fromStopoverIndex,
      toStopoverIndex,
    });
  }


  printStats() {
    console.log(
      'Transfers: %s. Travel time: %s',
      this.legs.length - 1,
      myUtil.formatTimedelta(this.arrival - this.departure),
    );
  }


  printTable() {
    let table = new Table({
      head: ['From', 'To', 'Departure', 'Arrival'],
    });
    for(let i = 0; i < this.legs.length; i++) {
      table.push([
        this.getStop(i).name,
        this.getStop(i + 1).name,
        this.getTripDeparture(i).toISOString(),
        this.getTripArrival(i).toISOString(),
      ])
    }
    console.log(table.toString());
  }
}


module.exports = Journey;
