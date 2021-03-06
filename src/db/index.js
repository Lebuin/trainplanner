const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: __dirname + '/db.sqlite',
  logging: false,
});

const modelNames = ['Stop', 'Trip', 'Stopover'];

modelNames.forEach(async modelName => {
  let modelPath = './models/' + modelName;
  let modelFactory = require(modelPath);
  modelFactory(sequelize);
});


module.exports = sequelize;
