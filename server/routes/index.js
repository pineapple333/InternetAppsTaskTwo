const express = require('express');
const router = express.Router();

router.get('/', (req,res) => {
    res.write("Welcome");res.end()
});

module.exports = router;