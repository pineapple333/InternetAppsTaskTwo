if (process.env.NODE_ENV !== 'production')
{
    require('dotenv').config()
}
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mysql = require('mysql');
const flash = require('connect-flash')
const session = require('express-session')
const passport = require('passport')
const moment = require('moment')
const axios = require('axios')
const stripe = require('stripe')(process.env.STRIPE_SECRET) 

// const initializePassport = require('./config/passport')
// initializePassport(passport, 
//     email => { 
//         return new Promise((resolve, reject) => {
//             var db = app.get('db')
//             db.query("SELECT u.id, u.name, u.surname, u.email, u.pwd FROM user as u WHERE u.email=?", [email], (err, rows, fields) => {
//                 if (!err){
//                     if (rows.length !== 0){
//                         resolve( { 
//                             id: rows[0].id, 
//                             name: rows[0].name, 
//                             sname: rows[0].surname,
//                             email: rows[0].email,  
//                             pwd: rows[0].pwd
//                         } )
//                     }else{
//                         reject(null)
//                     }
//                 }
//                 else
//                     console.log(err);
//             });
//         })
//     },
//     id => { 
//         return new Promise((resolve, reject) => {
//             var db = app.get('db')
//             db.query("SELECT u.id, u.name, u.surname, u.email, u.pwd FROM user as u WHERE u.email=?", [id], (err, rows, fields) => {
//                 if (!err){
//                     if (rows.length !== 0){
//                         resolve( { 
//                             id: rows[0].id, 
//                             name: rows[0].name, 
//                             sname: rows[0].surname,
//                             email: rows[0].email,  
//                             pwd: rows[0].pwd
//                         } )
//                     }else{
//                         reject(null)
//                     }
//                 }
//                 else
//                     console.log(err);
//             });
//         })
//     }
// )

const app = express();

// Passport config
// require("./config/passport")(passport)

// Credentials to connect to mysql
// const cred = require('./config/keys');

// Create connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'webuser',
    password: '1234',
    database: 'groupbase'
});

// Connect
db.connect((err) => {
    if (err){
        throw err;
    }else{
        console.log("MySQL connected.");
    }
});

app.set('db', db);

app.use((req, res, next)=>{
    res.locals.moment = moment;
    res.locals.req = req;
    res.locals.res = res;
    res.locals.axios = axios
    next();
  });

// EJS
// Set Templating Engine
app.use(expressLayouts)
// app.set('layout', './layouts/full-width')
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
// app.set('layout', 'layouts/layout')
app.use('/img', express.static('assets/img'))
app.use('/js', express.static('assets/js'))

// Bodyparser
// app.use(express.json());
// app.use(express.bodyParser());
app.use(express.urlencoded({ limit: '10mb', extended: false}));
app.use(express.json())

// Express session middleware
app.use(session({
    name: process.env.SESSION_NAME,
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    cookie:{
        maxAge: Date.now() + (30 * 86400 * 1000),
        sameSite: true,
        httpOnly: true,
        secure: false
    }
}))
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: 'false',
//     saveUnitialized: false,
//     cookie: { secure: true}
// }))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Connect flash
app.use(flash())

// Global variables
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    next()
})

// Routes
app.use('/', require('./routes/reservation'));
app.use('/users', require('./routes/users'));
app.use('/guests', require('./routes/guests'));
app.use('/reservation', require('./routes/reservation'))
app.use('/admin', require('./routes/admin'))
app.use('/emailConfirmation', require('./routes/emailConfirmation'))
app.use('/manager', require('./routes/manager'))

const PORT = process.env.PORT || 5000;

app.listen(PORT);
