const Router = require('./Router');


main();


async function main() {
  let args = process.argv.slice(2);
  await runRouter(...args);
}


async function runRouter(from, to, fromDateStr, toDateStr) {
  if(fromDateStr == null) {
    throw new Error('Usage: node app.js from  to date');
  }

  let fromDate = new Date(fromDateStr);
  if(isNaN(fromDate)) {
    throw new Error('Invalid date: ' + fromDateStr);
  }

  let toDate = null;
  if(toDateStr) {
    toDate = new Date(toDateStr);
    if(isNaN(toDate)) {
      throw new Error('Invalid date: ' + toDateStr);
    }
  }

  let router = new Router();
  await router.init();
  await router.run(from, to, fromDate, toDate);
}
