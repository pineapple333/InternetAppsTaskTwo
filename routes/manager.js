const express = require('express')
var app = module.exports = express()
const passport = require('passport')
const { password } = require('../config/keys');
const bcrypt = require('bcryptjs')
const randomstring = require('randomstring')
const nodemailer = require('nodemailer')

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

app.get('/new_project', redirectLogin,  (req,res) => {
    res.render("new_car/index")
})

app.post('/new_project', redirectLogin, (req,res) => {
    
    const name = req.body.name

    var db = req.app.get('db');

    db.query(`insert into _project (name) values (${name});`, async (err, rows, fields) => {
        if (!err){
            // redirect here
        }
    })

    res.redirect('/admin')
})

app.post('/assign_task', redirectLogin, (req,res) => {

    const user_id = req.body.user_id
    const task_id = req.body.task_id
    // const time_from = req.body.time_from
    // const time_to = req.body.time_to

    var db = req.app.get('db');

    db.query(`insert into task_user (user_id, task_id) values (${user_id}, ${task_id});`, async (err, rows, fields) => {
        if (!err){
            res.end("Assigned the task to the user")
        }
    })
})

module.exports = router