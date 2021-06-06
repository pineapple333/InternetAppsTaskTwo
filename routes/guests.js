const express = require('express');

const router = express.Router();

// Login
router.get('/login', (req,res) => {
    res.redirect("/users/login");
});

// Register
router.get('/register', (req,res) => {
    res.redirect("/users/register");
});

router.post('/add', (req,res) => {
    // let user = {name: "John", surname: "Smith", email: "js@gmail.com"};
    // let sql = "INSERT INTO user SET ?";
    // let query = db.query(sql, user, (err, result) => {
    //     if (err) throw err;
    //     res.send(result);
    //     res.end();
    // });
    res.send(`Query: Name: ${req.query.uname} Sname: ${req.query.sname} \
        Email: ${req.query.email}`);
    res.end();
});

module.exports = router;