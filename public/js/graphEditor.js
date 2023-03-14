// imports
import { initStateList } from "/js/stateList.js"
import { getEdgeId } from "/js/helper.js"

// global variables
const svgGraphMargin = 8
window.pointSize = 12
const voidSize = pointSize*2

window.svg_height = -1
window.svg_width = -1

let canvas = null
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
    edges = canvas.group().attr("id", "edges")
    points = canvas.group().attr("id", "points")
    temp = canvas.group().attr("id", "temp")

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
    removeTempSegment()

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
        resetStates()

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
        resetStates()
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
        
        let startPoint = points.findOne(`[id=${pointIDs[1]}]`)
        let endPoint = points.findOne(`[id=${pointIDs[2]}]`)
        let segment = edges.findOne(`[id=${segmentId}]`)
        
        startPoint.remove()
        endPoint.remove()
        segment.remove()
    } else if (hoveredEdge) {
        let segmentId = hoveredEdge.attr("id")
        let pointIDs = segmentId.split("_")
        
        let startPoint = points.findOne(`[id=${pointIDs[1]}]`)
        let endPoint = points.findOne(`[id=${pointIDs[2]}]`)
        let segment = edges.findOne(`[id=${segmentId}]`)
        
        startPoint.remove()
        endPoint.remove()
        segment.remove()
    } else {
        console.log("There is no segment to remove at this location")
    }
}

function removeTempSegment() {
    canvas.off("mousemove")
    let tempPoint = temp.findOne("circle")
    if (tempPoint) { tempPoint.remove() }
    let tempEdge = temp.findOne("line")
    if (tempEdge) { tempEdge.remove() }
}

// FUNCTION: handle click
function handleClick(event) {
    let selectedBtn = document.querySelector('input[name="graphEdit"]:checked').value

    if (selectedBtn === "removeFromGraph") {
        if (inputType === "point") {
            deletePoint()
        } else if (inputType === "segment") {
            deleteSegment()
        }
    }

    if (selectedBtn === "addToGraph") {
        if (inputType === "point") {
            addPoint(event)
        } else if(inputType === "segment") {
            if (temp.findOne("circle")) {
                addSegmentEnd(event)
            } else {
                addSegmentStart(event)
            }
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
            removeTempSegment()

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
            removeTempSegment()

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

        removeTempSegment()
    }
}

// FUNCTION: reset to initial state
function resetStates() {
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
    edgesList.forEach(edge =>{
        if(edge.attr("data-dontDelete")) {
            
        } else {
            edge.remove()
        }
    })

    //remove temp stuff
    removeTempSegment()

    // re-initialize state list
    initStateList()
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
export { canvas, points, edges, boundary, temp, resetStates }