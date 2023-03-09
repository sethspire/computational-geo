// global variables
const svgGraphMargin = 8
const pointSize = 12
const voidSize = pointSize*2

let svg_height = -1
let svg_width = -1

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
        main = document.querySelector("main")
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
    hoveredCircle = document.querySelector('g > circle:hover')
    hoveredRectangle = document.querySelector('g > rect:hover')

    withinHeight = event.offsetY > voidSize && event.offsetY < svg_height-voidSize
    withinWidth = event.offsetX > voidSize && event.offsetX < svg_width-voidSize
    
    if (hoveredCircle === null && hoveredRectangle === null && withinHeight && withinWidth) {
        const x = event.offsetX 
        const y = event.offsetY 

        newPoint = points.circle(pointSize)
            .center(x, y)
            .attr({
                "fill": "black",
                "stroke-width": pointSize*4,
                "stroke": "red",
                "stroke-opacity": 0
            })
            .addClass("svg-point-add")
            .attr("id", `p${x}-${y}`)
        pointInitialState = JSON.stringify(newPoint.attr())
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
    hoveredCircle = document.querySelector('g > circle:hover')
    
    if (hoveredCircle) {
        hoveredCircle.remove()
        resetStates()
    } else {
        console.log("There is no point to remove at this location")
    }
}

// FUNCTION: add first point of segment
function addSegmentStart(event) {
    startPoint = addPoint(event)
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
            tempEdge = temp.findOne("line")
            tempEdge.attr({
                "x2": event.offsetX,
                "y2": event.offsetY
            })
        })
    }
}

// FUNCTION: add second point of segment and reset
function addSegmentEnd(event) {
    startPoint = temp.findOne("circle")
    tempEdge = temp.findOne("line")
    endPoint = addPoint(event)
    if (startPoint && endPoint && tempEdge) {
        // remove event listener moving temp line
        canvas.off('mousemove')

        // get coordinates for each point
        startP_coord = startPoint.attr("id").substring(1).split("-");
        x1 = startP_coord[0]
        y1 = startP_coord[1]
        endP_coord = endPoint.attr("id").substring(1).split("-");
        x2 = endP_coord[0]
        y2 = endP_coord[1]
        // id is ordered with points left to right (top to bottom tiebreaker)
        if (x1 < x2) {
            id = `e_${startPoint.attr("id")}_${endPoint.attr("id")}`
        } else if (x1 > x2) {
            id = `e_${endPoint.attr("id")}_${startPoint.attr("id")}`

        } else {
            if (y1 < y2) {
                id = `e_${startPoint.attr("id")}_${endPoint.attr("id")}`
            } else {
                id = `e_${endPoint.attr("id")}_${startPoint.attr("id")}`
            }
        }

        // update temp line to be solid with proper id, set end, and add non-delete data
        tempEdge.attr({
                "x2": x2,
                "y2": y2,
                "stroke": "black",
                "stroke-dasharray": ""
            })
            .attr("id", id)
            .attr("data-dontDelete", true)

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
    hoveredCircle = points.findOne('circle:hover')
    hoveredEdge = edges.findOne('line:hover')
    
    if (hoveredCircle) {
        segmentId = hoveredCircle.attr("data-segmentID")
        pointIDs = segmentId.split("_")
        
        startPoint = points.findOne(`[id=${pointIDs[1]}]`)
        endPoint = points.findOne(`[id=${pointIDs[2]}]`)
        segment = edges.findOne(`[id=${segmentId}]`)
        
        startPoint.remove()
        endPoint.remove()
        segment.remove()
    } else if (hoveredEdge) {
        segmentId = hoveredEdge.attr("id")
        pointIDs = segmentId.split("_")
        
        startPoint = points.findOne(`[id=${pointIDs[1]}]`)
        endPoint = points.findOne(`[id=${pointIDs[2]}]`)
        segment = edges.findOne(`[id=${segmentId}]`)
        
        startPoint.remove()
        endPoint.remove()
        segment.remove()
    } else {
        console.log("There is no segment to remove at this location")
    }
}

// FUNCTION: handle click
function handleClick(event) {
    selectedBtn = document.querySelector('input[name="graphEdit"]:checked').value

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
    selectedBtn = document.querySelector('input[name="graphEdit"]:checked').value

    if (inputType === "point") {
        pointsList = canvas.find('circle')

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
        pointsList = points.find('circle')

        if (selectedBtn === "removeFromGraph") {
            canvas.off("mousemove")
            tempPoint = temp.findOne("circle")
            if (tempPoint) { tempPoint.remove() }
            tempEdge = temp.findOne("line")
            if (tempEdge) { tempEdge.remove() }

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
            canvas.off("mousemove")
            tempPoint = temp.findOne("circle")
            if (tempPoint) { tempPoint.remove() }
            tempEdge = temp.findOne("line")
            if (tempEdge) { tempEdge.remove() }

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
    confirmClear = confirm("Are you sure you want to clear all?")
    
    if (confirmClear) {
        pointsList = points.find('circle')
        pointsList.remove()

        edgesList = edges.find('line')
        edgesList.remove()
    }
}

// FUNCTION: reset to initial state
function resetStates() {
    // reset points to initial state
    pointsList = points.find('circle')
    pointsList.forEach(point => {
        initState = JSON.parse(point.attr("data-init-state"))
        curClass = point.attr("class")
        curStrokeWidth = point.attr("stroke-width")
        point.attr(initState)
        point.attr("class", curClass)
        point.attr("stroke-width", curStrokeWidth)
    })

    // remove edges
    edgesList = edges.find('line')
    edgesList.forEach(edge =>{
        if(edge.attr("data-dontDelete")) {
            
        } else {
            edge.remove()
        }
    })

    // re-initialize state list
    initStateList()
}

// immediately run to create initial SVG
resizeSVG()