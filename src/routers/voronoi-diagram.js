const express = require('express')
const router = express.Router()

router.get('/voronoi-diagram', (req, res) => {
    res.render('voronoi_diagram')
})

module.exports = router