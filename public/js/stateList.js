import { updateDisplay } from "/js/visualizer.js"

let stateList = null

// FUNCTION: initialize stateList
function initStateList() {
    stateList = {
        "curIteration": -1,
        "numIterations": -1,
        "isPlaying": false,
        "states": []
    }
    updateDisplay()
}

// FUNCTION: create pointUpdate JSON, get current State of point, update attributes, form new current state
function createPointStateUpdate(point, currentStates, nextAttr) {
    let pointUpdate = {
        "id": point.attr("id"), 
        "prev": JSON.parse(currentStates[point.attr("id")]),
        "next": JSON.parse(currentStates[point.attr("id")])
    }
    for (const [key, value] of Object.entries(nextAttr)) {
        pointUpdate.next[key] = value
    }
    currentStates[point.attr("id")] = JSON.stringify(pointUpdate.next)

    return pointUpdate
}

// FUNCTION: using points, create edgeUpdate JSON, get current State of edge if exists, update attributes, form new current state
function createEdgeStateUpdatesFromPts(point1, point2, movement, currentStates, nextAttr) {
    // get coordinates for each point
    let p1_coord = point1.attr("id").substring(1).split("-")
    let x1 = p1_coord[0]
    let y1 = p1_coord[1]
    let p2_coord = point2.attr("id").substring(1).split("-")
    let x2 = p2_coord[0]
    let y2 = p2_coord[1]

    // id is ordered with points left to right (top to bottom tiebreaker)
    let id = null
    if (x1 < x2) {
        id = `e_${point1.attr("id")}_${point2.attr("id")}`
    } else if (x1 > x2) {
        id = `e_${point2.attr("id")}_${point1.attr("id")}`

    } else {
        if (y1 < y2) {
            id = `e_${point1.attr("id")}_${point2.attr("id")}`
        } else {
            id = `e_${point2.attr("id")}_${point1.attr("id")}`
        }
    }

    // search for edge, base form on that
    let edge = currentStates[id]
    if (edge) {
        // edge does already exist
        let edgeUpdate = {
            "id": id, 
            "prev": JSON.parse(currentStates[id]),
            "next": JSON.parse(currentStates[id])
        }
        for (const [key, value] of Object.entries(nextAttr)) {
            edgeUpdate.next[key] = value
        }
        if (movement === "extend") {
            edgeUpdate.next["x2"] = JSON.parse(edgeUpdate.prev["data-extended-state"])["x2"]
            edgeUpdate.next["y2"] = JSON.parse(edgeUpdate.prev["data-extended-state"])["y2"]
        } else if (movement === "retract") {
            edgeUpdate.next["x2"] = JSON.parse(edgeUpdate.prev["data-extended-state"])["x1"]
            edgeUpdate.next["y2"] = JSON.parse(edgeUpdate.prev["data-extended-state"])["y1"]
        }
        currentStates[id] = JSON.stringify(edgeUpdate.next)

        return edgeUpdate
    } else {
        // edge does NOT already exist
        let edgeUpdate = {
            "id": id, 
            "prev": {
                "x1": x1,
                "y1": y1,
                "x2": x1,
                "y2": y1,
                "stroke": "",
                "stroke-dasharray": ""
            },
            "next": {
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "stroke": "black",
                "stroke-dasharray": ""
            }
        }
        for (const [key, value] of Object.entries(nextAttr)) {
            edgeUpdate.next[key] = value
        }
        if (movement === "extend") {
            edgeUpdate.next["x2"] = x2,
            edgeUpdate.next["y2"] = y2
        } else if (movement === "retract") {
            edgeUpdate.next["x2"] = x1,
            edgeUpdate.next["y2"] = y1
        }

        // store extended/retracted info
        let edgeExtendedState = JSON.stringify(edgeUpdate.next)
        let edgeRetractedState = JSON.stringify(edgeUpdate.prev)
        edgeUpdate.prev["data-extended-state"] = edgeExtendedState
        edgeUpdate.prev["data-retracted-state"] = edgeRetractedState
        edgeUpdate.next["data-extended-state"] = edgeExtendedState
        edgeUpdate.next["data-retracted-state"] = edgeRetractedState

        // store current state
        currentStates[id] = JSON.stringify(edgeUpdate.next)

        return edgeUpdate
    }
}

// FUNCTION: using points, create edgeUpdate JSON, get current State of edge if exists, update attributes, form new current state
function createVerticalEdgeStateUpdatesFromPt(point, currentStates, nextAttr) {
    // get coordinates for each point
    let p1_coord = point.attr("id").substring(1).split("-")
    let x1 = p1_coord[0]

    // id is ordered with points left to right (top to bottom tiebreaker)
    let id = "e_vertical"

    // search for edge, base form on that
    let edge = currentStates[id]
    if (edge) {
        // edge does already exist
        let edgeUpdate = {
            "id": id, 
            "prev": JSON.parse(currentStates[id]),
            "next": JSON.parse(currentStates[id])
        }

        for (const [key, value] of Object.entries(nextAttr)) {
            edgeUpdate.next[key] = value
        }
        edgeUpdate.next["x1"] = x1
        edgeUpdate.next["x2"] = x1

        currentStates[id] = JSON.stringify(edgeUpdate.next)

        return edgeUpdate
    } else {
        // edge does NOT already exist
        let edgeUpdate = {
            "id": id, 
            "prev": {
                "x1": 0,
                "y1": 0,
                "x2": 0,
                "y2": svg_height,
                "stroke": "",
                "stroke-dasharray": ""
            },
            "next": {
                "x1": x1,
                "y1": 0,
                "x2": x1,
                "y2": svg_height,
                "stroke": "black",
                "stroke-dasharray": ""
            }
        }
        for (const [key, value] of Object.entries(nextAttr)) {
            edgeUpdate.next[key] = value
        }

        // store current state
        currentStates[id] = JSON.stringify(edgeUpdate.next)

        return edgeUpdate
    }
}

// NOT USEABLE - FUNCTION: using edge, create edgeUpdate JSON, get current State of edge if exists, update attributes, form new current state
function createEdgeStateUpdatesFromEdge(edge, currentStates, nextAttr) {
    
}

export {stateList, initStateList, createPointStateUpdate, createEdgeStateUpdatesFromPts, createVerticalEdgeStateUpdatesFromPt }