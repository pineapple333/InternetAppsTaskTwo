const express = require('express');
const reservation = require('./reservation');
var app = module.exports = express()

const router = express.Router();

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

// app.get('/new_project', (req,res) => {
//     res.render("new_car/index")
// })

app.post('/new_project', (req,res) => {
    
    const name = req.body.name

    var db = req.app.get('db');

    db.query(`insert into _project (name) values ('${name}');`, async (err, rows, fields) => {
        if (!err){
            // redirect here
            res.end("Created a new project")
        }
    })

    res.end("For some reason we reached the end of the method")
    // res.redirect('/admin')
})

app.post('/assign_task', (req,res) => {

    const user_id = req.body.user_id
    const task_id = req.body.task_id
    // const time_from = req.body.time_from
    // const time_to = req.body.time_to

    var db = req.app.get('db');

    db.query(`select * from task_user where user_id = ${user_id}, task_id = ${task_id};`, async (outer_err, outer_rows, fields) => {
        if (!outer_err){
            if (outer_rows.length === 0){
                await new Promise((resolve, reject) => {
                    db.query(`insert into task_user (user_id, task_id) values (${user_id}, ${task_id});`, (inner_err, inner_rows, fields) => {
                        if (!inner_err){
                            assigned_rows = rows
                            resolve()
                        }else{
                            console.log(err);
                            reject()
                        }
                    })
                })
                res.end("Assigned the task to the user")
            }else{
                res.end("This task has been assigned to this user.")
            }
        }
    })
})

app.get('/assign_task', (req,res) => {

    const user_id = req.session.userId

    var db = req.app.get('db');

    // This select limits the number of executors per one task to 1 by showing only unassigned tasks.
    db.query(`select * from task where id not in (
        select task_id from task_user );`, async (outer_err, outer_rows, fields) => {
        if (!outer_err){
            users = []
            await new Promise((resolve, reject) => {
                db.query(`select * from user where id in (
                    select user_id from user_role where role_id not in (2, 3) 
                ) and id not in (select user_id from task_user);`, (inner_err, inner_rows, fields) => {
                    if (!inner_err){
                        users = inner_rows
                        resolve()
                    }else{
                        console.log(err);
                        reject()
                    }
                })
            })
            // console.log(`Users: ${users}, tasks: ${outer_rows}`)
            tasks = []
            res.send({
                    tasks: outer_rows,
                    users
                })
            res.end()
        }else{
            res.end("There's been an error in the first request.")
        }
    })
})