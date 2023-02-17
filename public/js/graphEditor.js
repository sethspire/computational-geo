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

        points.circle(pointSize)
            .center(x, y)
            .fill("black")
            .attr({
                "stroke-width": pointSize*4,
                "stroke": "red",
                "stroke-opacity": 0
            })
            .addClass("svg-point-add")
            .attr("id", 'p(' + x + ',' + y + ')')

        console.log("New Point: " + x + "x, " + y + "y")
    } else {
        console.log("Cannot place new point close to previous points nor close to edge")
    }
}

// FUNCTION: delete point on click
function deletePoint() {
    // check if hovering over any point
    hoveredCircle = document.querySelector('g > circle:hover')
    
    if (hoveredCircle) {
        hoveredCircle.remove()
    } else {
        console.log("There is no point to remove at this location")
    }
}

// FUNCTION: handle click
function handleClick(event) {
    selectedBtn = document.querySelector('input[name="graphEdit"]:checked').value

    if (selectedBtn === "removePoint") {
        deletePoint()
    }
    if (selectedBtn === "addPoint") {
        addPoint(event)
    }
}

// FUNCTION: toggle cursor and on-click
function toggleGraphEdit() {
    selectedBtn = document.querySelector('input[name="graphEdit"]:checked').value
    pointsList = canvas.find('circle')

    if (selectedBtn === "removePoint") {
        pointsList.each(function(point) {
            point.addClass("svg-point-remove")
            point.removeClass("svg-point-add")
            point.attr("stroke-width", pointSize*2)
        })
    } else if (selectedBtn === "addPoint") {
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
}

// FUNCTION: clear all
function clearAll() {
    //confirm user wants to clear all
    confirmClear = confirm("Are you sure you want to clear all?")
    
    if (confirmClear) {
        pointsList = canvas.find('circle')
        pointsList.remove()
    }
}

// immediately run to create initial SVG
resizeSVG()