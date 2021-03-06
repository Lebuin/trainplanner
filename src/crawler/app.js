const sequelize = require('../db');

const crawlerNames = [
  'NMBS',
];
const Crawlers = crawlerNames.map(crawlerName => {
  let crawlerPath = './crawlers/' + crawlerName;
  return require(crawlerPath);
});

const CRAWL_FROM = new Date('2021-03-15 00:00:00Z');
const CRAWL_UNTIL = new Date('2021-03-16 00:00:00Z');

async function main() {
  await sequelize.sync();

  for(let Crawler of Crawlers) {
    let crawler = new Crawler();
    await crawler.init();
    await crawler.crawl(CRAWL_FROM, CRAWL_UNTIL);
  }

  console.log('All done!');
}


main().catch(error => console.trace(error));
