import { stateList, reverseStates, initStateList, resetNewState, resetReverseStates, createPointStateUpdateFromPt, createEdgeStateUpdatesFromPts, createVerticalEdgeStateUpdatesFromX, createEdgeStateUpdatesFromEdge, createPointStateUpdateFromCoord, createPolygonStateUpdateFromPoints } from "/js/stateList.js"
import { getEdgeId, doIntersectFromPts } from "/js/helper.js"
import { points, edges, resetStates} from "/js/graphEditor.js"
import { updateDisplay, initPseudocodeText } from "/js/visualizer.js"

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

    // set first state to essentially blank
    let states = []
    let newState = resetNewState(currentStates)
    states.push(newState)

    // find left-most point, select top one if tie
    let leftPoint = pointsList[0]
    pointsList.each(point => {
        if (point.attr("cx") < leftPoint.attr("cx")) {
            leftPoint = point
        } else if (point.attr("cx") === leftPoint.attr("cx") && point.attr("cy") < leftPoint.attr("cy")) {
            leftPoint = point
        }
    })

    // get points before and after left-point
    let leftPtIndex = pointsList.findIndex(point => point.attr("id") === leftPoint.attr("id"))
    let numPoints = pointsList.length
    let prevPoint = pointsList[(leftPtIndex-1+numPoints) % numPoints]
    let nextPoint = pointsList[(leftPtIndex+1+numPoints) % numPoints]

    // if previous point polar angle is less than next polar angle, reverse pointsList so travel ccw
    let prevPolarAngle =  Math.atan2((-1)*prevPoint.attr("cy") - (-1)*leftPoint.attr("cy"), prevPoint.attr("cx") - leftPoint.attr("cx"))* 180 / Math.PI
    let nextPolarAngle =  Math.atan2((-1)*nextPoint.attr("cy") - (-1)*leftPoint.attr("cy"), nextPoint.attr("cx") - leftPoint.attr("cx"))* 180 / Math.PI
    if (prevPolarAngle < nextPolarAngle) {
        pointsList = (new  SVG.Array(pointsList)).reverse()
    }

    // get convex points and reflex points
    let convexPoints = []
    let reflexPoints = []
    pointsList.forEach(point => {
        let pointIndex = pointsList.findIndex(checkPoint => checkPoint.attr("id") === point.attr("id"))
        prevPoint = pointsList[(pointIndex-1+numPoints) % numPoints]
        nextPoint = pointsList[(pointIndex+1+numPoints) % numPoints]

        let x1 = prevPoint.attr("cx")
        let y1 = prevPoint.attr("cy")
        let x2 = point.attr("cx")
        let y2 = point.attr("cy")
        let x3 = nextPoint.attr("cx")
        let y3 = nextPoint.attr("cy")
        let turn = ((x2 - x1)*((-1)*y3 - (-1)*y1)) - (((-1)*y2 - (-1)*y1)*(x3 - x1))
        
        if (turn > 0) {
            convexPoints.push(point)
        } else {
            reflexPoints.push(point)
        }
    })

    // new state for showing convex points and reflex points
    newState = resetNewState(currentStates)
    convexPoints.forEach(cPoint => {
        let pointUpdate = createPointStateUpdateFromPt(cPoint, currentStates, {
            "fill": "black"
        })
        newState.points.push(pointUpdate)
    })
    reflexPoints.forEach(rPoint => {
        let pointUpdate = createPointStateUpdateFromPt(rPoint, currentStates, {
            "fill": "red"
        })
        newState.points.push(pointUpdate)
    })
    newState.codeLines = [1, 2]
    newState.status = "reflexPoints is those pointing inwards (red); convexPoints is those pointing outwards (black)"
    states.push(newState)

    // get ear points
    let earPoints = []
    convexPoints.forEach(cPoint => {
        if (isEarTip(cPoint, pointsList, reflexPoints, currentStates, states, 5)) {
            earPoints.push(cPoint)
        }
    })
    
    // clip ears
    let earNum = 0
    while (pointsList.length > 3) {
        console.log("enter clip ear")
        // remove ear point from ears list, get its direct neighbors, remove earPoint from pointsList
        let earToClip = earPoints.pop()
        let earToClipIndex = pointsList.findIndex(checkPoint => checkPoint.attr("id") === earToClip.attr("id"))
        numPoints = pointsList.length
        prevPoint = pointsList[(earToClipIndex-1+numPoints) % numPoints]
        nextPoint = pointsList[(earToClipIndex+1+numPoints) % numPoints]
        pointsList.splice(earToClipIndex, 1)

        // clip ear
        newState = resetNewState(currentStates)
        newState.edges.push(createEdgeStateUpdatesFromPts(prevPoint, nextPoint, "none", currentStates, {
            "stroke": "blue",
            "stroke-width": 1.5
        }))
        newState.points.push(createPointStateUpdateFromPt(earToClip, currentStates, {
            "fill": "blue"
        }))
        newState.polygons.push(createPolygonStateUpdateFromPoints([earToClip, prevPoint, nextPoint], `polygon_ear${earNum}`, currentStates, {
            "fill": "lightskyblue"
        }))
        newState.codeLines = [7, 8]
        newState.status = "clip ear by removing point and connecting neighbors to form triangle"
        states.push(newState)
        earNum++

        // update neighbors of ear point
        [prevPoint, nextPoint].forEach(point => {
            // get left and right points
            let pointIndex = pointsList.findIndex(checkPoint => checkPoint.attr("id") === point.attr("id"))
            let numPoints = pointsList.length
            let leftPoint = pointsList[(pointIndex-1+numPoints) % numPoints]
            let rightPoint = pointsList[(pointIndex+1+numPoints) % numPoints]

            // if was reflex point, check if can remove
            let reflexPointIndex = reflexPoints.findIndex(checkPoint => checkPoint.attr("id") === point.attr("id"))
            if (reflexPointIndex >= 0) {
                let x1 = leftPoint.attr("cx")
                let y1 = leftPoint.attr("cy")
                let x2 = point.attr("cx")
                let y2 = point.attr("cy")
                let x3 = rightPoint.attr("cx")
                let y3 = rightPoint.attr("cy")
                let turn = ((x2 - x1)*((-1)*y3 - (-1)*y1)) - (((-1)*y2 - (-1)*y1)*(x3 - x1))
                
                if (turn > 0) {
                    // move from reflex points to convex points list
                    reflexPoints.splice(reflexPointIndex, 1)
                    convexPoints.push(point)

                    // create state for moving to convex list
                    newState = resetNewState(currentStates)
                    newState.points.push(createPointStateUpdateFromPt(point, currentStates, {
                        "fill": "black"
                    }))
                    newState.codeLines = [10, 11, 12]
                    newState.status = "since points is now pointing outwards, move it to convexPoints"
                    states.push(newState)
                }
            }


            // if is convex point, check if is/still is ear
            let convexPointIndex = convexPoints.findIndex(checkPoint => checkPoint.attr("id") === point.attr("id"))
            let earPointIndex = earPoints.findIndex(checkPoint => checkPoint.attr("id") === point.attr("id"))
            if (convexPointIndex >= 0) {
                if (earPointIndex >= 0) {
                    if (isEarTip(point, pointsList, reflexPoints, currentStates, states, 14)) {

                    } else {
                        // remove from ear points list
                        earPoints.splice(earPointIndex, 1)
                    }
                } else {
                    if (isEarTip(point, pointsList, reflexPoints, currentStates, states, 14)) {
                        // add to ear points list
                        earPoints.push(point)
                    }
                }
            }
        })
    }

    // show last triangle is part of the thing
    newState = resetNewState(currentStates)
    pointsList.forEach(point => {
        newState.points.push(createPointStateUpdateFromPt(point, currentStates, {
            "fill": "blue"
        }))
    })
    newState.polygons.push(createPolygonStateUpdateFromPoints(pointsList, `polygon_ear${earNum}`, currentStates, {
        "fill": "lightskyblue"
    }))
    newState.codeLines = [15]
    newState.status = "the final triangle is formed by the remaining 3 points to finish triangulation"
    states.push(newState)

    // set new states to stateList, update it, add pseudocode, update display
    stateList.states = states
    stateList.curIteration = -1
    stateList.numIterations = states.length
    stateList.pseudocode = earClipCode
    initPseudocodeText()
    updateDisplay("next")
    console.log("New Ear Clip")
    console.log(states)
}

function isEarTip(point, pointsList, reflexPoints, currentStates, states, codeStartLine) {
    let numPoints = pointsList.length
    let pointIndex = pointsList.findIndex(checkPoint => checkPoint.attr("id") === point.attr("id"))
    let A = pointsList[(pointIndex-1+numPoints) % numPoints]
    let B = point
    let C = pointsList[(pointIndex+1+numPoints) % numPoints]

    let isEarTip = true
    reflexPoints.forEach(rPoint => {
        if (rPoint.attr("id") !== A.attr("id") && rPoint.attr("id") !== C.attr("id")) {
            let area_ABC = triangleArea(A, B, C)
            let area_PBC = triangleArea(rPoint, B, C)
            let area_APC = triangleArea(A, rPoint, C)
            let area_ABP = triangleArea(A, B, rPoint)

            if ((area_PBC + area_APC + area_ABP) === area_ABC) {
                isEarTip = false
            }
        }
    })

    let newState = resetNewState(currentStates)
    if (isEarTip) {
        newState.polygons.push(createPolygonStateUpdateFromPoints([A, B, C], "poly_checkIsEar", currentStates, {
            "fill": "palegreen",
            "fill-opacity": 1
        }))
        let B_curState = JSON.parse(currentStates[B.attr("id")])
        newState.points.push(createPointStateUpdateFromPt(B, currentStates, {
            "fill": "lime",
            "stroke": "orange",
            "stroke-width": 3,
            "stroke-opacity": 1
        }))

        reverseStates.polygonsFromID.push({
            "points": [A, B, C],
            "polygonID": "poly_checkIsEar",
            "attr": {
                "fill-opacity": 0,
                "fill": ""
            } 
        })
        reverseStates.pointsFromPt.push({
            "pt": B,
            "attr": {
                "stroke": B_curState["stroke"],
                "stroke-width": B_curState["stroke-width"],
                "stroke-opacity": B_curState["stroke-opacity"]
            }
        })
        newState.codeLines = [codeStartLine, 17, 20, 21]
        newState.status = "since the triangle of this point contains no other points, it is an ear tip (green)"
    } else {
        newState.polygons.push(createPolygonStateUpdateFromPoints([A, B, C], "poly_checkIsEar", currentStates, {
            "fill": "salmon",
            "fill-opacity": 1
        }))
        let B_curState = JSON.parse(currentStates[B.attr("id")])
        newState.points.push(createPointStateUpdateFromPt(B, currentStates, {
            "fill": "black",
            "stroke": "orange",
            "stroke-width": 3,
            "stroke-opacity": 1
        }))

        reverseStates.polygonsFromID.push({
            "points": [A, B, C],
            "polygonID": "poly_checkIsEar",
            "attr": {
                "fill-opacity": 0,
                "fill": ""
            } 
        })
        reverseStates.pointsFromPt.push({
            "pt": B,
            "attr": {
                "stroke": B_curState["stroke"],
                "stroke-width": B_curState["stroke-width"],
                "stroke-opacity": B_curState["stroke-opacity"]
            }
        })
        newState.codeLines = [codeStartLine, 17, 18, 19]
        newState.status = "since the triangle of this point contains other points, it is NOT an ear tip"
    }
    states.push(newState)

    return isEarTip
}

function triangleArea(p1, p2, p3) {
    let x1 = p1.attr("cx")
    let y1 = p1.attr("cy")
    let x2 = p2.attr("cx")
    let y2 = p2.attr("cy")
    let x3 = p3.attr("cx")
    let y3 = p3.attr("cy")

    return Math.abs( (x1*(y2-y3) + x2*(y3-y1) + x3*(y1-y2)) / 2.0 )
}

const earClipCode = [
    "reflexPoints= points at concave angle",
    "convexPoints= points at convex angle",
    "earPoints= convex that is ear tip",
    "for each in convexPoints:",
    "  check if point is ear tip",
    "while count(points) > 3:",
    "  remove point from earPoints",
    "  clip point by connecting neighbors",
    "  for both neighbors:",
    "    if is in reflexPoints:",
    "      if now convex:",
    "        move to convexPoints",
    "    if is in convexPoints:",
    "      check if point is ear tip",
    "remaining 3 points are final triangle",
    " ",
    "function checkIfEarTip:",
    "  if other point lies in ear:",
    "    remove from earPoints if exists",
    "  else:",
    "    add to earPoints"
]

document.querySelector("#earClipBtn").onclick = earClip