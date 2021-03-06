const { DataTypes, Model } = require('sequelize');

function stopFactory(sequelize) {
  class Stop extends Model {}

  Stop.init({
    tripId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Trip',
        key: 'id',
      },
      allowNull: false,
    },
    stopId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Stop',
        key: 'id',
      },
      allowNull: false,
    },

    arrival: {
      type: DataTypes.DATE,
    },
    departure: {
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'Stopover',
    freezeTableName: true,
    indexes: [
      {
        fields: ['tripId'],
      },
      {
        fields: ['stopId'],
      },
    ]
  });
}


module.exports = stopFactory;
