let svgGraphMargin = 8

// FUNCTION: resize svg area
function resizeSVG() {
    // Delete previous svg if applicable
    d3.select("#graph-area > svg").remove()

    // Get size of container div
    let svg_container = document.querySelector("#graph-area")
    let width = svg_container.offsetWidth
    let height = svg_container.offsetHeight

    // create SVG element
    let svg = d3.select("#graph-area")
        .append("svg")
        .attr("width", width - 2*svgGraphMargin)
        .attr("height", height - 2*svgGraphMargin)
        .style("margin", svgGraphMargin + "px")
        .style("background-color", "white")
        .style("min-width", width - 2*svgGraphMargin + "px")
        .style("min-height", height - 2*svgGraphMargin + "px")
}


// immediately run to create initial SVG
resizeSVG()