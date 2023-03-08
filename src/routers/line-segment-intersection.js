const express = require('express')
const router = express.Router()

router.get('/line-segment-intersection', (req, res) => {
    res.render('line_segment_intersection')
})

module.exports = router