const express = require('express')
const router = express.Router()

router.get('/convex-hull', (req, res) => {
    res.render('convex-hull')
})

module.exports = router