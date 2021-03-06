exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

function buildIndependentHierarchy(rows, project_task, task_status, tasks, all_projects){

  var projects = {}

  var new_task_status = {}
  for (let i = 0; i < task_status.length; i++){
    new_task_status[task_status[i].task_id] = task_status[i].name
  }

  tasks_from_rows = []
  for (let i = 0; i < rows.length; i++)
    tasks_from_rows.push(rows[i].task_id)

  var new_project_task = {}
  var proj_name_id = {}
  for (let i = 0; i < project_task.length; i++){
    if (project_task[i].id in new_project_task){
      new_project_task [project_task[i].task_id].push(project_task[i].name)
      proj_name_id [project_task[i].name] = project_task[i].id
    }
    else{
      new_project_task [project_task[i].task_id] = project_task[i].name
      proj_name_id [project_task[i].name] = project_task[i].id
    }
  }

  console.log(new_project_task)

  for (let i = 0; i < rows.length; i++) {
    if (new_project_task[rows[i].task_id] in projects){
      projects[new_project_task[rows[i].task_id]].push({
        name: rows[i].contents,
        dev_name: rows[i].username,
        status: new_task_status[rows[i].task_id],
        taskid: rows[i].task_id
      })
    }else{
      projects[new_project_task[rows[i].task_id]] = [{
        name: rows[i].contents,
        dev_name: rows[i].username,
        status: new_task_status[rows[i].task_id],
        taskid: rows[i].task_id
      }]
    }
  }

  // add the rest of the projects

  new_projects = []

  for (let i = 0; i < all_projects.length; i++) {
    //Do stuff where key would be 0 and value would be the object
    if ( ! (all_projects[i].name in projects) ){
      // projects [all_projects[i].name] = []
      new_projects.push(
        {
          name: all_projects[i].name,
          projectid: all_projects[i].id,
          tasks: []
        }
      )
    }
  }

  // add the rest of the tasks

  // for (var i = 0; i < tasks.length; i++){
  //   if ( ! (tasks[i].id in tasks_from_rows) ){
  //     console.log(`Adding previously non existant: ${tasks[i].id}`)
  //     projects[new_project_task[tasks[i].id]].push(
  //       {
  //         name: tasks[i].contents,
  //         dev_name: null,
  //         status: new_task_status[tasks[i].id],
  //         taskid: tasks[i].id
  //       }
  //     )
  //   }
  // }

  for (const [key, value] of Object.entries(projects)) {
    //Do stuff where key would be 0 and value would be the object
    new_projects.push(
      {
        name: key,
        projectid: proj_name_id [key],
        tasks: value
      }
    )
  }



  return new_projects
}

function buildHierarchy(rows, project_task, task_status){

  projects = {}

  // group users
  // new_task_user = {}
  // for (let i = 0; i < task_user.length; i++){
  //   new_task_user [task_user[i].task_id] = []
  //   for (let j = 0; j < task_user.length; j++){
  //     if (task_user[i].task_id === task_user[j].task_id && 
  //       !new_task_user [task_user[i].task_id].includes(task_user[j].username)){
  //       new_task_user [task_user[i].task_id].push(task_user[j].username)
  //     }
  //   }
  // }

  var new_task_status = {}
  for (let i = 0; i < task_status.length; i++){
    new_task_status [task_status[i].task_id] = task_status[i].name
  }

  var new_project_task = {}
  var proj_name_id = {}
  for (let i = 0; i < project_task.length; i++){
    if (project_task[i].id in new_project_task){
      new_project_task [project_task[i].task_id].push(project_task[i].name)
      proj_name_id [project_task[i].name] = project_task[i].id
    }
    else{
      new_project_task [project_task[i].task_id] = [project_task[i].name]
      proj_name_id [project_task[i].name] = project_task[i].id
    }
  }

  for (let i = 0; i < rows.length; i++) {
    if (new_project_task[rows[i].task_id] in projects){
      projects[new_project_task[rows[i].task_id]].push({
        name: rows[i].contents,
        dev_name: rows[i].username,
        status: new_task_status[rows[i].task_id],
        taskid: rows[i].task_id
      })
    }else{
      projects[new_project_task[rows[i].task_id]] =[{
        name: rows[i].contents,
        dev_name: rows[i].username,
        status: new_task_status[rows[i].task_id],
        taskid: rows[i].task_id
      }]
    }
  }

  // add the rest of the tasks



  // change to an appropriete format

  new_projects = []

  for (const [key, value] of Object.entries(projects)) {
    //Do stuff where key would be 0 and value would be the object
    new_projects.push(
      {
        name: key,
        projectid: proj_name_id [key],
        tasks: value
      }
    )
  }

  return new_projects
}

exports.allTasks = (req, res) => {

  const mdb = req.app.get('mdb')

  var project_task = []
  var users_task = []
  var task_status = []
  var tasks = []

  var query = ""

  // console.log(`${req.params.userId}`)

  // mdb.query(`select parent.contents as parent, child.contents as child from task_relationship as tr left join task as child on tr.child_task = child.id left join task as parent on tr.parent_task = parent.id where parent.id in (select task_id from task_user where user_id = ${req.session.userId});`, (err, rows, fields) => {   
  
  if (typeof req.params.userId === 'undefined')
    query = `select task_id, users.id as user_id, task.contents, users.username 
      from task_user 
      inner join task on task_user.task_id = task.id 
      inner join users on task_user.user_id = users.id`
  else
    query = `select task_id, users.id as user_id, task.contents, users.username 
      from task_user 
      inner join task on task_user.task_id = task.id 
      inner join users on task_user.user_id = users.id
      where users.id = ${req.params.userId};`

  mdb.query(query, async (err, rows, fields) => {
      if (!err){
          tmp_list = []
          if (rows.length !== 0){

            await new Promise((resolve, reject) => {
                mdb.query(`select _project.id, _project.name as name, task_id
                from project_task
                inner join _project on project_task.project_id = _project.id;`, (err, rows, fields) => {
                    if (!err){
                        project_task = rows
                        resolve()
                    }else{
                        reject()
                        console.log(err);
                    }
                })
            })

            // await new Promise((resolve, reject) => {
            //   mdb.query(`select task_id, users.username from task_user
            //   inner join users on users.id = task_user.user_id;`, (err, rows, fields) => {
            //       if (!err){
            //           console.log("To find users associated with the same task")
            //           users_task = rows
            //           resolve()
            //       }else{
            //           reject()
            //           console.log(err);
            //       }
            //   })
            // })

            await new Promise((resolve, reject) => {
              mdb.query(`select task_id, status.name from task_status
              inner join status on status.id = task_status.status_id;`, (err, rows, fields) => {
                  if (!err){
                      console.log("To statuses of tasks")
                      task_status = rows
                      resolve()
                  }else{
                      reject()
                      console.log(err);
                  }
              })
            })
            
            if (typeof req.params.userId === 'undefined'){

              await new Promise((resolve, reject) => {
                  mdb.query(`select * from task;`, (err, rows, fields) => {
                      if (!err){
                          tasks = rows
                          resolve()
                      }else{
                          reject()
                          console.log(err);
                      }
                  })
              })

              var all_projects = []
              await new Promise((resolve, reject) => {
                mdb.query(`select * from _project;`, (err, rows, fields) => {
                    if (!err){
                        all_projects = rows
                        resolve()
                    }else{
                        reject()
                        console.log(err);
                    }
                })
            })

              res.json({
                all_tasks: buildIndependentHierarchy(rows, project_task, task_status, tasks, all_projects)
              })
            }
            else{
              res.json({
                all_tasks: buildHierarchy(rows, project_task, task_status)
              })
            }
            // res.end()
            // console.log(`${rows.length}`)
            // res.return('users/index', {
            //     contents: `${rows}`
            // })

          }else{
              res.end("There are no tasks for this user.")
          }
      }
  })
};

exports.addTask = async (req, res) => {

  const mdb = req.app.get('mdb')
  
  const contents = req.body.name
  const project_id = req.body.proj_id

  console.log(`Adding a single task: ${contents} ${project_id}`)

  const insert_query = `call insert_task('${contents}', ${project_id});`
  mdb.query(insert_query, (err, rows, fields) => {
      if (!err){
          res.json({message:"The task has been associated with the project"})
      }else{
        console.log(err)
        res.json({message:"The task has NOT been associated with the project. There's been an error."})
      }
  })
}

exports.addTaskToUser = async (req, res) => {

  const mdb = req.app.get('mdb')
  
  const task_id = req.body.task_id
  const user_id = req.body.user_id

  // const insert_query = `call insert_task('${contents}', ${project_id});`
  mdb.query(`select * from task_user where task_id = ${task_id};`, async (outer_err, outer_rows, fields) => {
    if (!outer_err){
        if (outer_rows.length === 0){

          await new Promise((resolve, reject) => {
              mdb.query(`insert into task_user (user_id, task_id) values (${user_id}, ${task_id});`, (inner_err, inner_rows, fields) => {
                  if (!inner_err){
                      resolve()
                  }else{
                      console.log(inner_err);
                      reject()
                  }
              })
          })

          // set the status of a task
          await new Promise((resolve, reject) => {
              mdb.query(`update task_status set status_id = 2 where task_id = ${task_id};`, (inner_err, inner_rows, fields) => {
                  if (!inner_err){
                      resolve()
                  }else{
                      console.log(inner_err);
                      reject()
                  }
              })
          })

          res.json({message: "Assigned the task to the user"})
        }else{
          // set the status of a task
          await new Promise((resolve, reject) => {
            mdb.query(`update task_user set user_id = ${user_id} where task_id = ${task_id};`, (inner_err, inner_rows, fields) => {
                if (!inner_err){
                    resolve()
                }else{
                    console.log(inner_err);
                    reject()
                }
            })
        })

        // set the status of a task
        await new Promise((resolve, reject) => {
            mdb.query(`update task_status set status_id = 2 where task_id = ${task_id};`, (inner_err, inner_rows, fields) => {
                if (!inner_err){
                    resolve()
                }else{
                    console.log(inner_err);
                    reject()
                }
            })
        })
          res.json({message: "The task has been reassigned."})
        }
    }
  })
}

exports.completeTask = async (req, res) => {

  const mdb = req.app.get('mdb')
  
  const task_id = req.params.task_id

  const query = `update task_status set status_id = 6 where task_id = ${task_id};`
  mdb.query(query, async (err, rows, fields) => {
    if (!err){
      res.json({message: "The task has been completed"})
    }else{
      console.log(err)
      res.json({message: "For some reason couldn't make the task completed"})
    }
  })
}

exports.addProject = async (req, res) => {

  const mdb = req.app.get('mdb')
  
  const proj_name = req.body.name

  mdb.query(`select * from _project where name = '${proj_name}';`, async (outer_err, outer_rows, fields) => {
    if (!outer_err){
        if (outer_rows.length === 0){
          await new Promise((resolve, reject) => {
              mdb.query(`insert into _project (name) values ('${proj_name}');`, (inner_err, inner_rows, fields) => {
                  if (!inner_err){
                      resolve()
                  }else{
                      console.log(inner_err);
                      reject()
                  }
              })
          })
          res.json({message: "The new project has been created"})
        }else{
          res.json({message: "This project already exists."})
        }
    }else{
      console.log(outer_err)
      res.json({message: "There's been an error"})
    }
  })
}

exports.deleteProject = async (req, res) => {

  const mdb = req.app.get('mdb')
  
  const proj_id = req.params.proj_id

  connected_tasks = []

  await new Promise((resolve, reject) => {
    mdb.query(`select * from project_task where project_id = ${proj_id};`, (inner_err, inner_rows, fields) => {
        if (!inner_err){
            for (var i = 0; i < inner_rows.length; i++){
              connected_tasks.push(inner_rows[i].task_id)
            }
            resolve()
        }else{
            console.log(inner_err);
            res.json({message: "There was an error while selected all tasks connected with this project"})
            reject()
        }
    })
  })

  console.log(connected_tasks)
  
  if (connected_tasks.length !== 0){
    await new Promise((resolve, reject) => {
        mdb.query(`delete from task_user where task_id in (?);`, [connected_tasks], (inner_err, inner_rows, fields) => {
            if (!inner_err){
                resolve()
            }else{
                console.log(inner_err);
                res.json({message: "There was an error while deleating all users <-> task relationships"})
                reject()
            }
        })
    })
    await new Promise((resolve, reject) => {
        mdb.query(`delete from task_status where task_id in (?);`, [connected_tasks], (inner_err, inner_rows, fields) => {
            if (!inner_err){
                resolve()
            }else{
                console.log(inner_err);
                res.json({message: "There was an error while deleating all task <-> status relationships"})
                reject()
            }
        })
    })
    await new Promise((resolve, reject) => {
        mdb.query(`delete from project_task where project_id = ${proj_id};`, [connected_tasks], (inner_err, inner_rows, fields) => {
            if (!inner_err){
                resolve()
            }else{
                console.log(inner_err);
                res.json({message: "There was an error while deleating all task <-> status relationships"})
                reject()
            }
        })
    })
    // await new Promise((resolve, reject) => {
    //     mdb.query(`delete from task_relationship where parent_id in (?) or child_id = ;`, [connected_tasks], (inner_err, inner_rows, fields) => {
    //         if (!inner_err){
    //             resolve()
    //         }else{
    //             console.log(inner_err);
    //             res.json({message: "There was an error while deleating all task <-> status relationships"})
    //             reject()
    //         }
    //     })
    // })
      await new Promise((resolve, reject) => {
        mdb.query(`delete from task where id in (?);`, [connected_tasks], (inner_err, inner_rows, fields) => {
            if (!inner_err){
                resolve()
            }else{
                console.log(inner_err);
                res.json({message: "There was an error while deleteting all connected tasks"})
                reject()
            }
        })
    })
    await new Promise((resolve, reject) => {
      mdb.query(`delete from _project where id = '${proj_id}';`, async (outer_err, outer_rows, fields) => {
        if (!outer_err){
                resolve()
              }else{
                console.log(outer_err)
                res.json({message: "Problems while deleteting the project record itself"})
                reject()
            }
        })
    })
    res.json({message: "All cleaned up"})
  }else{
    await new Promise((resolve, reject) => {
      mdb.query(`delete from _project where id = '${proj_id}';`, async (outer_err, outer_rows, fields) => {
        if (!outer_err){
                resolve()
              }else{
                console.log(outer_err)
                res.json({message: "Problems while deleteting the project record itself"})
                reject()
            }
        })
    })
    res.json({message: "No connected tasks. Only project record was deleted"})
  }
}