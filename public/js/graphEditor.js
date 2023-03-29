// imports
import { initStateList } from "/js/stateList.js"
import { getEdgeId, doIntersectFromPts, getSegmentIntersectionFromPts, doOverlapFromPts } from "/js/helper.js"

// global variables
const svgGraphMargin = 8
window.pointSize = 12
const voidSize = pointSize*2

window.svg_height = -1
window.svg_width = -1

let canvas = null
let polygons = null
let points = null
let edges = null
let boundary = null
let temp = null

// FUNCTION: resize svg area
function resizeSVG() {
    // Delete previous svg if applicable
    d3.select("#graph-area > svg").remove()

    // Get size of container div
    let svg_container = document.querySelector("#graph-area")
    let w_container = svg_container.offsetWidth
    let h_container = svg_container.offsetHeight
    svg_height = h_container - 2*svgGraphMargin
    svg_width = w_container - 2*svgGraphMargin

    // create SVG element, allow for consistent margin around the svg element
    canvas = SVG().addTo('#graph-area')
        .size(svg_width, svg_height)
        .css({"margin": svgGraphMargin+"px", "background-color": "white"})

    // create groups within SVG element for points, edges, and boundary
    boundary = canvas.group().attr("id", "boundary")
    temp = canvas.group().attr("id", "temp")
    polygons = canvas.group().attr("id", "polygons")
    edges = canvas.group().attr("id", "edges")
    points = canvas.group().attr("id", "points")

    // add rectangles around edges for void area where cannot place points
    boundary.rect(voidSize+1, svg_height+1)
        .addClass("svg-void-border")
        .move(-1, -1)
        .fill("transparent")
    boundary.rect(svg_width+1, voidSize+1)
        .addClass("svg-void-border")
        .move(-1, -1)
        .fill("transparent")
    boundary.rect(voidSize, svg_height)
        .addClass("svg-void-border")
        .move(svg_width-voidSize, 0)
        .fill("transparent")
    boundary.rect(svg_width, voidSize)
        .addClass("svg-void-border")
        .move(0, svg_height-voidSize)
        .fill("transparent")
    
    // add event listener to add point
    canvas.click(function (e) {
        handleClick(e)
    })
    removeTempElements()

    // log size and return svg canvas
    console.log("New SVG: " + svg_width + "w * " + svg_height + "h")
    return canvas
}

// FUNCTION: enter fullscreen
function fullscreenToggle() {
    // get fullscreen element if it exists
    let full_screen_element = document.fullscreenElement;
    //let toggleBtn = document.querySelector("#fullscreenToggle")
	
    if(full_screen_element !== null){
        // in full screen so exit
        document.exitFullscreen()
            .then(function() {
                console.log("exited fullscreen")
                //toggleBtn.classList.remove("panel-btn-activated")
            })
            .catch(function(error) {
                // element could not exit fullscreen mode
                // error message
                console.log(error)
            })
    } else {
        // not in full screen, so get main and enter fullscreen
        let main = document.querySelector("main")
        main.requestFullscreen()
            .then(function() {
                console.log("entered fullscreen")
                //toggleBtn.classList.add("panel-btn-activated")
            })
            .catch(function(error) {
                // element could not enter fullscreen mode
                // error message
                console.log(error)
            })
    }
}

// FUNCTION: add point on click
function addPoint(event) {
    // check if hovering over any point
    let hoveredCircle = document.querySelector('g > circle:hover')
    let hoveredRectangle = document.querySelector('g > rect:hover')

    let withinHeight = event.offsetY > voidSize && event.offsetY < svg_height-voidSize
    let withinWidth = event.offsetX > voidSize && event.offsetX < svg_width-voidSize
    
    if (hoveredCircle === null && hoveredRectangle === null && withinHeight && withinWidth) {
        const x = event.offsetX 
        const y = event.offsetY 

        let newPoint = points.circle(pointSize)
            .center(x, y)
            .attr({
                "fill": "black",
                "stroke-width": pointSize*4,
                "stroke": "red",
                "stroke-opacity": 0
            })
            .addClass("svg-point-add")
            .attr("id", `p${x}-${y}`)
        let pointInitialState = JSON.stringify(newPoint.attr())
        newPoint.attr("data-init-state", pointInitialState)

        console.log("New Point: " + x + "x, " + y + "y")

        return newPoint
    } else {
        console.log("Cannot place new point close to previous points nor close to edge")
        return null
    }
}

// FUNCTION: delete point on click
function deletePoint() {
    // check if hovering over any point
    let hoveredCircle = document.querySelector('g > circle:hover')
    
    if (hoveredCircle) {
        hoveredCircle.remove()
    } else {
        console.log("There is no point to remove at this location")
    }
}

// FUNCTION: add first point of segment
function addSegmentStart(event) {
    let startPoint = addPoint(event)
    if (startPoint) {
        // move new point into temp
        startPoint.putIn(temp)

        // add temp dashed line showing where segment is
        temp.line()
            .attr({
                "x1": event.offsetX,
                "y1": event.offsetY,
                "x2": event.offsetX,
                "y2": event.offsetY,
                "stroke": "black",
                "stroke-dasharray": "5, 5"
            })

        // add event listener moving temp line
        canvas.on('mousemove', function(event) {
            let tempEdge = temp.findOne("line")
            tempEdge.attr({
                "x2": event.offsetX,
                "y2": event.offsetY
            })
        })
    }
}

// FUNCTION: add second point of segment and reset
function addSegmentEnd(event) {
    let startPoint = temp.findOne("circle")
    let tempEdge = temp.findOne("line")
    let endPoint = addPoint(event)
    if (startPoint && endPoint && tempEdge) {
        // remove event listener moving temp line
        canvas.off('mousemove')

        // get coordinates for each point
        let p1_coord = startPoint.attr("id").substring(1).split("-")
        let x1 = Number(p1_coord[0])
        let y1 = Number(p1_coord[1])
        let p2_coord = endPoint.attr("id").substring(1).split("-")
        let x2 = Number(p2_coord[0])
        let y2 = Number(p2_coord[1])
        
        // id is ordered with points left to right (top to bottom tiebreaker)
        let id = getEdgeId(startPoint, endPoint)

        // update temp line to be solid with proper id, set end, and add non-delete data
        tempEdge.attr({
                "x2": x2,
                "y2": y2,
                "stroke": "black",
                "stroke-dasharray": "",
                "stroke-width": 1
            })
            .attr("id", id)
            .attr("data-dontDelete", true)
        
        // set init state data for edge
        let edgeInitialState = JSON.stringify(tempEdge.attr())
        tempEdge.attr("data-init-state", edgeInitialState)

        // add edge ID to point data
        startPoint.attr("data-segmentID", id)
        endPoint.attr("data-segmentID", id)
            
        // move startPoint and tempEdge to proper groups
        startPoint.putIn(points)
        tempEdge.putIn(edges)

        console.log(`New Segment: (${x1}x, ${y1}y), (${x2}x, ${y2}y)`)
    }
}

// FUNCTION: delete whole segment including both points
function deleteSegment() {
    // check if hovering over any point
    let hoveredCircle = points.findOne('circle:hover')
    let hoveredEdge = edges.findOne('line:hover')
    
    if (hoveredCircle) {
        let segmentId = hoveredCircle.attr("data-segmentID")
        let pointIDs = segmentId.split("_")
        
        let startPoint = points.findOne(`[id='${pointIDs[1]}']`)
        let endPoint = points.findOne(`[id='${pointIDs[2]}']`)
        let segment = edges.findOne(`[id='${segmentId}']`)
        
        startPoint.remove()
        endPoint.remove()
        segment.remove()
    } else if (hoveredEdge) {
        let segmentId = hoveredEdge.attr("id")
        let pointIDs = segmentId.split("_")
        
        let startPoint = points.findOne(`[id='${pointIDs[1]}']`)
        let endPoint = points.findOne(`[id='${pointIDs[2]}']`)
        let segment = edges.findOne(`[id='${segmentId}']`)
        
        startPoint.remove()
        endPoint.remove()
        segment.remove()
    } else {
        console.log("There is no segment to remove at this location")
    }
}

// FUNCTION: add point to simple polygon
function addPolygonPoint_simple(event) {
    let allPoints = points.find("circle")
    let prevPoint = null
    if (allPoints.length >= 1) {
        prevPoint = allPoints[allPoints.length-1]
    }
    let newPoint = addPoint(event)

    if (newPoint) {
        // check if new points would cause any intersection
        let foundIntersection = false
        if (allPoints.length >= 2) {
            let edgeList = edges.find("line")

            // make sure new line isn't parallel and overlapping with previously added edge
            let prevEdge = edgeList.pop()
            let segmentId = prevEdge.attr("id")
            let segmentPointIDs = segmentId.split("_").slice(1,3)
            let p2 = points.findOne(`[id='${segmentPointIDs[0]}']`)
            let q2 = points.findOne(`[id='${segmentPointIDs[1]}']`)
            if (doOverlapFromPts(prevPoint, newPoint, p2, q2)) {
                foundIntersection = true
            }

            edgeList.forEach(edge => {
                segmentId = edge.attr("id")
                segmentPointIDs = segmentId.split("_").slice(1,3)
                p2 = points.findOne(`[id='${segmentPointIDs[0]}']`)
                q2 = points.findOne(`[id='${segmentPointIDs[1]}']`)
                foundIntersection = doIntersectFromPts(prevPoint, newPoint, p2, q2) || foundIntersection
            })
        }

        if (!foundIntersection){
            // add new line segment from prev point to new point
            if (prevPoint) {
                let id = getEdgeId(prevPoint, newPoint)
                let newEdge = edges.line()
                    .attr({
                        "x1": prevPoint.attr("cx"),
                        "y1": prevPoint.attr("cy"),
                        "x2": newPoint.attr("cx"),
                        "y2": newPoint.attr("cy"),
                        "stroke": "black",
                        "data-dontDelete": true,
                        "id": id
                    })
                
                // set init state data for edge
                let edgeInitialState = JSON.stringify(newEdge.attr())
                newEdge.attr("data-init-state", edgeInitialState)

                // set this segment id to the data attributes of the endpoints
                newPoint.attr("data-segmentID_prev", id)
                prevPoint.attr("data-segmentID_next", id)
            }

            addPolygonTempLines_simple()            
        } else {
            newPoint.remove()
        }
    }
}

// FUNCTION add track line and temp line for simple polygon
function addPolygonTempLines_simple() {
    // get all points and most recent point
    let allPoints = points.find("circle")
    let newPoint = allPoints[allPoints.length-1]

    // show where completing line would be
    if (allPoints.length > 2) {
        let testLine = temp.findOne("line[id='testLine']")
        if (testLine) {
            testLine.remove()
        }

        // get first point
        let firstPoint = allPoints[0]

        // check if estimated new line intersects anything
        let foundIntersection = false
        let edgeList = edges.find("line")
        edgeList.pop()
        edgeList.shift()
        edgeList.forEach(edge => {
            let segmentId = edge.attr("id")
            let segmentPointIDs = segmentId.split("_").slice(1,3)
            let p2 = points.findOne(`[id='${segmentPointIDs[0]}']`)
            let q2 = points.findOne(`[id='${segmentPointIDs[1]}']`)
            foundIntersection = doIntersectFromPts(firstPoint, newPoint, p2, q2) || foundIntersection
        })

        // set stroke color based on if intersects
        let strokeColor = foundIntersection ? "red" : "lime"

        // add temp track line
        temp.line().attr({
            "x1": newPoint.attr("cx"),
            "y1": newPoint.attr("cy"),
            "x2": firstPoint.attr("cx"),
            "y2": firstPoint.attr("cy"),
            "stroke": strokeColor,
            "stroke-dasharray": "5 5",
            "id": "testLine"
        })
    }

    // remove old temp line
    let trackLine = temp.findOne("line[id='trackLine']")
    if (trackLine) {
        trackLine.remove()
    }

    // create temp line to move with mouse
    temp.line()
        .attr({
            "x1": newPoint.attr("cx"),
            "y1": newPoint.attr("cy"),
            "x2": newPoint.attr("cx"),
            "y2": newPoint.attr("cy"),
            "stroke": "black",
            "stroke-dasharray": "5 5",
            "id": "trackLine"
        })

    // add event listener moving temp line
    canvas.on('mousemove', function(event) {
        let trackEdge = temp.findOne("line[id='trackLine']")
        trackEdge.attr({
            "x2": event.offsetX,
            "y2": event.offsetY
        })
    })
}

// FUNCTION delete point or edge form simple polygon
function deletePolygonElement_simple() {
    // check if hovering over any point
    let hoveredCircle = points.findOne('circle:hover')
    let hoveredEdge = edges.findOne('line:hover')
    
    if (hoveredCircle) {
        // get prev and next segments relative to point if they exist
        let segmentID_prev = hoveredCircle.attr("data-segmentID_prev")
        let segmentID_next = hoveredCircle.attr("data-segmentID_next")
        let prevSegment = null
        let nextSegment = null
        if (segmentID_prev) {
            prevSegment = edges.findOne(`[id='${segmentID_prev}']`)
        }
        if (segmentID_next) {
            nextSegment = edges.findOne(`[id='${segmentID_next}']`)
        }

        // if have both prev and next, make prev segment go to next point, del next segment and hovered point
        if (prevSegment && nextSegment) {
            // get the other points associated with the prev segment and next segment
            let prevPointIDs = segmentID_prev.split("_").slice(1, 3)
            let prevPointID = prevPointIDs[0] === hoveredCircle.attr("id") ? prevPointIDs[1] : prevPointIDs[0]
            let prevPoint = points.findOne(`[id='${prevPointID}']`)
            let nextPointIDs = segmentID_next.split("_").slice(1, 3)
            let nextPointID = nextPointIDs[0] === hoveredCircle.attr("id") ? nextPointIDs[1] : nextPointIDs[0]
            let nextPoint = points.findOne(`[id='${nextPointID}']`)

            // check if estimated new line intersects anything
            let foundIntersection = false
            let edgeList = edges.find("line")
            edgeList.forEach(edge => {
                let segmentId = edge.attr("id")
                let segmentPointIDs = segmentId.split("_").slice(1,3)
                let p2 = points.findOne(`[id='${segmentPointIDs[0]}']`)
                let q2 = points.findOne(`[id='${segmentPointIDs[1]}']`)
                let intersectionPt = getSegmentIntersectionFromPts(prevPoint, nextPoint, p2, q2)
                if (intersectionPt && doIntersectFromPts(prevPoint, nextPoint, p2, q2) &&
                    JSON.stringify(intersectionPt) !== JSON.stringify([Number(prevPoint.attr("cx")), Number(prevPoint.attr("cy"))]) && 
                    JSON.stringify(intersectionPt) !== JSON.stringify([Number(nextPoint.attr("cx")), Number(nextPoint.attr("cy"))])) {
                        foundIntersection = true
                }
            })

            if (!foundIntersection) {
                // update prev segment
                let id = getEdgeId(prevPoint, nextPoint)
                prevSegment.attr({
                    "x2": nextPoint.attr("cx"),
                    "y2": nextPoint.attr("cy"),
                    "id": id,
                    "data-init-state": null
                })
                let edgeInitialState = JSON.stringify(prevSegment.attr())
                prevSegment.attr("data-init-state", edgeInitialState)

                // update prev and next point
                nextPoint.attr({
                    "data-segmentID_prev": id
                })
                prevPoint.attr({
                    "data-segmentID_next": id
                })

                // delete old
                nextSegment.remove()
                hoveredCircle.remove()
            }
        } else if (prevSegment) {
            // delete hovered point and prev segment
            hoveredCircle.remove()
            prevSegment.remove()

            // get the other points of the prev segment, update it
            let prevPointIDs = segmentID_prev.split("_").slice(1, 3)
            let prevPointID = prevPointIDs[0] === hoveredCircle.attr("id") ? prevPointIDs[1] : prevPointIDs[0]
            let prevPoint = points.findOne(`[id='${prevPointID}']`)
            prevPoint.attr({
                "data-segmentID_next": null
            })
        } else if (nextSegment) {
            // delete hovered point and prev segment
            hoveredCircle.remove()
            nextSegment.remove()

            // get the other points of the prev segment, update it
            let nextPointIDs = segmentID_next.split("_").slice(1, 3)
            let nextPointID = nextPointIDs[0] === hoveredCircle.attr("id") ? nextPointIDs[1] : nextPointIDs[0]
            let nextPoint = points.findOne(`[id='${nextPointID}']`)
            nextPoint.attr({
                "data-segmentID_prev": null
            })
        } else {
            hoveredCircle.remove()
        }
    } else if (hoveredEdge) {

    } else {
        console.log("There is no segment to remove at this location")
    }
}

// FUNCTION: handle click
function handleClick(event) {
    let selectedBtn = document.querySelector('input[name="graphEdit"]:checked').value

    if (selectedBtn === "removeFromGraph") {
        resetStates()

        if (inputType === "point") {
            deletePoint()
        } else if (inputType === "segment") {
            deleteSegment()
        } else if (inputType === "polygon-simple") {
            deletePolygonElement_simple()
        }
    }

    if (selectedBtn === "addToGraph") {
        resetStates(false)

        if (inputType === "point") {
            addPoint(event)
        } else if(inputType === "segment") {
            if (temp.findOne("circle")) {
                addSegmentEnd(event)
            } else {
                addSegmentStart(event)
            }
        } else if(inputType === "polygon-simple") {
            addPolygonPoint_simple(event)
        }
    }
}

// FUNCTION: toggle cursor and on-click
function toggleGraphEdit() {
    let selectedBtn = document.querySelector('input[name="graphEdit"]:checked').value

    if (inputType === "point") {
        let pointsList = canvas.find('circle')

        if (selectedBtn === "removeFromGraph") {
            pointsList.each(function(point) {
                point.addClass("svg-point-remove")
                point.removeClass("svg-point-add")
                point.attr("stroke-width", pointSize*2)
            })
        } else if (selectedBtn === "addToGraph") {
            pointsList.each(function(point) {
                point.addClass("svg-point-add")
                point.removeClass("svg-point-remove")
                point.attr("stroke-width", pointSize*4)
            })
        } else if (selectedBtn === "lockGraph") {
            pointsList.each(function(point) {
                point.addClass("svg-point-add")
                point.removeClass("svg-point-remove")
                point.attr("stroke-width", pointSize*4)
            })
        }
    } else if (inputType === "segment") {
        let pointsList = points.find('circle')

        if (selectedBtn === "removeFromGraph") {
            removeTempElements()

            pointsList.each(function(point) {
                point.addClass("svg-point-remove")
                point.removeClass("svg-point-add")
                point.attr("stroke-width", pointSize*2)
            })
        } else if (selectedBtn === "addToGraph") {
            pointsList.each(function(point) {
                point.addClass("svg-point-add")
                point.removeClass("svg-point-remove")
                point.attr("stroke-width", pointSize*4)
            })
        } else if (selectedBtn === "lockGraph") {
            removeTempElements()

            pointsList.each(function(point) {
                point.addClass("svg-point-add")
                point.removeClass("svg-point-remove")
                point.attr("stroke-width", pointSize*4)
            })
        }
    } else if (inputType === "polygon-simple") {
        let pointsList = points.find('circle')

        if (selectedBtn === "removeFromGraph") {
            removeTempElements()

            pointsList.each(function(point) {
                point.addClass("svg-point-remove")
                point.removeClass("svg-point-add")
                point.attr("stroke-width", pointSize*2)
            })
        } else if (selectedBtn === "addToGraph") {
            addPolygonTempLines_simple()

            pointsList.each(function(point) {
                point.addClass("svg-point-add")
                point.removeClass("svg-point-remove")
                point.attr("stroke-width", pointSize*4)
            })
        } else if (selectedBtn === "lockGraph") {
            removeTempElements()

            pointsList.each(function(point) {
                point.addClass("svg-point-add")
                point.removeClass("svg-point-remove")
                point.attr("stroke-width", pointSize*4)
            })
        }
    }
}

// FUNCTION: clear all
function clearAll() {
    //confirm user wants to clear all
    let confirmClear = confirm("Are you sure you want to clear all?")
    
    if (confirmClear) {
        let pointsList = points.find('circle')
        pointsList.remove()

        let edgesList = edges.find('line')
        edgesList.remove()

        let polygonsList = polygons.find('polygon')
        polygonsList.remove()

        removeTempElements()
    }

    initStateList()
}

// FUNCTION: reset to initial state
function resetStates(removeTemp=true) {
    // reset points to initial state
    let pointsList = points.find('circle')
    pointsList.forEach(point => {
        if (point.attr("data-init-state")) {
            let initialState = JSON.parse(point.attr("data-init-state"))
            let curClass = point.attr("class")
            let curStrokeWidth = point.attr("stroke-width")
            point.attr(initialState)
            point.attr("class", curClass)
            point.attr("stroke-width", curStrokeWidth)
        } else {
            point.remove()
        }
    })

    // remove edges if lack data-dontDelete
    let edgesList = edges.find('line')
    edgesList.forEach(edge => {
        if(edge.attr("data-dontDelete")) {
            let initialState = JSON.parse(edge.attr("data-init-state"))
            edge.attr(initialState)
        } else {
            edge.remove()
        }
    })

    // remove polygons if lack data-dontDelete
    let polygonsList = polygons.find("polygon")
    polygonsList.forEach(polygon => {
        if(polygon.attr("data-dontDelete")) {
            let initialState = JSON.parse(polygon.attr("data-init-state"))
            polygon.attr(initialState)
        } else {
            polygon.remove()
        }
    })

    //remove temp stuff
    if (removeTemp) {
        removeTempElements()
    }

    // re-initialize state list
    initStateList()
    document.querySelector("#codeArea").innerHTML = null
    document.querySelector("#codeStatus").innerHTML = null
}

// FUNCTION: remove the unused temporary elements used in creating elements
function removeTempElements() {
    canvas.off("mousemove")

    let tempPoint = temp.find("circle")
    if (tempPoint) { tempPoint.remove() }
    
    let tempEdge = temp.find("line")
    if (tempEdge) { tempEdge.remove() }
}

// immediately run to create initial SVG
resizeSVG()

// set onClick
document.querySelector("#resizeSVG").onclick = resizeSVG
document.querySelector("#fullscreenToggle").onclick = fullscreenToggle
document.querySelector("#clearAll").onclick = clearAll
document.querySelector("#addToGraph").onclick = toggleGraphEdit
document.querySelector("#removeFromGraph").onclick = toggleGraphEdit
document.querySelector("#lockGraph").onclick = toggleGraphEdit

// export needed things
export { canvas, polygons, points, edges, boundary, temp, resetStates }