const express = require('express')
const router = express.Router()

router.get('/triangulation', (req, res) => {
    res.render('triangulation')
})

module.exports = router