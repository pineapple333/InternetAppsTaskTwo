const express = require('express')
var app = module.exports = express()
const passport = require('passport')
const url = require('url')

app.use("/", (req,res,next) => {
    var date1 = new Date(req.body.date_from);
    var date2 = new Date(req.body.date_to);

    if (req.body.date_from && req.body.date_from && date1 < Date.now() || date2 < Date.now()){
        res.send("This date is from the past")
    }else{
        next()
    }
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

// update the page after 
app.get("/reload",redirectLogin, async (req,res) => {

    var db = req.app.get('db')

    var passengers = req.query.passengers
    var capacity = req.query.capacity
    var car_type = req.query.car_type
    var fuel = req.query.fuel
    var transmision = req.query.transmision
    var drive = req.query.drive

    var date_from = req.query.date_from
    var date_to = req.query.date_to

    var dateReg = new RegExp(/^\d{4}-\d{2}-\d{2}$/)

    console.log(`Dates: ${dateReg.test(date_from)} ${date_to} ${ req.query.car_type }`); 
    
    console.log(`Query object keys: ${Object.keys(req.query)}`);

    var chosen_filters = []

    var date1 = new Date(date_from);
    var date2 = new Date(date_to);

    if(date1.getTime() > date2.getTime()){
        res.write("Start date must be earlier than the end date")
        res.end()
        return
    }

    if (isNaN(passengers) || passengers == '')
        passengers = 0
    if (isNaN(capacity) || capacity == '')
        capacity = 0
    if(isNaN(car_type))
        car_type = '%'
    if(isNaN(fuel))
        fuel = '%'
    if(isNaN(transmision))
        transmision = '%'
    if(isNaN(drive))
        drive = '%'
    if(!dateReg.test(date_from))
        date_from = '%'
    if(!dateReg.test(date_to))
        date_to = '%'

    var coef = 1

    if (dateReg.test(date_from) && dateReg.test(date_to))
        coef =  Math.abs(date2.getTime() - date1.getTime()) / (1000 * 3600 * 24)

    console.log(`Before query: ${passengers} ${capacity} ${car_type} ${fuel} ${transmision} ${drive} ${date_from} ${date_to}`);
    
        db.query(`SELECT car.id as car_id, car.name, car.passengers, car.capacity,\
            car_type.type as car_type, fuel.type as fuel, transmision.type as transmision,\
            drive.type as drive, car.cost as cost, car.photo\
            FROM car\
            INNER JOIN car_type ON car.type=car_type.id\
            INNER JOIN fuel ON car.fuel=fuel.id\
            INNER JOIN transmision ON car.transmision=transmision.id\
            INNER JOIN drive ON car.drive=drive.id
            WHERE 
                car.passengers >= ? AND 
                car.capacity >= ? AND
                car.type LIKE ? AND 
                car.fuel LIKE ? AND
                car.transmision LIKE ? AND
                car.drive LIKE ?;`, 
                [passengers, capacity, car_type, fuel, 
                transmision, drive],
            (err, rows, fields) => {
            if (!err){
                for (var i = 0; i < rows.length; i++){
                    rows[i].price = rows[i].cost * coef
                }
                res.render('reservation/index', {
                    rows,
                    date_from,
                    date_to,
                    car_type,
                    fuel,
                    transmision,
                    drive
                });
            }
            else console.log(err);
        })
})













// create new reservation
app.post("/", redirectLogin,async (req,res) => {

    var db = req.app.get('db')

    console.log(`User id: ${req.session.user_id}`);
    
    const user_id = req.session.userId
    // const car_id = req.body.car_id

    const passengers = req.body.passengers
    const capacity = req.body.capacity
    const car_type = req.body.car_type
    const fuel = req.body.fuel
    const transmision = req.body.transmision
    const drive = req.body.drive

    const date_from = req.body.date_from
    const date_to = req.body.date_to
    
    // var cost = req.body.cost

    console.log(`All fields: ${Object.keys(req.body)}`);

    // if (Object.keys(req.body).toString().search('stripeToken') != -1){
    //     res.redirect(url.format({
    //         pathname:'/payment',
    //         stripeEmail: req.body.stripeEmail,
    //         strpieToken: req.body.stripeToken
    //     }))
    //     res.end()
    //     return
    // }


    console.log(`Dates: ${req.body.date_from} ${req.body.date_to}`);

    var date1 = new Date(date_from);
    var date2 = new Date(date_to);

    const regex = new RegExp('car_id*');

    var car_id = Object.keys(req.body).filter(item => regex.test(item))

    console.log(car_id.length);

    if (car_id.length === 0 || !date1 || !date2){
        query = {
            date_from,
            date_to,
            car_type,
            fuel,
            transmision,
            drive,
            passengers,
            capacity
        }
        console.log(`Not enough data. Redirecting... with query ${JSON.stringify(query)}`);
        res.redirect(url.format({
            pathname:"/reservation/reload",
            query
        }));
        return
    }else{
        console.log("Checking if user exists");
        if (typeof req.session.userId === 'undefined'){
            res.render('login')
            return
        }
    }

    // console.log(`Converted car id = ${car_id[0].split('=')[1]}`);

    car_id = Number(car_id[0].split('=')[1])

    console.log(`Car id: ${car_id}`);

    var cost = 0

    await new Promise((resolve, reject) => {
        db.query("SELECT cost FROM car WHERE id=?;", [car_id], (err, rows, fields) => {
                if (!err) {
                    cost = Number(rows[0].cost )
                    if (rows.length !== 0){
                        resolve( { 
                            cost : rows[0].cost 
                        } )
                    }else{
                        reject(null)
                    }
                    // if(rows.length !== 0)
                    //     cost = rows[0].cost
                    // else res.send("Internal error. No such car in the database.")
                }
                else console.log(err);
        });
    })

    // console.log(`Date difference: ${date2.getTime() - date1.getTime()}`);
    const price = Math.abs(date2.getTime() - date1.getTime()) / (1000 * 3600 * 24) * Number(cost)

    console.log(`Cost = ${cost}`)
    
    db.query(`SELECT DATE_FORMAT(date_from, '%Y-%m-%d') as date_from, DATE_FORMAT(date_to, '%Y-%m-%d') as date_to FROM registration WHERE car_id=${Number(car_id)};`,
    async (err, rows, fields) => {
        if (!err){
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
                    if (!(date2.getTime() <= (new Date(old_date_from).getTime()) || 
                        (date1.getTime() >= (new Date(old_date_to).getTime())))){
                        status = false;
                    }
                }
                if (status){
                    console.log("Inserting...");
                    db.query("INSERT INTO registration (user_id, car_id, date_from, date_to, price) \
                        VALUES (?,?,?,?,?);", [user_id, car_id, date_from, date_to, price], async (err, rows, fields) => {
                            if (!err) {
                                await new Promise((resolve, reject) => {
                                    var today = new Date();
                                    var dd = String(today.getDate()).padStart(2, '0');
                                    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                                    var yyyy = today.getFullYear();
                                    today = yyyy + '-' + mm + '-' + dd;
                                    db.query("INSERT INTO log (user_id, action) \
                                        VALUES (?,?);", [user_id, `You created new reservation: ${today}`], (err, rows, fields) => {
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
                            }
                            else console.log(err);
                        });
                }else{
                    console.log("This car is taken")
                    res.send("This car is taken")
                    return;
                }
            }else{
                db.query("INSERT INTO registration (user_id, car_id, date_from, date_to, price) \
                VALUES (?,?,?,?,?)", [user_id, car_id, date_from, date_to, price], async (err, rows, fields) => {
                    if (!err) {
                        await new Promise((resolve, reject) => {
                            var today = new Date();
                            var dd = String(today.getDate()).padStart(2, '0');
                            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                            var yyyy = today.getFullYear();
                            today = yyyy + '-' + mm + '-' + dd;
                            db.query("INSERT INTO log (user_id, action) \
                                VALUES (?,?);", [user_id, `You created new reservation: ${today}`], (err, rows, fields) => {
                                    if (!err) {
                                        resolve()
                                    }else{
                                        reject()
                                        console.log(err);
                                    }
                            });
                        })
                        res.redirect("/reservation")
                        return;
                    }
                    else console.log(err);
                })
                // });
                // res.render("/reservation/index",{
                //     errors: ['There is no such car']
                // })
            }
        }
        else console.log(err);
    }) 

})

app.get("/", redirectLogin,async (req,res) => {

    var db = req.app.get('db')

    const passengers = req.query.passengers
    const capacity = req.query.capacity
    const car_type = req.query.car_type
    const fuel = req.query.fuel
    const transmision = req.query.transmision
    const drive = req.query.drive

    const date_from = req.query.date_from
    const date_to = req.query.date_to



    // var chosen_filters = []

    // if (passengers) chosen_filters.push(passengers)
    // if (capacity) chosen_filters.push(capacity)
    // if (car_type) chosen_filters.push(car_type)
    // if (fuel) chosen_filters.push(fuel)
    // if (transmision) chosen_filters.push(transmision)
    // if (drive) chosen_filters.push(drive)

    console.log(`${date_from} and ${date_to}`);

    var date1 = new Date(date_from);
    var date2 = new Date(date_to);

    if(date1.getTime() > date2.getTime()){
        res.write("Start date must be earlier than end date")
        res.end()
    }

    console.log(`${passengers} , ${car_type}`);

    var elegible_cars = await new Promise((resolve, reject) => { 
        var elegible_cars = []
        db.query(`SELECT * FROM car;`,
        (err, rows, fields) => {
            if (!err){
                if (rows.length !== 0){
                        rows.filter(
                            row => {
                                var solution = false
                                if (passengers && Number(row.passengers) < Number(passengers)) return false
                                if (capacity && Number(row.capacity) < Number(capacity)) return false
                                if (car_type && Number(row.car_type) !== Number(car_type)) return false
                                if (fuel && Number(row.fuel) !== Number(fuel)) return false
                                if (transmision && Number(row.transmision) !== Number(transmision)) return false
                                if (drive && Number(row.drive) !== Number(drive)) return false
                                elegible_cars.push(row.id)
                                return true
                            }
                        )
                    resolve(elegible_cars)
                }else 
                    reject(`There are not sutable cars"`);
            }
            else console.log(err);
        })
    })

    console.log(elegible_cars);

    var queryData=[elegible_cars];

    if (elegible_cars.length === 0){
        res.redirect('/reservation', {
            errors: ['There are no elegible cars']
        });
    }

    db.query(`SELECT car.id as car_id, car.name, car.passengers, car.capacity, car_type.type as car_type, fuel.type as fuel,\
    transmision.type as transmision, drive.type as drive, car.cost as cost, car.photo\
    FROM car INNER JOIN car_type ON car.type=car_type.id INNER JOIN fuel ON car.fuel=fuel.id\
    INNER JOIN transmision ON car.transmision=transmision.id INNER JOIN drive ON\
    car.drive=drive.id WHERE car.id IN (?);`, queryData,
    (err, rows, fields) => {
        if (!err){
            if (rows.length !== 0)
                res.render('reservation/index', {
                    rows
                });
                // res.status(200).send(`Available cars:\
                // ${JSON.stringify(rows)}`);
            else 
                // res.status(200).send(`There are not sutable cars"`);
                res.redirect('/reservation', {
                    errors: ['There are no elegible cars']
                });
        }
        else console.log(err);
    })
})

app.get("/delete",redirectLogin, async (req,res) => {

    var db = req.app.get('db')

    const reg_id = req.query.reg_id;
    console.log(reg_id);
    db.query(`DELETE FROM registration WHERE id=${reg_id};`,
    (err, rows, fields) => {
        if (!err){
            res.redirect(`/users/dashboard`)
        }
        else{
            console.log(err);
            res.send("Error while deleting the record")
        } 
    }) 
})

app.get("/edit", redirectLogin,async (req,res) => {

    var db = req.app.get('db')
    var user_id = 0

    if (req.session.is_admin){
        console.log("Admin calls");
        user_id = await new Promise((resolve, reject) => {
            db.query(`SELECT user_id FROM registration WHERE id = ${req.query.reg_id}`, (err, rows, fields) => {
                    if (!err) {
                        resolve(rows[0].user_id)
                    }else{
                        reject()
                        console.log(err);
                    }
            });
        })
    }
    
    db.query(`SELECT DATE_FORMAT(registration.date_from, '%Y-%m-%d') as date_from,\
        DATE_FORMAT(registration.date_to, '%Y-%m-%d') as date_to,\
        registration.id as reg_id, car.id as car_id, car.name, car.passengers, car.capacity,\
        car_type.type as car_type, fuel.type as fuel, transmision.type as transmision,\
        drive.type as drive, car.cost as cost, car.photo FROM car\
        INNER JOIN car_type ON car.type=car_type.id\
        INNER JOIN fuel ON car.fuel=fuel.id\
        INNER JOIN transmision ON car.transmision=transmision.id\
        INNER JOIN drive ON car.drive=drive.id\
        INNER JOIN registration ON registration.car_id=car.id\
        WHERE registration.id = ${req.query.reg_id}`,
        (err, rows, fields) => {
            if (!err){
                res.render('reservation/edit',{
                    rows,
                    reg_id: req.query.reg_id
                })
            }
            else{
                console.log(err);
                res.send("Error while deleting the record")
            } 
        }) 
})

app.post("/edit/:reg_id",redirectLogin, async (req,res) => {

    var db = req.app.get('db')

    const reg_id = req.params.reg_id
    const date1 = new Date(req.body.date_from)
    const date2 = new Date(req.body.date_to)
    const date_from = req.body.date_from
    const date_to = req.body.date_to

    var user_id = 0

    var new_status = 0
    if (req.session.is_admin){
        new_status = 2
        user_id = await new Promise((resolve, reject) => {
            db.query(`SELECT user_id FROM registration WHERE id = ${req.params.reg_id}`, (err, rows, fields) => {
                    if (!err) {
                        resolve(rows[0].user_id)
                    }else{
                        reject()
                        console.log(err);
                    }
            });
        })
    }else
        new_status = 1
    var cost = 0

    if (req.body.is_approved)
        new_status = 3
    else if (req.body.is_declined)
        new_status = 4

    console.log(`Chosen radio: ${req.body.flexRadioCheckedDisabled}`);

    const chosen_radio = Number(req.body.flexRadioCheckedDisabled)

    console.log(`Edit/POST: ${req.body.date_from} ${req.body.date_to} ${req.body.flexRadioCheckedDisabled}`);

    if (!req.body.date_from && !req.body.date_from 
        && (chosen_radio !== 3 
            && chosen_radio !== 4)){
        console.log("No valid data provided");
        // res.redirect(`/reservation/edit`)
        res.redirect(url.format({
            pathname:"/reservation",
            query:{
                reg_id
            }
        }));
        return
    }
    if (date1.getTime() > date2.getTime){
        res.send("Wrong date order")
        return
    }
    if (!req.body.date_from && !req.body.date_from){
        console.log("Updating without dates");

        db.query("UPDATE registration SET status = ? WHERE id = ?;", 
        [req.body.flexRadioCheckedDisabled, reg_id], async (err, rows, fields) => {
                await new Promise((resolve, reject) => {
                    user_id = req.session.is_admin ? user_id : req.session.userId
                    const message = req.session.is_admin ? `Admin updated ${reg_id}` : `You updated ${reg_id}`
                    db.query(`INSERT INTO log (user_id, action) VALUES (?,?);`,
                    [user_id, message], (err, rows, fields) => {
                            if (!err) {
                                resolve()
                            }else{
                                reject()
                                console.log(err);
                            }
                    });
                })
                if (!err) {
                    res.redirect('/users/dashboard')
                }
                else console.log(err);
            });
        return
    }
    
    // get all registrations with these cars
    var elegible_regs = await new Promise((resolve, reject) => { 
        db.query(`SELECT car.cost as cost, registration.id as reg_id, date_from, date_to FROM registration\
        INNER JOIN car ON registration.car_id=car.id WHERE registration.id = ${ reg_id };`,
        (err, rows, fields) => {
            if (!err){
                if (rows.length !== 0){
                    resolve(rows)
                }else 
                    resolve([])
            }
            else{
                console.log(err);
                reject(0)
            }
        })
    })

    cost = await new Promise((resolve, reject) => { 
        db.query(`SELECT car.id, car.cost as cost FROM registration\
        INNER JOIN car ON registration.car_id=car.id WHERE registration.id = ${ reg_id };`,
        (err, rows, fields) => {
            if (rows.length)
                resolve(rows[0].cost)
            else
                reject(rows[0].cost)
        })
    })

    var ex_old_date_from = ''
    var ex_old_date_to = ''

    var status = true;
    for (const row of elegible_regs){
        if(Number(row.reg_id) === Number(reg_id)){
            ex_old_date_from = row.date_from
            ex_old_date_to = row.date_to
            console.log("The same regestration id found");
            continue
        }
        const old_date_from = row.date_from
        const old_date_to = row.date_to
        console.log(date2, (new Date(old_date_from)));
        console.log(date1 , (new Date(old_date_to)));
        console.log(date2.getTime() <= (new Date(old_date_from).getTime()));
        console.log(date1.getTime() >= (new Date(old_date_to).getTime()));
        if (!(date2.getTime() <= (new Date(old_date_from).getTime()) || 
            (date1.getTime() >= (new Date(old_date_to).getTime())))){
            status = false;
            console.log("Status has been set to false");
        }
    }
    if (!date1 && !date2){
        date1 = new Date(ex_old_date_from)
        date2 = new Date(ex_old_date_to)
    }
    const price = Math.abs(date2.getTime() - date1.getTime()) / (1000 * 3600 * 24) * Number(cost)
    // console.log(`datediff ${ Math.abs(date2.getTime() - date1.getTime()) / (1000 * 3600 * 24) } ${ cost } ${ price }`);
    if (status){
        console.log(`Update reservation number ${ reg_id } ...`);
        db.query("UPDATE registration SET status = ?, price = ?, date_from = ?, date_to = ? WHERE id = ?;", 
        [new_status, price, date_from, date_to, reg_id], async (err, rows, fields) => {
                if (!err) {
                    await new Promise((resolve, reject) => {
                        user_id = req.session.is_admin ? user_id : req.session.userId
                        const message = req.session.is_admin ? `Admin updated ${reg_id}` : `You updated ${reg_id}`
                        db.query(`INSERT INTO log (user_id, action) VALUES (?,?);`,
                        [user_id, message], (err, rows, fields) => {
                                if (!err) {
                                    resolve()
                                }else{
                                    reject()
                                    console.log(err);
                                }
                        });
                    })
                    res.redirect('/users/dashboard')
                }
                else console.log(err);
            });
            return;
}else{
        console.log("This time is taken")
        res.send("This time is taken")
        return;
    }
    
})
