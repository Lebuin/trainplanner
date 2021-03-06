function formatTimedelta(milliseconds) {
  let date = new Date(0);
  date.setSeconds(milliseconds / 1000);
  let str = date.toISOString().substr(11, 8);
  return str;
}


function time() {
    const [seconds, nanos] = process.hrtime();
    return seconds * 1000 + nanos / 1000000;
}


module.exports = {
  formatTimedelta,
  time,
}
