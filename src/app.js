const express = require('express')
const path = require('path')
const hbs = require('hbs')

const index_router = require('./routers/index')
const convexHull_router = require('./routers/convex-hull')
const lineSegmentIntersection_router = require('./routers/line-segment-intersection')
const _404_router = require('./routers/404')

const app = express()

const dir = path.join(__dirname, "../public")
app.use(express.static(dir))

app.set('view engine', 'hbs')

const viewsPath = path.join(__dirname, "./templates")
app.set('views', viewsPath)

const partialsPath = path.join(__dirname, "./templates/partials")
hbs.registerPartials(partialsPath)

app.use(index_router)
app.use(convexHull_router)
app.use(lineSegmentIntersection_router)
app.use(_404_router)

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})