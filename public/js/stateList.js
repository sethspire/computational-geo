import { updateDisplay } from "/js/visualizer.js"

let stateList = null
let reverseStates = null

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

// FUNCTION: reset newState and include any resets needed
function resetNewState(currentStates) {
    let newState = {"points": [], "edges": []}

    if (reverseStates) {
        reverseStates["pointsFromPt"].forEach(pointReset => {
            newState.points.push(createPointStateUpdateFromPt(pointReset["pt"], currentStates, pointReset["attr"]))
        })
        reverseStates["pointsFromCoord"].forEach(pointReset => {
            newState.points.push(createPointStateUpdateFromCoord(pointReset["coord"], currentStates, pointReset["attr"]))
        })
        reverseStates["edgesFromEdge"].forEach(edgeReset => {
            newState.edges.push(createEdgeStateUpdatesFromEdge(edgeReset["edge"], currentStates, edgeReset["attr"]))
        })
        reverseStates["edgesFromPts"].forEach(edgeReset => {
            newState.edges.push(createEdgeStateUpdatesFromPts(edgeReset["p1"], edgeReset["p2"], edgeReset["movement"], currentStates, edgeReset["attr"]))
        })
    }

    resetReverseStates()
    // console.log(reverseStates, newState)
    return newState
}

// FUNCTION: reset reverseStates
function resetReverseStates() {
    reverseStates = {
        "pointsFromPt": [],
        "pointsFromCoord": [],
        "edgesFromEdge": [],
        "edgesFromPts": []
    }
}

// FUNCTION: using a point, create pointUpdate JSON, get current State of point, update attributes, form new current state
function createPointStateUpdateFromPt(point, currentStates, nextAttr) {
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

// FUNCTION: using coordinates, create pointUpdate JSON, get current State of point, update attributes, form new current state
function createPointStateUpdateFromCoord(coordinates, currentStates, nextAttr) {
    let x = Math.round(coordinates[0])
    let y = Math.round(coordinates[1])
    let id = `p${x}-${y}`

    let foundPoint = currentStates[id]
    if (foundPoint){
        let pointUpdate = {
            "id": id, 
            "prev": JSON.parse(currentStates[id]),
            "next": JSON.parse(currentStates[id])
        }
        for (const [key, value] of Object.entries(nextAttr)) {
            pointUpdate.next[key] = value
        }
        currentStates[id] = JSON.stringify(pointUpdate.next)

        return pointUpdate
    } else {
        let pointUpdate = {
            "id": id, 
            "prev": {
                "fill": "",
                "stroke-width": 0,
                "stroke": "red",
                "stroke-opacity": 0,
                "class": "svg-point-add",
                "r": 0,
                "cx": x,
                "cy": y
            },
            "next": {
                "fill": "black",
                "stroke-width": pointSize*4,
                "stroke": "red",
                "stroke-opacity": 0,
                "class": "svg-point-add",
                "r": Math.floor(pointSize/2),
                "cx": x,
                "cy": y
            }
        }
        for (const [key, value] of Object.entries(nextAttr)) {
            pointUpdate.next[key] = value
        }
        currentStates[id] = JSON.stringify(pointUpdate.next)
        return pointUpdate
    }
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

// FUNCTION: using a point, create edgeUpdate JSON, get current State of edge if exists, update attributes, form new current state
function createVerticalEdgeStateUpdatesFromX(x_val, currentStates, nextAttr) {
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
        edgeUpdate.next["x1"] = x_val
        edgeUpdate.next["x2"] = x_val

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
                "x1": x_val,
                "y1": 0,
                "x2": x_val,
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

// FUNCTION: using edge, create edgeUpdate JSON, get current State of edge if exists, update attributes, form new current state
function createEdgeStateUpdatesFromEdge(edge, currentStates, nextAttr) {
    if (edge) {
        // edge id
        let id = edge.attr("id")

        // edge does already exist
        let edgeUpdate = {
            "id": id, 
            "prev": JSON.parse(currentStates[id]),
            "next": JSON.parse(currentStates[id])
        }
        for (const [key, value] of Object.entries(nextAttr)) {
            edgeUpdate.next[key] = value
        }
        currentStates[id] = JSON.stringify(edgeUpdate.next)

        return edgeUpdate
    } else{
        console.log("help")
    }
}

export {stateList, reverseStates, initStateList, resetNewState, resetReverseStates, createPointStateUpdateFromPt, createEdgeStateUpdatesFromPts, createVerticalEdgeStateUpdatesFromX, createEdgeStateUpdatesFromEdge, createPointStateUpdateFromCoord }