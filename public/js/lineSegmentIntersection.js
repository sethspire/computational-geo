import { stateList, initStateList, createEdgeStateUpdatesFromPts, createPointStateUpdate, createVerticalEdgeStateUpdatesFromPt } from "/js/stateList.js"
import { points, edges, resetStates } from "/js/graphEditor.js"
import { updateDisplay } from "/js/visualizer.js"
import { PriorityQueue } from "/js/helper.js";

window.inputType = "segment"

// FUNCTION: create stateList for Line Sweep
function lineSweep() {
    // NOTE: ON SVG, (0,0) IS TOP LEFT CORNER, SO JUST NEED TO FLIP SIGN OF Y-VALUES **CALCULATIONS ONLY**
    // initialize stateList and reset graph states
    initStateList()
    resetStates()

    // get list of points and edges and save current states
    let currentStates = {}
    let pointsList = points.find("circle")
    pointsList.each(point => {
        currentStates[point.attr("id")] = point.attr("data-init-state")
    })
    let edgesList = edges.find("line")
    edgesList.each(edge => {
        currentStates[edge.attr("id")] = edge.attr("data-init-state")
    })

    // set first state to essentially blank
    let states = []
    let newState = {"points": [], "edges": []}
    states.push(newState)

    // place all endpoints in a priority queue
    let eventQueue = new PriorityQueue((a, b) => a["sortVal"] < b["sortVal"])
    pointsList.each(point => {
        eventQueue.push({
            "point": point,
            "sortVal": Number(point.attr("cx")) + Number(point.attr("cy"))/svg_height
        })
    })

    // go event point by event point
    while (!eventQueue.isEmpty()) {
        // get current point
        let point = eventQueue.pop()["point"]

        // update sweep line
        newState = {"points": [], "edges": []}
        let vertLineUpdate = createVerticalEdgeStateUpdatesFromPt(point, currentStates, {
            "stroke-dasharray": "10, 5"
        })
        newState.edges.push(vertLineUpdate)
        let pointUpdate = createPointStateUpdate(point, currentStates, {
            "fill": "red"
        })
        newState.points.push(pointUpdate)

        states.push(newState)
    }

    // set new states to stateList
    stateList.states = states
    stateList.curIteration = -1
    stateList.numIterations = states.length
    updateDisplay("next")
    console.log("New Line Sweep")
}

// set onClick
document.querySelector("#lineSweepBtn").onclick = lineSweep