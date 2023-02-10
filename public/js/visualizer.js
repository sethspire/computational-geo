// global variables
const svgGraphMargin = 8
const pointSize = 12
let canvas = null

// FUNCTION: resize svg area
function resizeSVG() {
    // Delete previous svg if applicable
    d3.select("#graph-area > svg").remove()

    // Get size of container div
    let svg_container = document.querySelector("#graph-area")
    let w_container = svg_container.offsetWidth
    let h_container = svg_container.offsetHeight
    let svg_height = h_container - 2*svgGraphMargin
    let svg_width = w_container - 2*svgGraphMargin

    // create SVG element, allow for consistent margin around the svg element
    canvas = SVG().addTo('#graph-area')
        .size(svg_width, svg_height)
        .css({"margin": svgGraphMargin+"px", "background-color": "white"})

    // add rectangles around edges for void area where cannot place points
    voidSize = pointSize*2
    canvas.rect(voidSize, svg_height)
        .addClass("svg-void-border")
        .fill("transparent")
    canvas.rect(svg_width, voidSize)
        .addClass("svg-void-border")
        .fill("transparent")
    canvas.rect(voidSize, svg_height)
        .addClass("svg-void-border")
        .move(svg_width-voidSize, 0)
        .fill("transparent")
    canvas.rect(svg_width, voidSize)
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
    hoveredCircle = document.querySelector('svg > circle:hover')
    hoveredRectangle = document.querySelector('svg > rect:hover')
    
    if (hoveredCircle === null && hoveredRectangle === null) {
        const x = event.offsetX 
        const y = event.offsetY

        canvas.circle(pointSize)
            .center(x, y)
            .fill("black")
            .attr({
                "stroke-width": pointSize*4,
                "stroke": "red",
                "stroke-opacity": 0
            })
            .addClass("svg-point-add")

        console.log("New Point: " + x + "x, " + y + "y")
    } else {
        console.log("Cannot place new point close to previous points nor close to edge")
    }
}

// FUNCTION: delete point on click
function deletePoint() {
    // check if hovering over any point
    hoveredCircle = document.querySelector('svg > circle:hover')
    
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
    }
    if (selectedBtn === "addPoint") {
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