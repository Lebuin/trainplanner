const Router = require('./Router');
const { ArgumentParser } = require('argparse');
const myUtil = require('../util');


main();


async function main() {
  let parser = new ArgumentParser({
    description: 'Calculate train routes between two stops',
  });

  parser.register('type', 'date', string => {
    let result = new Date(string);
    if(isNaN(result)) {
      throw new TypeError('could not convert string to date: ' + string);
    }
    return result
  });

  parser.addArgument('from', {
    type: 'int',
    help: 'The id of the departure stop.',
  });
  parser.addArgument('to', {
    type: 'int' ,
    help: 'The id of the arrival stop.',
  });
  parser.addArgument('from-date', {
    type: 'date',
    help: 'The time of departure, as an ISO 8601 string.',
  });
  parser.addArgument('to-date', {
    type: 'date',
    nargs: '?',
    help: 'If passed, a range query is performed from fromDate to toDate.',
  });
  parser.addArgument(['-b', '--with-bike'], {
    action: 'storeTrue',
    help: 'Show routes that take bikes.',
  });


  let rawArgs = parser.parseArgs();
  let args = myUtil.keysToCamelCase(rawArgs);

  let router = new Router();
  await router.init();
  await router.run(args.from, args.to, args.fromDate, args.toDate, args.withBike);
}
