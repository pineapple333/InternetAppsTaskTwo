const express = require('express');
const { password } = require('../config/keys');
const passport = require('passport')
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

// Login
router.get('/login', redirectHome, (req,res) => {
    res.render('login');
});

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

    // create a recursive structure

    // for ( let [ outer_key, outer_value ] of Object.entries(resultHT) ) {
    //     // finalHT [outer_key] = []
    //     for ( let j = 0; j < outer_value.length; j++ ) { // go over an array of dependant tasks
    //         // console.log(`${outer_value[j]} in ${String(Object.keys(resultHT))} ? ${outer_value[j] in Object.keys(resultHT)}`)
    //         if ( String(Object.keys(resultHT)).includes(outer_value[j]) ){ // if true replace  string with corresponding array
    //             console.log(resultHT[outer_key][j])
    //             resultHT[outer_key][j].push(resultHT[outer_value[j]])
    //         }else{
    //             resultHT[outer_key][j].push(outer_value[j])
    //         }
    //     }
    // }
    // return finalHT

    return resultHT
}

router.get('/tasks', (req, res) => {

    if (typeof req.session.userId === 'undefined')
        req.session.userId = 1
    if (req.session.is_admin){
        res.redirect('/admin')
        return
    }

    var db = req.app.get('db');

    var assigned_rows = []

    // db.query(`select parent.contents as parent, child.contents as child from task_relationship as tr left join task as child on tr.child_task = child.id left join task as parent on tr.parent_task = parent.id where parent.id in (select task_id from task_user where user_id = ${req.session.userId});`, (err, rows, fields) => {
        db.query(`select child.id, parent.contents as parent, child.contents as child from task_relationship as tr left join task as child on tr.child_task = child.id left join task as parent on tr.parent_task = parent.id;`, async (err, rows, fields) => {
        if (!err){
            tmp_list = []
            if (rows.length !== 0){

                await new Promise((resolve, reject) => {
                    db.query(`select * from task_user where user_id = ${req.session.userId}`, (err, rows, fields) => {
                        if (!err){
                            console.log("Updated the status of the task")
                            assigned_rows = rows
                            resolve()
                        }else{
                            reject()
                            console.log(err);
                        }
                    })
                })

                res.send({
                    all_tasks: buildHierarchy(rows), // all tasks there are
                    assigned: assigned_rows // tasks assigned to this particular person
                })
                res.end()
                // console.log(`${rows.length}`)
                // res.return('users/index', {
                //     contents: `${rows}`
                // })
            }
        }
    })

})

router.put('/update_task/:task_id', (req, res) => {

    const task_id = req.params.task_id
    const date_from = req.body.date_from
    const date_to = req.body.date_to

    console.log(`Date from: ${date_from}. Date to: ${date_to}`)
    
    var db = req.app.get('db');

    db.query(`select contents, date_to, date_from from task where id in (select parent_task from task_relationship where child_task = ${task_id});`, async (err, rows, fields) => {
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
                
                const query = `update task set date_from = '${date_from}', date_to = '${date_to}' where id = ${task_id};`
                console.log("Executed outer ...")
                await new Promise((resolve, reject) => {
                    db.query(query, async (err, rows, fields) => {
                        if (!err){
                            const query = `update task_status set status_id = 3 where task_id = ${task_id};`
                            await new Promise((resolve, reject) => {
                                db.query(query, (err, rows, fields) => {
                                    if (!err){
                                        console.log("Updated the status of the task")
                                        resolve()
                                    }else{
                                        reject()
                                        console.log(err);
                                    }
                                })
                            })
                            resolve()
                        }else{
                            reject()
                            console.log(err);
                        }
                    })
                })
                res.end("Updated")
            }else{
                res.end(" Can't find this task ...")
            }
        }
    })
})

router.post("/finish_task/:task_id", (req, res) => {

    var db = req.app.get('db')

    const task_id = req.params.task_id

    const query = `update task_status set status_id = 6 where task_id = ${task_id};`
    db.query(query, (err, rows, fields) => {
        if (!err){
            res.send("Markted the task as done")
        }else{
            console.log(err);
        }
    })

})

router.post("/accept_task/:task_id", (req, res) => {

    var db = req.app.get('db')

    const task_id = req.params.task_id

    const query = `update task_status set status_id = 4 where task_id = ${task_id};`
    db.query(query, (err, rows, fields) => {
        if (!err){
            res.send("Markted the task as accepted")
        }else{
            console.log(err);
        }
    })

})

router.get("/projects", (req, res) => {

    if (typeof req.session.userId === 'undefined')
        req.session.userId = 1
    if (req.session.is_admin){
        res.redirect('/admin')
        return
    }

    console.log(`Session ID: ${req.session.userId}`)

    var db = req.app.get('db');
    db.query(`SELECT user.id as user_id, registration.status as status_code, registration.id as reg_id, user.id as _id, user.name as uname, user.surname as sname, DATE(registration.date_from) as dfrom,\
    DATE(registration.date_to) as dto, registration_status.name as status, car.photo as photo, registration.price as cost  \
    FROM registration INNER JOIN user ON registration.user_id=user.id\
    INNER JOIN registration_status ON registration.status=registration_status.id\
    INNER JOIN car ON registration.car_id=car.id\
    WHERE user.id=${id};`, 
    async (err, rows, fields) => {
        if (!err){
            if (rows.length !== 0){
                // res.status(200).send(`Your reservations: ${JSON.stringify(rows.filter(row => active_filters.includes(row.status)))}"`);
                // res.redirect('/users/dashboard', {title: "Your dashboard", items: rows.filter(row => active_filters.includes(row.status))})
                res.return('users/index', {
                    rows
                })
            }
        }
        else console.log(err);
    });

})



// Main user dashboard
router.get('/dashboard', redirectLogin, (req,res)=>{
    // res.send(`Hello ${req.user.name} ${req.user.sname}`)

    if (typeof req.session.userId === 'undefined')
        req.session.userId = 18
    if (req.session.is_admin){
        res.redirect('/admin')
        return
    }

    console.log(`Session ID: ${req.session.userId}`)

    const id = req.session.userId
    const is_awaiting = req.query.is_awaiting
    const is_returned = req.query.is_returned
    const is_approved = req.query.is_approved
    const is_declined = req.query.is_declined
    const is_payed = req.query.is_payed


    const active_filters = []
    if (is_awaiting === "on") active_filters.push("Awaiting")
    if (is_returned === "on") active_filters.push("Returned")
    if (is_approved === "on") active_filters.push("Approved")
    if (is_declined === "on") active_filters.push("Declined")
    if (is_payed === "on") active_filters.push("Payed")

    if (!is_awaiting && !is_returned && !is_approved && !is_declined && !is_payed){
        // local_states = req.local.states
        active_filters.push("Awaiting")
        active_filters.push("Returned")
        active_filters.push("Approved")
        active_filters.push("Declined")
        active_filters.push("Payed")
    }

    console.log(active_filters);

    var db = req.app.get('db');
    db.query(`SELECT user.id as user_id, registration.status as status_code, registration.id as reg_id, user.id as _id, user.name as uname, user.surname as sname, DATE(registration.date_from) as dfrom,\
    DATE(registration.date_to) as dto, registration_status.name as status, car.photo as photo, registration.price as cost  \
    FROM registration INNER JOIN user ON registration.user_id=user.id\
    INNER JOIN registration_status ON registration.status=registration_status.id\
    INNER JOIN car ON registration.car_id=car.id\
    WHERE user.id=${id};`, 
    async (err, rows, fields) => {
        if (!err){
            if (rows.length !== 0){
                // res.status(200).send(`Your reservations: ${JSON.stringify(rows.filter(row => active_filters.includes(row.status)))}"`);
                // res.redirect('/users/dashboard', {title: "Your dashboard", items: rows.filter(row => active_filters.includes(row.status))})
                var messages = await new Promise((resolve, reject) => {
                    db.query("SELECT action FROM log WHERE user_id=?;", [rows[0].user_id], (err, action_rows, fields) => {
                            if (!err) {
                                if (rows.length !== 0){
                                    // messages = action_rows
                                    resolve( action_rows )
                                }else{
                                    reject([])
                                }
                            }
                            else console.log(err);
                    });
                })
                
                res.render('users/index', {
                    name: `${rows[0].uname} ${rows[0].sname}`,
                    rows: rows.filter(row => active_filters.includes(row.status)),
                    states: {
                        awaiting: is_awaiting,
                        approved: is_approved,
                        returned: is_returned,
                        declined: is_declined,
                        payed: is_payed
                    },
                    key: process.env.STRIPE_PUBLIC,
                    messages
                })
            }
            else {
                db.query(`SELECT user.name as uname, user.surname as sname FROM user WHERE id=${req.session.userId};`, 
                (err, rows, fields) => {
                    if (!err){
                        res.render('users/index', {
                            name: `${rows[0].uname} ${rows[0].sname}`,
                            // rows: rows.filter(row => active_filters.includes(row.status)),
                            rows: {},
                            states: {
                                awaiting: is_awaiting,
                                approved: is_approved,
                                returned: is_returned,
                                declined: is_declined,
                                payed: is_payed
                            }
                        })  
                    }
                })
                // res.status(200).send(`There're no reservations`);
            }
        }
        else console.log(err);
    });
})

router.put('/dashboard', redirectLogin, (req,res)=>{
    // res.send(`Hello ${req.user.name} ${req.user.sname}`)

    if (typeof req.session.userId === 'undefined')
        req.session.userId = 18
    console.log(`Session ID: ${req.session.userId}`)
    const id = req.session.userId
    const is_awaiting = req.data.is_awaiting
    const is_returned = req.data.is_returned
    const is_approved = req.data.is_approved
    const is_declined = req.data.is_declined

    const active_filters = []
    if (is_awaiting === "true") active_filters.push("Awaiting")
    if (is_returned === "true") active_filters.push("Returned")
    if (is_approved === "true") active_filters.push("Approved")
    if (is_declined === "true") active_filters.push("Declined")

    if (!is_awaiting && !is_returned && !is_approved && !is_declined){
        active_filters.push("Awaiting")
        active_filters.push("Returned")
        active_filters.push("Approved")
        active_filters.push("Declined")
    }

    console.log(active_filters);

    var db = req.app.get('db');
    db.query(`SELECT registration.id as reg_id, user.id as _id, user.name as uname, user.surname as sname, DATE(registration.date_from) as dfrom,\
    DATE(registration.date_to) as dto, registration_status.name as status, registration.price as cost, car.photo as photo\
    FROM registration INNER JOIN user ON registration.user_id=user.id\
    INNER JOIN registration_status ON registration.status=registration_status.id\
    INNER JOIN car on registration.car_id=car.id WHERE user.id=${id};`, 
    (err, rows, fields) => {
        if (!err){
            if (rows.length !== 0){
                // res.status(200).send(`Your reservations: ${JSON.stringify(rows.filter(row => active_filters.includes(row.status)))}"`);
                // res.redirect('/users/dashboard', {title: "Your dashboard", items: rows.filter(row => active_filters.includes(row.status))})
                res.render('users/index', {
                    name: `${rows[0].uname} ${rows[0].sname}`,
                    rows: rows.filter(row => active_filters.includes(row.status))
                })
            }
            else {
                db.query(`SELECT user.name as uname, user.surname as sname FROM user WHERE id=${req.session.userId};`, 
                (err, rows, fields) => {
                    if (!err){
                        res.render('users/index', {
                            name: `${rows[0].uname} ${rows[0].sname}`,
                            rows: rows.filter(row => active_filters.includes(row.status))
                        })  
                    }
                })
                // res.status(200).send(`There're no reservations`);
            }
        }
        else console.log(err);
    });
})

router.get('/dashboard/car',  redirectLogin, (req, res)=>{

    const car_id = req.query.id

    var db = req.app.get('db');
    db.query(`SELECT car.name, car.passengers, car.capacity, car_type.type as car_type, fuel.type as fuel,\
    transmision.type as transmision, drive.type as drive\
    FROM car INNER JOIN car_type ON car.type=car_type.id INNER JOIN fuel ON car.fuel=fuel.id\
    INNER JOIN transmision ON car.transmision=transmision.id INNER JOIN drive ON\
    car.drive=drive.id WHERE car.id=${car_id};`, 
    (err, rows, fields) => {
        if (!err){
            if (rows.length !== 0)
                res.status(200).send(`Your reservations: ${JSON.stringify(rows)}"`);
            else 
                res.status(200).send(`There currently no reservations in the list"`);
        }
        else console.log(err);
    });

})

// register
router.get('/register', redirectHome, (req,res) => {
    res.render('register');
});

router.post('/register', redirectHome, async (req,res) => {

    // var { name, sname, email, pwd, pwd2 } = req.body;

    const name = req.body.name
    const sname = req.body.sname
    const email = req.body.email
    const pwd = req.body.password
    const pwd2 = req.body.password2

    let errors = [];

    // Check required fields
    if(!name || !sname || !email || !pwd || !pwd2){
        errors.push({ msg: 'Please fill in all fields'});
    }

    // Check if passwords mathch
    if (pwd != pwd2){
        errors.push({ msg: 'Passwords don\'t mathch'});
    }

    // Check password length
    if (pwd.length < 6){
        errors.push({ msg: 'Passwords should be at least 6 characters long'});
    }

    if (errors.length > 0){
        res.render('register', {
            errors,
            name,
            sname,
            email,
            pwd,
            pwd2
        });
        console.log(errors);
        
    }else{

        // res.send('pass');

        // Validation pass
        var db = req.app.get('db');
        var status = 0;
        
        // Hashing the password
        // const salt = await bcrypt.genSalt(10)
        // const pwdh = await bcrypt.hash(pwd, salt)

        const hashedPassword = await bcrypt.hash(pwd, 10)

        // Check if exists
        db.query("SELECT u.name, u.surname, u.email, u.pwd FROM user as u WHERE u.email=?", [email], (err, rows, fields) => {
            if (!err){
                if (rows.length !== 0 && bcrypt.compare(pwd, rows[0].pwd)){
                    // res.send(`Such user already exists: ${JSON.stringify(rows)}"`);
                    res.render('register', {
                        errors: [{ msg: 'This user already exists'}],
                        name,
                        sname,
                        pwd,
                        pwd2
                    });
                }else{
                    db.query("SELECT insert_new_user(?,?,?,?) as user_id;", [name, sname, email, hashedPassword], async (err, rows, fields) => {
                        if (!err) {
                            // req.flash('success_msg', 'You\'ve been registered and now can log in')
                            const user_id = Number(rows[0].user_id)
                            req.session.userId = user_id
                            req.session.auth = false
                            const secretString = randomstring.generate(64)
                            req.session.secretString = secretString
                            // Step1
                            let transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: process.env.EMAIL,
                                    pass: process.env.EMAIL_PWD
                                }
                            })
                            // Step2
                            let mailOptions = {
                                from: process.env.EMAIL,
                                to: email,
                                subject: 'Secret password',
                                text: `Your secret string is: ${secretString}. Input URL: http://localhost:5000/emailConfirmation`
                            }
                            // Step 3
                            transporter.sendMail(mailOptions, (err, data) => {
                                if (err) console.log("Error occured while sending a confirmation secret string");
                                else console.log("Email has been sent")
                            })
                            db.query("INSERT INTO user_code (user_id, code) VALUES (?, ?);", [user_id, secretString], async (err, rows, fields) => {
                                if (!err) {
                                }
                            })
                            res.redirect("/emailConfirmation")
                        }
                        else console.log(err);
                    });
                }
            }
            else
                console.log(err);
        });
    }
});

router.post('/login', redirectHome, (req,res) => {
    const email = req.body.email
    const pwd = req.body.password
    var db = req.app.get('db');
    db.query("SELECT u.id, u.name, u.surname, u.email, u.pwd, u.status FROM user as u WHERE u.email=?", [email], async (err, rows, fields) => {
        if (!err){
            if (rows.length !== 0){
                const user = { 
                    id: rows[0].id, 
                    name: rows[0].name, 
                    sname: rows[0].surname,
                    email: rows[0].email,  
                    pwd: rows[0].pwd,
                    status: rows[0].status
                }
                if (user == null) {
                    // res.send(null, false, { message: "No user with that email"})
                    res.render('login', {
                        errors: [{msg: "No such user"}]
                    });
                }else{
                    try{
                        if (await bcrypt.compare(pwd, user.pwd)){
                            console.log(`Found user ${JSON.stringify(user)}`);
                            if (user.status != 1){
                                res.render('login', {
                                    errors: [{msg: "Confirm your email"}]
                                });
                            }
                            req.session.userId = user.id
                            req.session.auth = true
                            if (email === "admin@admin.com"){
                                req.session.is_admin = true
                                return res.redirect('/admin')
                            }
                            else
                                req.session.is_admin = false
                            return res.redirect('/users/dashboard')
                        }else{
                            res.redirect('/users/login')
                        }
                    }catch(e) {
                        return done(e)
                    }
                }
            }else{
                res.redirect('login')
            }
        }
        else 
            console.log(err);
    });
})

router.get('/logout', (req,res) => {
    req.session.destroy(err => {
        if(err){
            return res.redirect('/users/dashboard')
        }
        res.clearCookie(process.env.SESSION_NAME)
        res.redirect('/users/login')
    })
})

// router.post('/login', passport.authenticate('local', {
//     successRedirect: `/users/dashboard`,
//     failureRedirect: '/users/login'
// }))

// Login handle
// router.post('/login', (req,res,next) =>{
//     passport.authenticate('local-login',{
//         successRedirect: '/users/dashboard',
//         failureRedirect: '/users/login'
//         // failureFlash: true
//     })(req,res,next)
// })

// function checkAuthenticated(req,res,next){
//     if(req.user){
//         req.next()
//     }

//     res.redirect('/users/login')
// }

router.get('/payment', redirectLogin,  function(req, res){

    var db = req.app.get('db')

    const reg_id = req.query.reg_id

    db.query(`UPDATE registration SET status = 5 WHERE id = ${reg_id};`, 
    async (err, rows, fields) => {
        await new Promise((resolve, reject) => {
            user_id = req.session.is_admin ? user_id : req.session.userId
            // const message = req.session.is_admin ? `Admin updated ${reg_id}` : `You updated ${reg_id}`
            db.query(`INSERT INTO log (user_id, action) VALUES (?,?);`,
            [user_id, `You payed ${reg_id}`], (err, rows, fields) => {
                    if (!err) {
                        resolve()
                    }else{
                        reject()
                        console.log(err);
                    }
            });
        })
        res.redirect('/users/dashboard')
        return
    })
    
    // stripe.customers.create({
    //     email: req.body.stripeEmail,
    //     source: req.body.stripeToken
    //   })
    //   .then(customer => stripe.charges.create({
    //     amount,
    //     description: 'A car',
    //     currency: 'usd',
    //     customer: customer.id
    //   }))
    //   .then(charge => {
    //       db.query(`UPDATE registration SET status = 5 WHERE id=${req.body.reg_id};`, 
    //       (err, rows, fields) => {
    //           if (!err){
    //             res.redirect('/users/dashboard')
    //           }else{
    //             res.render('Couldn\'t update the registration status')
    //           }
    //       })
    //   });
}) 

module.exports = router