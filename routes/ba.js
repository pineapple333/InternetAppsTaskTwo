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