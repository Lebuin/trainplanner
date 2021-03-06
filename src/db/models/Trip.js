const { DataTypes, Model } = require('sequelize');

function tripFactory(sequelize) {
  class Trip extends Model {}

  Trip.init({
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sourceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    takesBikes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Trip',
    freezeTableName: true,
    indexes: [
      {
        fields: ['source'],
      },
      {
        fields: ['sourceId'],
      },
    ]
  });
}


module.exports = tripFactory;
