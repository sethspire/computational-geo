const express = require('express')
const router = express.Router()

router.get('/convex-hull', (req, res) => {
    res.render('convex_hull')
})

module.exports = router