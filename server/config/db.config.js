module.exports = {
    HOST: "localhost",
    USER: "webuser",
    PASSWORD: "1234",
    DB: "groupbase",
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };