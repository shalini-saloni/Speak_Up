const path = require('path');
const { Sequelize } = require('sequelize');

function createSequelize() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    return new Sequelize(databaseUrl, {
      logging: false,
    });
  }

  const storage = process.env.SQLITE_PATH || path.join(process.cwd(), 'data.sqlite');
  return new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
  });
}

const sequelize = createSequelize();

module.exports = { sequelize };

