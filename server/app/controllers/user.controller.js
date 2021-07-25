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


function buildHierarchy(rows, target, alreadyIn){

  resultHT = {}

  for (let i = 0; i < rows.length; i++) {
      resultHT [rows[i].parent] = [rows[i].child]
      for (let j = 0; j < rows.length; j++) {
          if (rows[i] === rows[j])
              continue
          if (rows[i].parent === rows[j].parent)
              resultHT [rows[i].parent].push(rows[j].child)
      }
  }

  return resultHT
}

exports.allTasks = (req, res) => {

  const mdb = req.app.get('mdb')

  // var assigned_rows = []

  // console.log(`${req.params.userId}`)

  // mdb.query(`select parent.contents as parent, child.contents as child from task_relationship as tr left join task as child on tr.child_task = child.id left join task as parent on tr.parent_task = parent.id where parent.id in (select task_id from task_user where user_id = ${req.session.userId});`, (err, rows, fields) => {
      mdb.query(`select parent.contents as parent, child.contents as child from task_relationship as tr left join task as child on tr.child_task = child.id left join task as parent on tr.parent_task = parent.id where parent.id in (select task_id from task_user where user_id = ${req.params.userId});`, async (err, rows, fields) => {
      if (!err){
          tmp_list = []
          if (rows.length !== 0){

              // await new Promise((resolve, reject) => {
              //     mdb.query(`select * from task_user where user_id = ${req.params.userId}`, (err, rows, fields) => {
              //         if (!err){
              //             console.log("Read all rows assigned to this user")
              //             assigned_rows = rows
              //             resolve()
              //         }else{
              //             reject()
              //             console.log(err);
              //         }
              //     })
              // })

              console.log(`Sending the response...`)
              mdb.end()
              res.send({
                  all_tasks: buildHierarchy(rows), // all tasks there are
                  // assigned: assigned_rows // tasks assigned to this particular person
              })
              res.end()
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
