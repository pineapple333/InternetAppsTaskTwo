const express = require('express')
var app = module.exports = express()
const passport = require('passport')

// If the user isn't logged in, the user is redirected
// to the login page
const redirectLogin = (req, res, next) => {
    if (!req.session.auth){
        res.redirect('/users/login')
    }else{
        next()
    }
}

// If the user is logged in, the user is redirected
// to main user dashboard
const redirectHome = (req, res, next) => {
    if (req.session.auth){
        res.redirect('/users/dashboard')
    }else{
        next()
    }
}

app.get('/', (req,res)=>{
    res.render('emailConfirmation')
})

app.post("/", (req,res) => {
    const code = req.body.code
    const email = req.body.email
    if (!code || !email)
        res.render({
            errors: [{ msg: 'Fill in all fields' }]
        })
    console.log("Started email check");
    var db = req.app.get('db')
    console.log(`Email being confirmed: ${email}`);
    console.log(`Code being confirmed: ${code}`);
    db.query("SELECT user_code.user_id as uid FROM user INNER JOIN user_code ON\
    user.id=user_code.user_id WHERE user.email=? AND user_code.code=?;", 
    [email, code], (err, rows, fields) => {
        if (!err) {
            console.log(`Code being confirmed: ${rows[0].uid}`);
            if (rows[0].uid){
                db.query("UPDATE user SET status=1 WHERE id=?;", 
                [rows[0].uid], (err, rows, fields) => {
                    if (!err) {
                        res.redirect('/users/login')
                    }else{
                        res.render('emailConfirmation',{
                            errors: [{ msg: 'Internal error. Couldn\'t update user record' }]
                        })
                    }
                });
            }else{
                res.render('emailConfirmation',{
                    errors: [{ msg: 'There\'s no such user' }]
                })
            }
        }else{
            res.render('emailConfirmation',{
                errors: [{ msg: 'Internal error. Couldn\'t update user record' }]
            })
        }
    });
})

app.post("/resend", redirectHome, (req,res) => {
    
})