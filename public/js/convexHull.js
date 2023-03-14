import { stateList, initStateList, createEdgeStateUpdatesFromPts, createPointStateUpdateFromPt } from "/js/stateList.js"
import { points, resetStates} from "/js/graphEditor.js"
import { updateDisplay } from "/js/visualizer.js"


window.inputType = "point"

// FUNCTION: track points in order
function trackPoints() {
    // initialize stateList
    initStateList()

    // get points list and save current state
    let pointsList = points.find('circle')
    let prevPoint = null

    if (pointsList.length > 1) {
        // initial states list
        let newStates = []

        // initial state
        let curState = {"points": [], "edges": []}
        newStates.push(curState)

        // add states
        pointsList.each(function(point) {
            curState = {"points": [], "edges": []}
            let pointUpdate = {
                "id": point.attr("id"), 
                "prev": point.attr(),
                "next": point.attr()
            }
            pointUpdate.prev["fill"] = "black"
            pointUpdate.next["fill"] = "orange"
            curState.points.push(pointUpdate)

            if (prevPoint !== null) {
                let p1_coord = prevPoint.attr("id").substring(1).split("-")
                let x1 = p1_coord[0]
                let y1 = p1_coord[1]
                let p2_coord = point.attr("id").substring(1).split("-")
                let x2 = p2_coord[0]
                let y2 = p2_coord[1]
                let edgeUpdate = {
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

        //updateDisplay(direction="next")
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
    let pointsList = points.find("circle")
    let currentStates = {}
    pointsList.each(point => {
        currentStates[point.attr("id")] = point.attr("data-init-state")
    })

    // set first state to essentially blank
    let states = []
    let newState = {"points": [], "edges": []}
    states.push(newState)

    // find left-most point, select bottom one if tie
    let leftPoint = pointsList[0]
    pointsList.each(point => {
        if (point.attr("cx") < leftPoint.attr("cx")) {
            leftPoint = point
        } else if (point.attr("cx") === leftPoint.attr("cx") && (-1)*point.attr("cy") < (-1)*leftPoint.attr("cy")) {
            leftPoint = point
        }
    })

    // first state added is for selecting left most point
    newState = {"points": [], "edges": []}
    let leftPointUpdate = createPointStateUpdateFromPt(leftPoint, currentStates, {
        "fill": "blue"
    })
    newState.points.push(leftPointUpdate)
    states.push(newState)

    // get polar angle to left point
    let orderedPoints = []
    pointsList.each(point => {
        if (point !== leftPoint) {
            let polarAngle = Math.atan2((-1)*point.attr("cy") - (-1)*leftPoint.attr("cy"), point.attr("cx") - leftPoint.attr("cx"))* 180 / Math.PI
            orderedPoints.push({
                "polarAngle": polarAngle,
                "point": point
            })
        }
    })

    // create new state for checking polar angles
    newState = {"points": [], "edges": []}
    orderedPoints.forEach(pointData => {
        let pointUpdate = createPointStateUpdateFromPt(pointData.point, currentStates, {
            "fill": "orange"
        })
        newState.points.push(pointUpdate)

        let edgeUpdate = createEdgeStateUpdatesFromPts(leftPoint, pointData.point, "extend", currentStates, {
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
        let pointUpdate = createPointStateUpdateFromPt(pointData.point, currentStates, {
            "fill": "black"
        })
        newState.points.push(pointUpdate)

        let edgeUpdate = createEdgeStateUpdatesFromPts(leftPoint, pointData.point, "retract", currentStates, {
            "stroke": "",
            "stroke-dasharray": ""
        })
        newState.edges.push(edgeUpdate)
    })
    states.push(newState)

    // add leftPoint to stack and add first two points to stack and hull
    let hullStack = []
    hullStack.push(leftPoint)
    for (let i = 0; i < 2; i++) {
        let checkPoint = orderedPoints.shift().point

        // create new state
        newState = {"points": [], "edges": []}
        let pointUpdate = createPointStateUpdateFromPt(checkPoint, currentStates, {
            "fill": "blue"
        })
        newState.points.push(pointUpdate)
        let edgeUpdate = createEdgeStateUpdatesFromPts(hullStack.slice(-1)[0], checkPoint, "extend", currentStates, {
            "stroke": "blue"
        })
        newState.edges.push(edgeUpdate)
        states.push(newState)

        // push point to hullStack
        hullStack.push(checkPoint)
    }

    // GO POINT BY POINT
    orderedPoints.forEach(pointData => {
        let checkPoint = pointData.point

        // ADD NEW POINT TO HULL
        newState = {"points": [], "edges": []}
        let pointUpdate = createPointStateUpdateFromPt(checkPoint, currentStates, {
            "fill": "blue"
        })
        newState.points.push(pointUpdate)
        let edgeUpdate = createEdgeStateUpdatesFromPts(hullStack.slice(-1)[0], checkPoint, "extend", currentStates, {
            "stroke": "blue"
        })
        newState.edges.push(edgeUpdate)
        states.push(newState)

        // WHILE TRUE
        while (true) {
            // CHECK CCW TURN OF NEW POINT AND TOP 2 POINTS ON STACK
            let p1 = hullStack.slice(-2, -1)[0];
            let p2 = hullStack.slice(-1)[0];
            let p1_coord = p1.attr("id").substring(1).split("-");
            let x1 = p1_coord[0]
            let y1 = p1_coord[1]
            let p2_coord = p2.attr("id").substring(1).split("-");
            let x2 = p2_coord[0]
            let y2 = p2_coord[1]
            let p3_coord = checkPoint.attr("id").substring(1).split("-");
            let x3 = p3_coord[0]
            let y3 = p3_coord[1]
            let turn = ((x2 - x1)*((-1)*y3 - (-1)*y1)) - (((-1)*y2 - (-1)*y1)*(x3 - x1))

            // IF CCW
            if (turn > 0) {
                // BREAK
                break
            } else {
                // SHOW ANGLE IS BAD
                newState = {"points": [], "edges": []}
                pointUpdate = createPointStateUpdateFromPt(hullStack.slice(-1)[0], currentStates, {
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
    let edgeUpdate = createEdgeStateUpdatesFromPts(hullStack.slice(-1)[0], leftPoint, "extend", currentStates, {
        "stroke": "blue"
    })
    newState.edges.push(edgeUpdate)
    states.push(newState)

    // set new states to stateList
    stateList.states = states
    stateList.curIteration = -1
    stateList.numIterations = states.length
    updateDisplay("next")
    console.log("New Graham Scan")
}

// set onClick
document.querySelector("#grahamScanBtn").onclick = grahamScan
document.querySelector("#trackPointsBtn").onclick = trackPoints