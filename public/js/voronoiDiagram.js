import { stateList, reverseStates, initStateList, resetReverseStates, resetNewState, createEdgeStateUpdatesFromEdge, createPointStateUpdateFromPt, createVerticalEdgeStateUpdatesFromX, createEdgeStateUpdatesFromCoord, createPointStateUpdateFromCoord } from "/js/stateList.js"
import { points, edges, resetStates } from "/js/graphEditor.js"
import { updateDisplay, initPseudocodeText } from "/js/visualizer.js"
import { PriorityQueue, AVLTree, SegmentStatus, doIntersect, getSegmentIntersectionFromCoord, getEdgeIdFromCoord, getPerpendicularBisectorEndpointsFromPtIDs, getPointsTurnFromCoord, getEdgeCoordFromID, barelyExtendEndpointsFromCoord } from "/js/helper.js";

window.inputType = "point"

function incrementalVoronoi() {
    // NOTE: ON SVG, (0,0) IS TOP LEFT CORNER, SO MIGHT NEED TO FLIP SIGN OF Y-VALUES **CALCULATIONS ONLY**
    // initialize stateList and reset graph states
    initStateList()
    resetStates()
    resetReverseStates()

    // get list of points and edges and save current states
    let currentStates = {}
    let pointsList = points.find("circle")
    pointsList.each(point => {
        currentStates[point.attr("id")] = point.attr("data-init-state")
    })

    // set first state to essentially blank
    let states = []
    let newState = resetNewState(currentStates)
    states.push(newState)

    // initialize edgeIDList and cellList
    let edgeIDList = {} // with ID being key and holding data of 'cells', 'isBorder'
    let cellList = []


    // make state for first point the entire canvas
    let curPoint = pointsList.pop()
    let borderMargin = window.pointSize
    let borderEdges = [
        [[0+borderMargin, 0+borderMargin], [window.svg_width-borderMargin, 0+borderMargin]],
        [[window.svg_width-borderMargin, 0+borderMargin], [window.svg_width-borderMargin, window.svg_height-borderMargin]],
        [[0+borderMargin, window.svg_height-borderMargin], [window.svg_width-borderMargin, window.svg_height-borderMargin]],
        [[0+borderMargin, 0+borderMargin], [0+borderMargin, window.svg_height-borderMargin]]
    ]
    newState = resetNewState(currentStates)
    let newCell = new VoronoiCell(curPoint)
    borderEdges.forEach(border => {
        // get border id
        let borderID = getEdgeIdFromCoord(border[0], border[1])

        // add border id and data to edgeIDList and the newCell's edge list
        edgeIDList[borderID] = {
            "cells": [newCell],
            "isBorder": true
        }
        newCell.edgeIDs.push(borderID)

        // create state to highlight those borders
        newState.edges.push(createEdgeStateUpdatesFromCoord([border[0][0], border[0][1]], [border[1][0], border[1][1]], "none", currentStates, {
            "stroke": "blue",
            "stroke-width": 2
        }))
        reverseStates.edgesFromCoord.push({
            "p1_coord": [border[0][0], border[0][1]],
            "p2_coord": [border[1][0], border[1][1]],
            "movement": "none",
            "attr": {
                "stroke": "black",
                "stroke-width": 1
            }
        })
    })
    cellList.push(newCell)
    let curPoint_curState = JSON.parse(currentStates[curPoint.attr("id")])
    newState.points.push(createPointStateUpdateFromPt(curPoint, currentStates, {
        "fill": "purple",
        "stroke": "orange",
        "stroke-width": 3,
        "stroke-opacity": 1
    }))
    reverseStates.pointsFromPt.push({
        "pt": curPoint,
        "attr": {
            "fill": "blue",
            "stroke": curPoint_curState["stroke"],
            "stroke-width": curPoint_curState["stroke-width"],
            "stroke-opacity": curPoint_curState["stroke-opacity"]
        }
    })
    states.push(newState)


    // go point by point
    pointsList.forEach(curPoint => {
        // create new Cell for point
        newCell = new VoronoiCell(curPoint)
        console.log("**NEW CELL**", newCell)

        // create state for new cell point
        newState = resetNewState(currentStates)
        curPoint_curState = JSON.parse(currentStates[curPoint.attr("id")])
        newState.points.push(createPointStateUpdateFromPt(curPoint, currentStates, {
            "fill": "orange",
            "stroke": "orange",
            "stroke-width": 3,
            "stroke-opacity": 1
        }))
        states.push(newState)

        // for every other Cell in list
        let foundCritPoints = []
        cellList.forEach(curCell => {
            console.log("   **CHECK CELL**", curCell)
            handleCellComparison(newCell, curCell, edgeIDList, foundCritPoints, currentStates, states)
        })


        // add statement for reversing color of curPoint, push newState, push newCell
        reverseStates.pointsFromPt.push({
            "pt": curPoint,
            "attr": {
                "fill": "blue",
                "stroke": curPoint_curState["stroke"],
                "stroke-width": curPoint_curState["stroke-width"],
                "stroke-opacity": curPoint_curState["stroke-opacity"]
            }
        })
        cellList.push(newCell)
    })

    // add last state for displaying sick voronoi diagram
    newState = resetNewState(currentStates)
    states.push(newState)

    // set new states to stateList, update it, add pseudocode, update display
    stateList.states = states
    stateList.curIteration = -1
    stateList.numIterations = states.length
    //stateList.pseudocode = earClipCode
    //initPseudocodeText()
    updateDisplay("next")
    console.log("New Incremental Voronoi")
    console.log(states)
}

// cell used in voronoi diagrams
class VoronoiCell {
    constructor(point) {
        this.point = point
        this.edgeIDs = []
    }
}

// function handle comparing new cell to a current cell
function handleCellComparison(curCell, checkCell, edgeIDList, foundCritPoints, currentStates, states) {
    // get endpoints of perpendicular bisector
    let perpendicularBisectorPts = getPerpendicularBisectorEndpointsFromPtIDs(curCell.point, checkCell.point)

    // start new state for this comparison of curCell to newCell
    let newState = resetNewState(currentStates)

    // add state and reverse to show bisector
    newState.edges.push(createEdgeStateUpdatesFromCoord(perpendicularBisectorPts[0], perpendicularBisectorPts[1], "none", currentStates, {
        "stroke": "orange",
        "stroke-width": 2,
        "stroke-dasharray": "10, 5"
    }))

    // add state and reverse to highlight
    let cellPoint_curState = JSON.parse(currentStates[checkCell.point.attr("id")])
    newState.points.push(createPointStateUpdateFromPt(checkCell.point, currentStates, {
        "stroke": "orange",
        "stroke-width": 3,
        "stroke-opacity": 1
    }))

    // finish state for highlighting cell point and bisector
    states.push(newState)

    //  get testEdge coordinates & turn from bisector to new cell point
    let turnCurPoint = getPointsTurnFromCoord(perpendicularBisectorPts[0], perpendicularBisectorPts[1], [curCell.point.attr("cx"), curCell.point.attr("cy")])

    // for every edge in said cell, check relationship and mark as such
    let criticalPoints = []
    let edgeIDsToDelete = []
    newState = resetNewState(currentStates)
    checkCell.edgeIDs.forEach(testEdgeID => {
        // get intersection point
        let testEdgeCoord = getEdgeCoordFromID(testEdgeID)
        let intersectionLoc = getSegmentIntersectionFromCoord(perpendicularBisectorPts[0], perpendicularBisectorPts[1], testEdgeCoord[0], testEdgeCoord[1])

        // if don't intersect, then barely extend to see if missing point
        if (intersectionLoc === null) {
            let tempTestEdgeCoord = JSON.parse(JSON.stringify(testEdgeCoord))
            tempTestEdgeCoord = barelyExtendEndpointsFromCoord(tempTestEdgeCoord, 0.0000001)
            intersectionLoc = getSegmentIntersectionFromCoord(perpendicularBisectorPts[0], perpendicularBisectorPts[1], tempTestEdgeCoord[0], tempTestEdgeCoord[1])
        }

        // if still don't intersect then check if perp bisect goes close to 

        if (intersectionLoc !== null) {
            // save in critical points
            criticalPoints.push({
                "criticalPoint": intersectionLoc,
                "edgeID": testEdgeID
            })

            // make edge purple and add purple point at crit spot
            newState.edges.push(createEdgeStateUpdatesFromCoord(testEdgeCoord[0], testEdgeCoord[1], "none", currentStates, {
                "stroke": "purple",
                "stroke-width": 2
            }))
            reverseStates.edgesFromCoord.push({
                "p1_coord": testEdgeCoord[0],
                "p2_coord": testEdgeCoord[1],
                "movement": "none",
                "attr": {
                    "stroke": "black",
                    "stroke-width": 1
                }
            })
            newState.points.push(createPointStateUpdateFromCoord(intersectionLoc, currentStates, {
                "fill": "purple"
            }))
            reverseStates.pointsFromCoord.push({
                "coord": intersectionLoc,
                "attr": {
                    "fill": "",
                    "r": 0
                }
            })
        } else {
            // get turn from perp bisector to points of edge
            let turnTestEdgePoint1 = getPointsTurnFromCoord(perpendicularBisectorPts[0], perpendicularBisectorPts[1], testEdgeCoord[0])
            let turnTestEdgePoint2 = getPointsTurnFromCoord(perpendicularBisectorPts[0], perpendicularBisectorPts[1], testEdgeCoord[1])

            if (Math.sign(turnTestEdgePoint1) !== Math.sign(turnTestEdgePoint2)) {
                console.log("signs of turns messed up")
                console.log(perpendicularBisectorPts[0], perpendicularBisectorPts[1], testEdgeCoord[0], testEdgeCoord[1])
                console.log(testEdgeID)
                console.log(" ")
            }
            // if turn is in the same direction
            if (Math.sign(turnCurPoint) === Math.sign(turnTestEdgePoint1)) {
                // add to list of edges to delete (unless is border)
                edgeIDsToDelete.push(testEdgeID)

                // make edge red
                newState.edges.push(createEdgeStateUpdatesFromCoord(testEdgeCoord[0], testEdgeCoord[1], "none", currentStates, {
                    "stroke": "red",
                    "stroke-width": 2
                }))
            }
        }
    })
    states.push(newState)

    // handle marked relationships
    newState = resetNewState(currentStates)
    // handle splitting edges
    criticalPoints.forEach(critPt => {
        // check if close enough to previous crit point
        let updatedCritPt = false
        foundCritPoints.forEach(foundCrit => {
            let critX = critPt.criticalPoint[0]
            let critY = critPt.criticalPoint[1]
            let foundX = foundCrit[0]
            let foundY = foundCrit[1]

            if (Math.abs(critX-foundX) < 0.00000001 && Math.abs(critY-foundY) < 0.00000001) {
                critPt.criticalPoint = foundCrit
                updatedCritPt = true
            }
        })
        if (!updatedCritPt) {
            foundCritPoints.push(critPt.criticalPoint)
        }

        if (edgeIDList[critPt.edgeID].isBorder) {
            // if is border then split edge into 2 parts at crit point
            // far part stays with same cell, close part joins cell

            // get close and far coord
            let critEdgeCoord = getEdgeCoordFromID(critPt.edgeID)
            let closeCoord = critEdgeCoord[0]
            let farCoord = critEdgeCoord[1]
            let turnToClose = getPointsTurnFromCoord(perpendicularBisectorPts[0], perpendicularBisectorPts[1], closeCoord)
            if (Math.sign(turnCurPoint) !== Math.sign(turnToClose)) {
                let tempCoord = closeCoord
                closeCoord = farCoord
                farCoord = tempCoord
            }

            // create close split: get ID, add to edgeIDList and curCell, add state
            let closeEdgeID = getEdgeIdFromCoord(closeCoord, critPt.criticalPoint)
            edgeIDList[closeEdgeID] = {
                "cells": [curCell],
                "isBorder": true
            }
            curCell.edgeIDs.push(closeEdgeID)
            newState.edges.push(createEdgeStateUpdatesFromCoord(closeCoord, critPt.criticalPoint, "none", currentStates, {
                "stroke": "blue",
                "stroke-width": 2
            }))
            reverseStates.edgesFromCoord.push({
                "p1_coord": closeCoord,
                "p2_coord": critPt.criticalPoint,
                "movement": "none",
                "attr": {
                    "stroke": "black",
                    "stroke-width": 1
                }
            })

            // create far split: get ID, add to edgeIDList and checkCell, add state
            let farEdgeID = getEdgeIdFromCoord(farCoord, critPt.criticalPoint)
            edgeIDList[farEdgeID] = {
                "cells": [checkCell],
                "isBorder": true
            }
            checkCell.edgeIDs.push(farEdgeID)
            newState.edges.push(createEdgeStateUpdatesFromCoord(farCoord, critPt.criticalPoint, "none", currentStates, {
                "stroke": "blue",
                "stroke-width": 2
            }))
            reverseStates.edgesFromCoord.push({
                "p1_coord": farCoord,
                "p2_coord": critPt.criticalPoint,
                "movement": "none",
                "attr": {
                    "stroke": "black",
                    "stroke-width": 1
                }
            })

            // remove old edge from its matching cells and from edgeIDList, add state
            let oldEdgeCells = edgeIDList[critPt.edgeID].cells
            oldEdgeCells.forEach(cell => {
                cell.edgeIDs.splice(cell.edgeIDs.indexOf(critPt.edgeID), 1)
            })
            delete edgeIDList[critPt.edgeID]
            let delEdgeCoord = getEdgeCoordFromID(critPt.edgeID)
            newState.edges.push(createEdgeStateUpdatesFromCoord(delEdgeCoord[0], delEdgeCoord[1], "none", currentStates, {
                "stroke": "",
                "stroke-width": 0
            }))
        } else if(!updatedCritPt) {
            // if already updated this crit point then do NOT run b/c already updated related edges
            // if is just regular edge, cut edge to just further part
            // further part remains with same cells

            // get close and far coord
            let critEdgeCoord = getEdgeCoordFromID(critPt.edgeID)
            let closeCoord = critEdgeCoord[0]
            let farCoord = critEdgeCoord[1]
            let turnToClose = getPointsTurnFromCoord(perpendicularBisectorPts[0], perpendicularBisectorPts[1], closeCoord)
            if (Math.sign(turnCurPoint) !== Math.sign(turnToClose)) {
                let tempCoord = closeCoord
                closeCoord = farCoord
                farCoord = tempCoord
            }

            // create far split: get ID, add to edgeIDList and same cells, add state
            let farEdgeID = getEdgeIdFromCoord(farCoord, critPt.criticalPoint)
            let oldEdgeCells = edgeIDList[critPt.edgeID].cells
            edgeIDList[farEdgeID] = {
                "cells": oldEdgeCells,
                "isBorder": false
            }
            oldEdgeCells.forEach(cell => {
                cell.edgeIDs.push(farEdgeID)
            })
            newState.edges.push(createEdgeStateUpdatesFromCoord(farCoord, critPt.criticalPoint, "none", currentStates, {
                "stroke": "blue",
                "stroke-width": 2
            }))
            reverseStates.edgesFromCoord.push({
                "p1_coord": farCoord,
                "p2_coord": critPt.criticalPoint,
                "movement": "none",
                "attr": {
                    "stroke": "black",
                    "stroke-width": 1
                }
            })

            // remove old edge from its matching cells and from edgeIDList, add state
            oldEdgeCells.forEach(cell => {
                cell.edgeIDs.splice(cell.edgeIDs.indexOf(critPt.edgeID), 1)
            })
            delete edgeIDList[critPt.edgeID]
            let delEdgeCoord = getEdgeCoordFromID(critPt.edgeID)
            newState.edges.push(createEdgeStateUpdatesFromCoord(delEdgeCoord[0], delEdgeCoord[1], "none", currentStates, {
                "stroke": "",
                "stroke-width": 0
            }))
        }
    })
    // handle making connecting edge between the two critical points
    // add to both newCell and checkCell
    if (criticalPoints.length === 2) {
        // get ID, add to edgeIDList and curCell and checkCell, add state
        let connectP1 = criticalPoints[0].criticalPoint
        let connectP2 = criticalPoints[1].criticalPoint
        let connectEdgeID = getEdgeIdFromCoord(connectP1, connectP2)
        edgeIDList[connectEdgeID] = {
            "cells": [checkCell, curCell],
            "isBorder": false
        }
        checkCell.edgeIDs.push(connectEdgeID)
        curCell.edgeIDs.push(connectEdgeID)
        newState.edges.push(createEdgeStateUpdatesFromCoord(connectP1, connectP2, "none", currentStates, {
            "stroke": "blue",
            "stroke-width": 2
        }))
        reverseStates.edgesFromCoord.push({
            "p1_coord": connectP1,
            "p2_coord": connectP2,
            "movement": "none",
            "attr": {
                "stroke": "black",
                "stroke-width": 1
            }
        })
    } else if (criticalPoints.length !== 0) {
        console.log("crit points not 0 or 2:", criticalPoints)
    }
    // handle close edges
    edgeIDsToDelete.forEach(delEdgeID => {
        if (edgeIDList[delEdgeID].isBorder) {
            // if is border then move it to curCell
            // add to curCell, del from checkCell, update cells in edgeIDList, add state
            curCell.edgeIDs.push(delEdgeID)
            checkCell.edgeIDs.splice(checkCell.edgeIDs.indexOf(delEdgeID), 1)
            edgeIDList[delEdgeID].cells = [curCell]
            let delEdgeCoord = getEdgeCoordFromID(delEdgeID)
            let delPoint1 = delEdgeCoord[0]
            let delPoint2 = delEdgeCoord[1]
            newState.edges.push(createEdgeStateUpdatesFromCoord(delPoint1, delPoint2, "none", currentStates, {
                "stroke": "blue",
                "stroke-width": 2
            }))
            reverseStates.edgesFromCoord.push({
                "p1_coord": delPoint1, 
                "p2_coord": delPoint2,
                "movement": "none",
                "attr": {
                    "stroke": "black",
                    "stroke-width": 1
                }
            })

        } else {
            // if just regular edge then delete it
            // del from its cells, remove from edgeIDList, add state
            let oldEdgeCells = edgeIDList[delEdgeID].cells
            oldEdgeCells.forEach(cell => {
                cell.edgeIDs.splice(cell.edgeIDs.indexOf(delEdgeID), 1)
            })
            delete edgeIDList[delEdgeID]

            let delEdgeCoord = getEdgeCoordFromID(delEdgeID)
            let delPoint1 = delEdgeCoord[0]
            let delPoint2 = delEdgeCoord[1]
            newState.edges.push(createEdgeStateUpdatesFromCoord(delPoint1, delPoint2, "none", currentStates, {
                "stroke": "",
                "stroke-width": 0
            }))
        }
    })
    states.push(newState)


    // reset the highlighting of the curCell point and the perpendicular bisector
    reverseStates.pointsFromPt.push({
        "pt": checkCell.point,
        "attr": {
            "fill": "blue",
            "stroke": cellPoint_curState["stroke"],
            "stroke-width": cellPoint_curState["stroke-width"],
            "stroke-opacity": cellPoint_curState["stroke-opacity"]
        }
    })
    reverseStates.edgesFromCoord.push({
        "p1_coord": perpendicularBisectorPts[0],
        "p2_coord": perpendicularBisectorPts[1],
        "movement": "none",
        "attr": {
            "stroke": "",
            "stroke-width": 0
        }
    })
}

// set onClick
document.querySelector("#incrementalBtn").onclick = incrementalVoronoi