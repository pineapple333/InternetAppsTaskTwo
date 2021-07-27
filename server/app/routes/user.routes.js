const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/test/all", controller.allAccess);

  app.get(
    "/api/test/user",
    [authJwt.verifyToken],
    controller.userBoard
  );

  app.get(
    "/api/test/manager",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.moderatorBoard
  );

  app.get(
    "/api/test/ba",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  app.get(
    "/api/test/executor",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  app.get(
    "/api/tasks/:userId",
    [authJwt.verifyToken],
    controller.allTasks
  );

  app.get(
    "/api/tasks",
    [authJwt.verifyToken],
    controller.allTasks
  );

  app.post(
    "/api/task",
    [authJwt.verifyToken],
    controller.addTask
  );

  app.post(
    "/api/developer",
    [authJwt.verifyToken],
    controller.addTaskToUser  
  );

  app.put(
    "/api/task/:task_id",
    [authJwt.verifyToken],
    controller.completeTask  
  );

  app.post(
    "/api/project",
    [authJwt.verifyToken],
    controller.addProject 
  );

  app.delete(
    "/api/project/:proj_id",
    [authJwt.verifyToken],
    controller.deleteProject 
  );
};
