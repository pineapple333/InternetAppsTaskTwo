const express = require('express');
var app = module.exports = express()

// const router = express.Router();

// If the user isn't logged in, the user is redirected
// to the login page
const redirectLogin = (req, res, next) => {
    if (!req.session.userId){
        res.redirect('/users/login')
    }else{
        next()
    }
}

// If the user is logged in, the user is redirected
// to main user dashboard
const redirectHome = (req, res, next) => {
    if (req.session.userId){
        if (req.session.is_admin)
            res.redirect('/admin')
        res.redirect('/users/dashboard')
    }else{
        next()
    }
}



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

app.get('/tasks', (req, res) => {

    if (typeof req.session.userId === 'undefined')
        req.session.userId = 1

    var db = req.app.get('db');

    var assigned_rows = []
    var project_task = []

    // db.query(`select parent.contents as parent, child.contents as child from task_relationship as tr left join task as child on tr.child_task = child.id left join task as parent on tr.parent_task = parent.id where parent.id in (select task_id from task_user where user_id = ${req.session.userId});`, (err, rows, fields) => {
    db.query(`select child.id, parent.contents as parent, child.contents as child from task_relationship as tr left join task as child on tr.child_task = child.id left join task as parent on tr.parent_task = parent.id;`, async (err, rows, fields) => {
        if (!err){
            tmp_list = []
            if (rows.length !== 0){

                // get tasks
                await new Promise((resolve, reject) => {
                    db.query(`select * from task_user where user_id = ${req.session.userId}`, (err, rows, fields) => {
                        if (!err){
                            // console.log("Updated the status of the task")
                            assigned_rows = rows
                            resolve()
                        }else{
                            reject()
                            console.log(err);
                        }
                    })
                })

                // get projects
                await new Promise((resolve, reject) => {
                    db.query(`select _project.name, _project.id, pt.task_id from project_task as pt inner join _project on pt.project_id = _project.id;`, (err, rows, fields) => {
                        if (!err){
                            // console.log("Updated the status of the task")
                            project_task = rows
                            resolve()
                        }else{
                            reject()
                            console.log(err);
                        }
                    })
                })

                res.send({
                    all_tasks: buildHierarchy(rows), // all tasks there are
                    assigned: assigned_rows, // tasks assigned to this particular person
                    project_task // this will need to be assigned to the respective task at the front
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
})

app.post('/add_task', (req, res) => {

    if (typeof req.session.userId === 'undefined')
        req.session.userId = 1

    const contents = req.body.contents
    const parent_id = req.body.parent_id // only one parent for each task is supported
    const date_from = req.body.date_from
    const date_to = req.body.date_to
    const project_id = req.body.project_id

    console.log(`Date from: ${date_from}. Date to: ${date_to}`)
    
    var db = req.app.get('db');

    db.query(`select contents, date_to, date_from from task where id = ${parent_id};`, async (err, rows, fields) => {
        if (!err){
            if (rows.length !== 0 && typeof date_from !== 'undefined' && typeof date_to !== 'undefined' ){
                // for each parent task check if new dates are valid
                rows.forEach(async row => {
                    console.log(`date from db: ${new Date(row.date_from).getTime()} date to db: ${new Date(date_to).getTime()}`)
                    if (new Date(row.date_from).getTime() > new Date(date_from).getTime()){
                        res.end("New date is earlier than the beggining of the parent task")
                    }
                    if (new Date(row.date_to).getTime() < new Date(date_to).getTime()){
                        res.end("New date is later than the end of the parent task")
                    }
                });

                const insert_query = `call insert_task('${contents}', '${date_from}', '${date_to}', ${parent_id}, ${project_id});`
                await new Promise((resolve, reject) => {
                    db.query(insert_query, async (err, rows, fields) => {
                        if (!err){
                            resolve()
                        }else{
                            reject()
                            console.log(err);
                        }
                    })
                })
                res.end("Created a new task and a new relationship")
            }else{
                res.end(" There's no such parent task ...")
            }
        }else{
            console.log(err)
        }
    })

})