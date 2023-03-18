import { stateList, reverseStates, initStateList, resetReverseStates, resetNewState, createEdgeStateUpdatesFromEdge, createPointStateUpdateFromPt, createVerticalEdgeStateUpdatesFromX, createPointStateUpdateFromCoord } from "/js/stateList.js"
import { getEdgeId, doIntersectFromPts } from "/js/helper.js"
import { points, edges, resetStates} from "/js/graphEditor.js"

window.inputType = "polygon-simple"

function earClip() {
    // NOTE: ON SVG, (0,0) IS TOP LEFT CORNER, SO JUST NEED TO FLIP SIGN OF Y-VALUES **CALCULATIONS ONLY**
    // initialize stateList and reverseStatesList and reset graph states
    initStateList()
    resetStates()
    resetReverseStates()

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

    // check if can actually complete polygon
    let lastPoint = pointsList[pointsList.length-1]
    let firstPoint = pointsList[0]
    let foundIntersection = false
    for (let i = 1; i < edgesList.length-1; i++) {
        let edge = edgesList[i]
        let segmentId = edge.attr("id")
        let segmentPointIDs = segmentId.split("_").slice(1,3)
        let p2 = points.findOne(`[id=${segmentPointIDs[0]}]`)
        let q2 = points.findOne(`[id=${segmentPointIDs[1]}]`)
        foundIntersection = doIntersectFromPts(firstPoint, lastPoint, p2, q2) || foundIntersection
    }
    if (foundIntersection) {
        alert("Cannot complete polygon. Ensure dotted line connecting endpoints is green, not red.")
        return
    }

    // add connecting line
    let id = getEdgeId(firstPoint, lastPoint)
    let connectingEdge = edges.line().attr({
        "x1": lastPoint.attr("cx"),
        "y1": lastPoint.attr("cy"),
        "x2": firstPoint.attr("cx"),
        "y2": firstPoint.attr("cy"),
        "stroke": "black",
        "id": id
    })
    let edgeInitialState = JSON.stringify(connectingEdge.attr())
    connectingEdge.attr("data-init-state", edgeInitialState)
    edgesList.push(connectingEdge)
    currentStates[id] = edgeInitialState

    // find left-most point, select top one if tie
    let leftPoint = pointsList[0]
    pointsList.each(point => {
        if (point.attr("cx") < leftPoint.attr("cx")) {
            leftPoint = point
        } else if (point.attr("cx") === leftPoint.attr("cx") && point.attr("cy") < leftPoint.attr("cy")) {
            leftPoint = point
        }
    })

    console.log(leftPoint)
}

document.querySelector("#earClipBtn").onclick = earClip