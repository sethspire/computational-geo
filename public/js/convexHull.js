let stateList = null

function grahamScan() {
    // get points list
    pointsList = points.find('circle')
    if (pointsList.length > 2) {
        pointsList.each(function(point) {
            console.log(point.attr(['cx', 'cy', 'id']))
        })
    }
}