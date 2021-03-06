const { DataTypes, Model } = require('sequelize');

function stopFactory(sequelize) {
  class Stop extends Model {}

  Stop.init({
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
    parentId: {
      type: DataTypes.INTEGER,
      references: {
        model: Stop,
        key: 'id',
      },
    },

    latitude: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },

    crawledUntil: {
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'Stop',
    freezeTableName: true,
    indexes: [
      {
        fields: ['source'],
      },
      {
        fields: ['sourceId'],
      },
      {
        fields: ['parentId'],
      },
      {
        fields: ['crawledUntil'],
      },
    ]
  });
}


module.exports = stopFactory;
