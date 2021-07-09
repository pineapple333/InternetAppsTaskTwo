const express = require('express')
var app = module.exports = express()
const passport = require('passport')

app.get('/dropdown', (req,res)=>{
    console.log("Dropdown");
})

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

app.post('/card/:reg_id', redirectLogin, (req,res)=>{

    const reg_id = req.params.reg_id

    console.log(`All incoming: ${reg_id}`);

    console.log(`Data: ${req.body.element}`);

    var db = req.app.get('db');

    db.query(`SELECT * FROM registration WHERE registration.id=${reg_id};`, 
    (err, reg_rows, fields) => {
        if (!err){
            if (reg_rows.length !== 0){
                db.query(`SELECT * FROM user WHERE id=${reg_rows[0].user_id};`, 
                (err, user_rows, fields) => {
                    if (!err){
                        if (user_rows.length !== 0){
                            db.query(`SELECT car.name, car.passengers, car.capacity, car_type.type as car_type, fuel.type as fuel,\
                            transmision.type as transmision, drive.type as drive\
                            FROM car INNER JOIN car_type ON car.type=car_type.id INNER JOIN fuel ON car.fuel=fuel.id\
                            INNER JOIN transmision ON car.transmision=transmision.id INNER JOIN drive ON\
                            car.drive=drive.id WHERE car.id=${reg_rows[0].car_id};`, 
                            (err, car_rows, fields) => {
                                if (!err){
                                    if (car_rows.length !== 0){
                                        res.render(`users/index`, {
                                            rows: reg_rows,
                                            ud: user_rows,
                                            cd: car_rows,
                                            states: {},
                                            reg_id,
                                            key:0
                                        })
                                    }else 
                                        res.status(200).send(`There currently no reservations in the list"`);
                                }
                                else console.log(err);
                            });
                        }else 
                            res.status(200).send(`There currently no reservations in the list"`);
                    }
                    else console.log(err);
                });
            }else 
                res.status(200).send(`There currently no reservations in the list"`);
        }
        else console.log(err);
    });
})

app.get('/', redirectLogin, (req,res)=>{
    // res.send(`Hello ${req.user.name} ${req.user.sname}`)

    const is_awaiting = req.query.is_awaiting
    const is_returned = req.query.is_returned
    const is_approved = req.query.is_approved
    const is_declined = req.query.is_declined
    const is_payed = req.query.is_payed

    const local_states = {}

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
    db.query(`SELECT registration.status as status_code, registration.id as reg_id, user_id, car_id, registration_status.name as status,\
    car.photo as photo, user.name as uname, user.surname as sname, registration.price as cost, registration.date_from as dfrom, registration.date_to as dto\
    FROM registration\
    INNER JOIN registration_status ON registration.status=registration_status.id\
    INNER JOIN car ON registration.car_id=car.id
    INNER JOIN user ON registration.user_id=user.id;`, 
    (err, rows, fields) => {
        if (!err){
                // res.status(200).send(`Your reservations: ${JSON.stringify(rows.filter(row => active_filters.includes(row.status)))}"`);
                // res.redirect('/users/dashboard', {title: "Your dashboard", items: rows.filter(row => active_filters.includes(row.status))})
                console.log(rows.length);
                // if (!local_states)
                //     local_states = req.local.states
                res.render('admin/index', {
                    name: "Admin",
                    rows: rows.filter(row => active_filters.includes(row.status)),
                    states: {
                        awaiting: is_awaiting,
                        approved: is_approved,
                        returned: is_returned,
                        declined: is_declined,
                        payed: is_payed
                    },
                    key: process.env.STRIPE_SECRET,
                    cd:{},
                    ud:{},
                    reg_id: 0
                })
        }
        else console.log(err);
    });
})

app.post("/", redirectLogin, (req,res) => {

    var db = req.app.get('db');

    const reg_id = req.body.reg_id
    const status = req.body.status

    db.query(`UPDATE registration SET status=${status} WHERE id=${reg_id};`, 
        (err, car_rows, fields) => {
            if (!err){
                if (car_rows.length !== 0){
                    res.status(200).send(`Changed reservation`);
                }else 
                    res.status(200).send(`There currently no reservations in the list"`);
            }
            else console.log(err);
    });
})

app.put("/", redirectLogin,  (req,res) => {

    var db = req.app.get('db');

    const {res_id, date_from, date_to} = req.body;
    
    var date1 = new Date(date_from);
    var date2 = new Date(date_to);

    db.query(`SELECT car_id, status, DATE_FORMAT(date_from, '%Y-%m-%d') as date_from, DATE_FORMAT(date_to, '%Y-%m-%d') as date_to FROM registration WHERE id=${res_id};`,
    (err, rows, fields) => {
        if (!err && Number(rows[0].status) !== 5 && Number(rows[0].status) !== 4){
            db.query(`SELECT DATE_FORMAT(date_from, '%Y-%m-%d') as date_from, DATE_FORMAT(date_to, '%Y-%m-%d') as date_to FROM registration WHERE car_id=${rows[0].car_id};`,
            (err, rows, fields) => {
                console.log(`Rows length: ${rows.length}`)
                if (rows.length !== 0){
                    // res.status(200).send(`Test:\
                    // ${JSON.stringify(rows)}`);
                    var status = true;
                    for (const row of rows){
                        const old_date_from = row.date_from
                        const old_date_to = row.date_to
                        console.log(date2, (new Date(old_date_from)));
                        console.log(date1 , (new Date(old_date_to)));
                        console.log(date2.getTime() <= (new Date(old_date_from).getTime()));
                        console.log(date1.getTime() >= (new Date(old_date_to).getTime()));
                        if (!(date2 <= (new Date(old_date_from).getTime()) || 
                            (date1 >= (new Date(old_date_to).getTime())))){
                            status = false;
                        }
                    }
                    if (status){
                        db.query(`UPDATE registration SET date_from=?, date_to=?,\
                        status=1 WHERE id=${res_id}`, [date_from, date_to], (err, rows, fields) => {
                            if (!err) {
                                console.log("Updated")
                                res.send("Updated")
                                return;
                            }
                            else console.log(err);
                        });
                    }else{
                        console.log("This car is taken")
                        res.send("This car is taken")
                        return;
                    }
                    
                }else{
                    console.log("No such reservation")
                }
            })
        }
        else {
            res.send("Can't change reservation that is approved or payed")
            console.log(err);
        }
    }) 
})

app.delete("/", redirectLogin,  (req,res) =>{

    var db = req.app.get('db');

    const reg_id=req.query.reg_id

    db.query(`SELECT status FROM registration WHERE id=${reg_id};`,
        (err, status_rows, fields) => {
        if (status_rows.length !== 0){
            if (Number(status_rows[0].status) !== 5 && Number(status_rows[0].status) !== 4){
                db.query(`DELETE FROM registration WHERE id=${reg_id};`, 
                (err, rows, fields) => {
                    if (!err) {
                        console.log("Updated")
                        res.send("Updated")
                        return;
                    }
                    else console.log(err);
                });
            }else{
                console.log("Can't delete approved or payed reservation")
                res.send("Can't delete approved or payed reservation")
                return;
            }
            
        }else{
            console.log("No such reservation")
        }
    })
})

app.get("/car", redirectLogin,  (req,res) => {

    var db = req.app.get('db');

    db.query(`SELECT car.name, car.passengers, car.capacity, car_type.type as car_type, fuel.type as fuel,\
        transmision.type as transmision, drive.type as drive\
        FROM car INNER JOIN car_type ON car.type=car_type.id INNER JOIN fuel ON car.fuel=fuel.id\
        INNER JOIN transmision ON car.transmision=transmision.id INNER JOIN drive ON\
        car.drive=drive.id;`, 
        (err, car_rows, fields) => {
            if (!err){
                if (car_rows.length !== 0){
                    res.status(200).send(`All reservations with specified parameters: ${JSON.stringify(car_rows)}"`);
                }else 
                    res.status(200).send(`There currently no reservations in the list"`);
            }
            else console.log(err);
        });
})

app.get("/row", redirectLogin,  (req,res) => {

    const reg_id = req.query.reg_id
    const user_id = req.query.user_id
    const car_id = req.query.car_id

    var db = req.app.get('db');

    db.query(`SELECT date_to, date_from,price,user_id,car_id FROM registration WHERE registration.id=${reg_id};`, 
    (err, reg_rows, fields) => {
        if (!err){
            if (reg_rows.length !== 0){
                db.query(`SELECT name,surname,email FROM user WHERE id=${reg_rows[0].user_id};`, 
                (err, user_rows, fields) => {
                    if (!err){
                        if (user_rows.length !== 0){
                            db.query(`SELECT car.name, car.passengers, car.capacity, car_type.type as car_type, fuel.type as fuel,\
                            transmision.type as transmision, drive.type as drive\
                            FROM car INNER JOIN car_type ON car.type=car_type.id INNER JOIN fuel ON car.fuel=fuel.id\
                            INNER JOIN transmision ON car.transmision=transmision.id INNER JOIN drive ON\
                            car.drive=drive.id WHERE car.id=${reg_rows[0].car_id};`, 
                            (err, car_rows, fields) => {
                                if (!err){
                                    if (car_rows.length !== 0){
                                        res.status(200).send(`All reservations with specified parameters: ${JSON.stringify({
                                            "reg_details":reg_rows,
                                            "user_details":user_rows,
                                            "car_details":car_rows
                                        })}"`);
                                    }else 
                                        res.status(200).send(`There currently no reservations in the list"`);
                                }
                                else console.log(err);
                            });
                        }else 
                            res.status(200).send(`There currently no reservations in the list"`);
                    }
                    else console.log(err);
                });
            }else 
                res.status(200).send(`There currently no reservations in the list"`);
        }
        else console.log(err);
    });

})

app.get('/new', redirectLogin,  (req,res) => {
    res.render("new_car/index")
})

app.post('/new', redirectLogin, (req,res) => {
    
    const filePath = req.body.customFile
    const passengers = req.body.passengers
    const name = req.body.name
    const type = req.body.type
    const fuel = req.body.fuel
    const transmision = req.body.transmision
    const drive = req.body.drive
    const capacity = req.body.capacity
    const cost = req.body.cost

    console.log(Object.keys(req.body));

    res.redirect('/admin')
})