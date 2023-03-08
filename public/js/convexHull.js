const inputType = "point"
let stateList = {
    "curIteration": -1,
    "numIterations": -1,
    "isPlaying": false,
    "states": []
}

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

// FUNCTION: track points in order
function trackPoints() {
    // initialize stateList
    initStateList()

    // get points list and save current state
    pointsList = points.find('circle')
    prevPoint = null

    if (pointsList.length > 1) {
        // initial states list
        newStates = []

        // initial state
        curState = {"points": [], "edges": []}
        newStates.push(curState)

        // add states
        pointsList.each(function(point) {
            curState = {"points": [], "edges": []}
            pointUpdate = {
                "id": point.attr("id"), 
                "prev": point.attr(),
                "next": point.attr()
            }
            pointUpdate.prev["fill"] = "black"
            pointUpdate.next["fill"] = "orange"
            curState.points.push(pointUpdate)

            if (prevPoint !== null) {
                [x1, y1] = prevPoint.attr("id").substring(1).split("-");
                [x2, y2] = point.attr("id").substring(1).split("-");
                edgeUpdate = {
                    "id": `e_${prevPoint.attr("id")}_${point.attr("id")}`, 
                    "prev": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x1,
                        "y2": y1,
                        "stroke": ""
                    },
                    "next": {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                        "stroke": "orange"
                    }
                }
                curState.edges.push(edgeUpdate)
            }

            newStates.push(curState)
            prevPoint = point
        })

        stateList.states = newStates
        stateList.curIteration = -1
        stateList.numIterations = newStates.length

        updateDisplay(direction="next")
    } else {
        stateList = {
            "curIteration": -1,
            "numIterations": -1,
            "states": []
        }
    }
}

// FUNCTION: create stateList for Graham's Scan in 
function grahamScan() {
    // NOTE: ON SVG, (0,0) IS TOP LEFT CORNER, SO JUST NEED TO FLIP SIGN OF Y-VALUES **CALCULATIONS ONLY**
    // initialize stateList and reset graph states
    initStateList()
    resetStates()

    // get list of points and save current states
    pointsList = points.find("circle")
    currentStates = {}
    pointsList.each(point => {
        currentStates[point.attr("id")] = point.attr("data-init-state")
    })

    // set first state to essentially blank
    states = []
    newState = {"points": [], "edges": []}
    states.push(newState)

    // find left-most point, select bottom one if tie
    leftPoint = pointsList[0]
    pointsList.each(point => {
        if (point.attr("cx") < leftPoint.attr("cx")) {
            leftPoint = point
        } else if (point.attr("cx") === leftPoint.attr("cx") && (-1)*point.attr("cy") < (-1)*leftPoint.attr("cy")) {
            leftPoint = point
        }
    })

    // first state added is for selecting left most point
    newState = {"points": [], "edges": []}
    leftPointUpdate = createPointStateUpdate(leftPoint, currentStates, {
        "fill": "blue"
    })
    newState.points.push(leftPointUpdate)
    states.push(newState)

    // get polar angle to left point
    orderedPoints = []
    pointsList.each(point => {
        if (point !== leftPoint) {
            polarAngle = Math.atan2((-1)*point.attr("cy") - (-1)*leftPoint.attr("cy"), point.attr("cx") - leftPoint.attr("cx"))* 180 / Math.PI
            orderedPoints.push({
                "polarAngle": polarAngle,
                "point": point
            })
        }
    })

    // create new state for checking polar angles
    newState = {"points": [], "edges": []}
    orderedPoints.forEach(pointData => {
        pointUpdate = createPointStateUpdate(pointData.point, currentStates, {
            "fill": "orange"
        })
        newState.points.push(pointUpdate)

        edgeUpdate = createEdgeStateUpdatesFromPts(leftPoint, pointData.point, "extend", currentStates, {
            "stroke": "orange",
            "stroke-dasharray": "10, 10"
        })
        newState.edges.push(edgeUpdate)
    })
    states.push(newState)

    // sort points in counterclockwise fashion
    orderedPoints.sort((p1, p2) => {
        return p1.polarAngle - p2.polarAngle
    })

    // create new state for removing polar angle checks in order
    newState = {"points": [], "edges": []}
    orderedPoints.forEach(pointData => {
        pointUpdate = createPointStateUpdate(pointData.point, currentStates, {
            "fill": "black"
        })
        newState.points.push(pointUpdate)

        edgeUpdate = createEdgeStateUpdatesFromPts(leftPoint, pointData.point, "retract", currentStates, {
            "stroke": "",
            "stroke-dasharray": ""
        })
        newState.edges.push(edgeUpdate)
    })
    states.push(newState)

    // add leftPoint to stack and add first two points to stack and hull
    hullStack = []
    hullStack.push(leftPoint)
    for (i = 0; i < 2; i++) {
        checkPoint = orderedPoints.shift().point

        // create new state
        newState = {"points": [], "edges": []}
        pointUpdate = createPointStateUpdate(checkPoint, currentStates, {
            "fill": "blue"
        })
        newState.points.push(pointUpdate)
        edgeUpdate = createEdgeStateUpdatesFromPts(hullStack.slice(-1)[0], checkPoint, "extend", currentStates, {
            "stroke": "blue"
        })
        newState.edges.push(edgeUpdate)
        states.push(newState)

        // push point to hullStack
        hullStack.push(checkPoint)
    }

    // GO POINT BY POINT
    orderedPoints.forEach(pointData => {
        checkPoint = pointData.point

        // ADD NEW POINT TO HULL
        newState = {"points": [], "edges": []}
        pointUpdate = createPointStateUpdate(checkPoint, currentStates, {
            "fill": "blue"
        })
        newState.points.push(pointUpdate)
        edgeUpdate = createEdgeStateUpdatesFromPts(hullStack.slice(-1)[0], checkPoint, "extend", currentStates, {
            "stroke": "blue"
        })
        newState.edges.push(edgeUpdate)
        states.push(newState)

        // WHILE TRUE
        while (true) {
            // CHECK CCW TURN OF NEW POINT AND TOP 2 POINTS ON STACK
            p1 = hullStack.slice(-2, -1)[0];
            p2 = hullStack.slice(-1)[0];
            p1_coord = p1.attr("id").substring(1).split("-");
            x1 = p1_coord[0]
            y1 = p1_coord[1]
            p2_coord = p2.attr("id").substring(1).split("-");
            x2 = p2_coord[0]
            y2 = p2_coord[1]
            p3_coord = checkPoint.attr("id").substring(1).split("-");
            x3 = p3_coord[0]
            y3 = p3_coord[1]
            turn = ((x2 - x1)*((-1)*y3 - (-1)*y1)) - (((-1)*y2 - (-1)*y1)*(x3 - x1))

            // IF CCW
            if (turn > 0) {
                // BREAK
                break
            } else {
                // SHOW ANGLE IS BAD
                newState = {"points": [], "edges": []}
                pointUpdate = createPointStateUpdate(hullStack.slice(-1)[0], currentStates, {
                    "fill": "red"
                })
                newState.points.push(pointUpdate)
                edgeUpdate = createEdgeStateUpdatesFromPts(hullStack.slice(-1)[0], checkPoint, "extend", currentStates, {
                    "stroke": "red"
                })
                newState.edges.push(edgeUpdate)
                edgeUpdate = createEdgeStateUpdatesFromPts(hullStack.slice(-1)[0], hullStack.slice(-2, -1)[0], "extend", currentStates, {
                    "stroke": "red"
                })
                newState.edges.push(edgeUpdate)
                states.push(newState)

                // SHOW NEW PATH
                newState = {"points": [], "edges": []}
                edgeUpdate = createEdgeStateUpdatesFromPts(hullStack.slice(-2, -1)[0], checkPoint, "extend", currentStates, {
                    "stroke": "blue"
                })
                newState.edges.push(edgeUpdate)
                states.push(newState)

                // POP PREV POINT FROM STACK
                hullStack.pop()
            }
        }

        // ADD NEW POINT TO STACK
        hullStack.push(checkPoint)
    })

    // ADD FINAL CONNECTION OF PATH
    newState = {"points": [], "edges": []}
    edgeUpdate = createEdgeStateUpdatesFromPts(hullStack.slice(-1)[0], leftPoint, "extend", currentStates, {
        "stroke": "blue"
    })
    newState.edges.push(edgeUpdate)
    states.push(newState)

    // set new states to stateList
    stateList.states = states
    stateList.curIteration = -1
    stateList.numIterations = states.length
    updateDisplay(direction="next")
    console.log("New Graham Scan")
}

// FUNCTION: create pointUpdate JSON, get current State of point, update attributes, form new current state
function createPointStateUpdate(point, currentStates, nextAttr) {
    pointUpdate = {
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
    [x1, y1] = point1.attr("id").substring(1).split("-");
    [x2, y2] = point2.attr("id").substring(1).split("-");
    // id is ordered with points left to right (top to bottom tiebreaker)
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
    edge = currentStates[id]
    if (edge) {
        // edge does already exist
        edgeUpdate = {
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
        edgeUpdate = {
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
        edgeExtendedState = JSON.stringify(edgeUpdate.next)
        edgeRetractedState = JSON.stringify(edgeUpdate.prev)
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
function createEdgeStateUpdatesFromEdge(edge, currentStates, nextAttr) {
    pointUpdate = {
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