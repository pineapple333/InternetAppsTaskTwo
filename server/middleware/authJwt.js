const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    req.userId = decoded.id;
    next();
  });
};

isExecutor = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "executor") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Require Executor Role!"
      });
      return;
    });
  });
};

isManager = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "manager") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Require Manager Role!"
      });
    });
  });
};

isBA = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
      user.getRoles().then(roles => {
        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "ba") {
            next();
            return;
          }
        }
  
        res.status(403).send({
          message: "Require BA Role!"
        });
      });
    });
  };

isisManagerOrExecutorOrBA = (req, res, next) => {
  User.findByPk(req.userId).then(user => {
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "manager") {
          next();
          return;
        }

        if (roles[i].name === "executor") {
          next();
          return;
        }

        if (roles[i].name === "ba") {
            next();
            return;
          }
      }

      res.status(403).send({
        message: "Require Manager or Executor or BA Role!"
      });
    });
  });
};

const authJwt = {
  verifyToken: verifyToken,
  isManager: isManager,
  isExecutor: isExecutor,
  isBA:isBA,
  isisManagerOrExecutorOrBA: isisManagerOrExecutorOrBA
};

module.exports = authJwt;