import { stateList, reverseStates, initStateList, resetReverseStates, resetNewState, createEdgeStateUpdatesFromEdge, createPointStateUpdateFromPt, createVerticalEdgeStateUpdatesFromX, createPointStateUpdateFromCoord } from "/js/stateList.js"
import { points, edges, resetStates } from "/js/graphEditor.js"
import { updateDisplay } from "/js/visualizer.js"
import { PriorityQueue, AVLTree } from "/js/helper.js";

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

    // this is used to know what things to be reset on the next iteration of newState
    resetReverseStates()

    // dictionary of point IDs for where intersections are found
    let intersections = {}
    let comparisons = 0

    // set first state to essentially blank
    let states = []
    let newState = resetNewState(currentStates)
    states.push(newState)

    // place all endpoints in a priority queue
    let eventQueue = new PriorityQueue((a, b) => a["sortVal"] < b["sortVal"])
    edgesList.each(edge => {
        let segmentId = edge.attr("id")
        let pointIDs = segmentId.split("_").slice(1,3)
        
        let startPoint = points.findOne(`[id=${pointIDs[0]}]`)
        let endPoint = points.findOne(`[id=${pointIDs[1]}]`)

        eventQueue.push({
            "point": startPoint,
            "sortVal": Number(startPoint.attr("cx")) + Number(startPoint.attr("cy"))/svg_height,
            "eventType": "left"
        })
        eventQueue.push({
            "point": endPoint,
            "sortVal": Number(endPoint.attr("cx")) + Number(endPoint.attr("cy"))/svg_height,
            "eventType": "right"
        })
    })

    // set sweep status ordered dictionary
    let sweepStatus = new AVLTree((a, b) => a["sortVal"]() > b["sortVal"]())

    // go event point by event point
    while (!eventQueue.isEmpty()) {
        // start new state
        newState = resetNewState(currentStates)

        // get current event, point, and x-value
        let event = eventQueue.pop()
        let point = event["point"]
        let pointLoc = event["pointLoc"]

        // update sweepX and event point based on values
        if (point) {
            window.sweepX = point.attr("cx")

            // get point ID
            let pointID = point.attr("id")

            // create update for point with reverse state
            let ptCurState = JSON.parse(currentStates[pointID])
            newState.points.push(createPointStateUpdateFromPt(point, currentStates, {
                "fill": "red"
            }))
            reverseStates.pointsFromPt.push({
                "pt": point,
                "attr": {
                    "fill": ptCurState["fill"]
                }
            })
        }
        if (pointLoc) {
            console.log(pointLoc)
            window.sweepX = pointLoc[0]

            // get point ID
            let x = Math.round(pointLoc[0])
            let y = Math.round(pointLoc[1])
            let pointID = `p${x}-${y}`

            // create update for point with reverse state
            let ptCurState = JSON.parse(currentStates[pointID])
            newState.points.push(createPointStateUpdateFromCoord(pointLoc, currentStates, {
                "fill": "red"
            }))
            reverseStates.pointsFromCoord.push({
                "coord": pointLoc,
                "attr": {
                    "fill": ptCurState["fill"]
                }
            })
        }

        // update sweep line
        newState.edges.push(createVerticalEdgeStateUpdatesFromX(sweepX, currentStates, {
            "stroke-dasharray": "10, 5",
            "stroke": "red",
            "stroke-width": 2
        }))
        
        // different things to check based on event type
        if (event["eventType"] === "left") {
            //console.log("FOUND LEFT")
            // add segment to sweepStatus
            let segment = edges.findOne(`[id=${point.attr("data-segmentID")}]`)
            let segmentStatus = new SegmentStatus(segment)
            sweepStatus.insertNode(segmentStatus)
            newState.edges.push(createEdgeStateUpdatesFromEdge(segment, currentStates, {
                "stroke": "orange",
                "stroke-width": 3
            }))
            states.push(newState)

            // get segment predecessor and successor
            let segmentPredNode = sweepStatus.findPredecessor(segmentStatus)
            let segmentSuccNode = sweepStatus.findSuccessor(segmentStatus)

            // check for intersection between new segment, predecessor, successor
            if (segmentPredNode) {
                let segmentPred = segmentPredNode.item.segment
                let intersectionLoc = checkIntersection(segment, segmentPred, currentStates, states, eventQueue, intersections)
                comparisons += 1
            }
            if (segmentSuccNode) {
                let segmentSucc = segmentSuccNode.item.segment
                let intersectionLoc = checkIntersection(segment, segmentSucc, currentStates, states, eventQueue, intersections)
                comparisons += 1
            }              
        } else if (event["eventType"] === "right") {
            //console.log("FOUND RIGHT")
            // add segment to sweepStatus
            let segment = edges.findOne(`[id=${point.attr("data-segmentID")}]`)
            let segmentStatus = new SegmentStatus(segment)
            newState.edges.push(createEdgeStateUpdatesFromEdge(segment, currentStates, {
                "stroke": "black",
                "stroke-width": 1
            }))
            states.push(newState)

            // get segment predecessor and successor, then remove segment from AVL tree
            let segmentPredNode = sweepStatus.findPredecessor(segmentStatus)
            let segmentSuccNode = sweepStatus.findSuccessor(segmentStatus)
            sweepStatus.deleteNode(segmentStatus)

            // check for intersection between predecessor and successor
            if (segmentPredNode && segmentSuccNode) {
                let segmentPred = segmentPredNode.item.segment
                let segmentSucc = segmentSuccNode.item.segment
                let intersectionLoc = checkIntersection(segmentPred, segmentSucc, currentStates, states, eventQueue, intersections)
                comparisons += 1
            }
        } else if (event["eventType"] === "intersection") {
            //console.log("FOUND INTER")
            states.push(newState)

            // get segments
            let segmentStatusTop = event.segments[0]
            let segmentNodeTopPred = sweepStatus.findPredecessor(segmentStatusTop)
            let segmentStatusBottom = event.segments[1]
            let segmentNodeBottomSucc = sweepStatus.findSuccessor(segmentStatusBottom)

            // check for intersection between top and bottom succ; bottom and top pred
            if (segmentStatusTop && segmentNodeBottomSucc) {
                let segmentTop = segmentStatusTop.segment
                let segmentBottomSucc = segmentNodeBottomSucc.item.segment
                let intersectionLoc = checkIntersection(segmentTop, segmentBottomSucc, currentStates, states, eventQueue, intersections)
                comparisons += 1
            }
            if (segmentStatusBottom && segmentNodeTopPred) {
                let segmentBottom = segmentStatusBottom.segment
                let segmentTopPred = segmentNodeTopPred.item.segment
                let intersectionLoc = checkIntersection(segmentBottom, segmentTopPred, currentStates, states, eventQueue, intersections)
                comparisons += 1
            }

            // swap segment top and segment bottom
            sweepStatus.swapSuccessor(segmentStatusTop)
        }
    }

    // set new states to stateList
    console.log(states)
    stateList.states = states
    stateList.curIteration = -1
    stateList.numIterations = states.length
    updateDisplay("next")
    console.log("New Line Sweep")
    console.log(`Edges:${edgesList.length} ; Comparisons:${comparisons} ;  Brute Forces:${(edgesList.length*(edgesList.length-1))/2}`)
}


// FUNCTION: create stateList for Line Sweep
function lineSweepEndpoints() {
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
    let newState = resetNewState()
    states.push(newState)

    // place all endpoints in a priority queue
    let eventQueue = new PriorityQueue((a, b) => a["sortVal"] < b["sortVal"])
    let sweepStatus = new AVLTree((a, b) => a["sortVal"] > b["sortVal"])
    edgesList.each(edge => {
        let segmentId = edge.attr("id")
        let pointIDs = segmentId.split("_").slice(1,3)
        
        let startPoint = points.findOne(`[id=${pointIDs[0]}]`)
        let endPoint = points.findOne(`[id=${pointIDs[1]}]`)

        let lPoint = {
            "point": startPoint,
            "sortVal": Number(startPoint.attr("cx")) + Number(startPoint.attr("cy"))/svg_height,
            "eventType": "left"
        }
        let rPoint = {
            "point": endPoint,
            "sortVal": Number(endPoint.attr("cx")) + Number(endPoint.attr("cy"))/svg_height,
            "eventType": "right"
        }

        eventQueue.push(lPoint)
        eventQueue.push(rPoint)
        sweepStatus.insertNode(lPoint)
        sweepStatus.insertNode(rPoint)
    })
    let randomEvent = eventQueue._heap[Math.floor(Math.random() * eventQueue._heap.length)]

    // go event point by event point
    while (!eventQueue.isEmpty()) {
        // get current event and point
        let event = eventQueue.pop()
        let point = event["point"]

        // update sweep line
        newState = resetNewState()
        let vertLineUpdate = createVerticalEdgeStateUpdatesFromX(point.attr("cx"), currentStates, {
            "stroke-dasharray": "10, 5"
        })
        newState.edges.push(vertLineUpdate)
        let testType = {
            "left": "orange",
            "right": "purple"
        }
        let pointUpdate = createPointStateUpdateFromPt(point, currentStates, {
            "fill": testType[event["eventType"]]
        })
        newState.points.push(pointUpdate)

        states.push(newState)
    }

    // print AVL Tree
    // sweepStatus.preOrder()
    sweepStatus.inOrder()
    console.log("random:", randomEvent)
    //console.log("pred:", sweepStatus.findPredecessor(randomEvent).item)
    //console.log("parent:", sweepStatus.findParent(randomEvent).item)
    sweepStatus.swapSuccessor(randomEvent)
    sweepStatus.inOrder()

    // set new states to stateList
    stateList.states = states
    stateList.curIteration = -1
    stateList.numIterations = states.length
    updateDisplay("next")
    console.log("New Line Sweep")
}

// FUNCTION: get the slope and y intercept of a segment
function getLineEquation(segment) {
    let segmentId = segment.attr("id")
    let pointIDs = segmentId.split("_").slice(1,3)

    let p1_coord = pointIDs[0].substring(1).split("-")
    let x1 = Number(p1_coord[0])
    let y1 = Number(p1_coord[1])
    let p2_coord = pointIDs[1].substring(1).split("-")
    let x2 = Number(p2_coord[0])
    let y2 = Number(p2_coord[1])

    let slope = (y1-y2)/(x1-x2)
    let y_int = (x1*y2 - y1*x2)/(x1-x2)

    return [slope, y_int]
}

// FUNCTION: Given three collinear points p, q, r, the function checks if point q lies on line segment 'pr'
function onSegment(p, q, r) {
    let p_x = p.attr("cx")
    let q_x = q.attr("cx")
    let r_x = r.attr("cx")
    let p_y = p.attr("cy")
    let q_y = q.attr("cy")
    let r_y = r.attr("cy")
    if (q_x <= Math.max(p_x, r_x) && q_x >= Math.min(p_x, r_x) &&
        q_y <= Math.max(p_y, r_y) && q_y >= Math.min(p_y, r_y)) {
        return true;
    }
    
    return false;
}
  
// FUNCTION: To find orientation of ordered triplet (p, q, r).
function orientation(p, q, r) {
    // 0 --> p, q and r are collinear
    // 1 --> Clockwise
    // 2 --> Counterclockwise
    let p_x = p.attr("cx")
    let q_x = q.attr("cx")
    let r_x = r.attr("cx")
    let p_y = p.attr("cy")
    let q_y = q.attr("cy")
    let r_y = r.attr("cy")

    let val = (q_y-p_y) * (r_x-q_x) - (q_x-p_x) * (r_y-q_y);
    
    if (val == 0) return 0; // collinear
    
    return (val > 0)? 1: 2; // clock or counterclock wise
}
  
// FUNCTION: returns true if line segments intersect.
function doIntersect(segment1, segment2) {
    let segment1Id = segment1.attr("id")
    let segment1PointIDs = segment1Id.split("_").slice(1,3)
    let p1 = points.findOne(`[id=${segment1PointIDs[0]}]`)
    let q1 = points.findOne(`[id=${segment1PointIDs[1]}]`)
    let segment2Id = segment2.attr("id")
    let segment2PointIDs = segment2Id.split("_").slice(1,3)
    let p2 = points.findOne(`[id=${segment2PointIDs[0]}]`)
    let q2 = points.findOne(`[id=${segment2PointIDs[1]}]`)

  
    // Find the four orientations needed for general and
    // special cases
    let o1 = orientation(p1, q1, p2);
    let o2 = orientation(p1, q1, q2);
    let o3 = orientation(p2, q2, p1);
    let o4 = orientation(p2, q2, q1);
    
    // General case
    if (o1 != o2 && o3 != o4) return true

    // Special Cases
    // p1, q1 and p2 are collinear and p2 lies on segment p1q1
    if (o1 == 0 && onSegment(p1, p2, q1)) return true;
    
    // p1, q1 and q2 are collinear and q2 lies on segment p1q1
    if (o2 == 0 && onSegment(p1, q2, q1)) return true;
    
    // p2, q2 and p1 are collinear and p1 lies on segment p2q2
    if (o3 == 0 && onSegment(p2, p1, q2)) return true;
    
    // p2, q2 and q1 are collinear and q1 lies on segment p2q2
    if (o4 == 0 && onSegment(p2, q1, q2)) return true;
    
    return false; // Doesn't fall in any of the above cases
}

// FUNCTION: 
function getSegmentsIntersection(segment1, segment2){
    // get points of segments
    let segment1Id = segment1.attr("id")
    let segment1PointIDs = segment1Id.split("_").slice(1,3)
    let A = points.findOne(`[id=${segment1PointIDs[0]}]`)
    let B = points.findOne(`[id=${segment1PointIDs[1]}]`)
    let segment2Id = segment2.attr("id")
    let segment2PointIDs = segment2Id.split("_").slice(1,3)
    let C = points.findOne(`[id=${segment2PointIDs[0]}]`)
    let D = points.findOne(`[id=${segment2PointIDs[1]}]`)

    // Line AB represented as a1x + b1y = c1
    var a1 = B.attr("cy") - A.attr("cy");
    var b1 = A.attr("cx") - B.attr("cx");
    var c1 = a1*(A.attr("cx")) + b1*(A.attr("cy"));
    
    // Line CD represented as a2x + b2y = c2
    var a2 = D.attr("cy") - C.attr("cy");
    var b2 = C.attr("cx") - D.attr("cx");
    var c2 = a2*(C.attr("cx"))+ b2*(C.attr("cy"));
    
    var determinant = a1*b2 - a2*b1;
    
    if (determinant == 0) {
        // The lines are parallel. This is simplified
        // by returning a pair of FLT_MAX
        return null;
    }
    else {
        var x = (b2*c1 - b1*c2)/determinant;
        var y = (a1*c2 - a2*c1)/determinant;
        return [x, y];
    }
}

// FUNCTION: test for intersection between 2 segments, add to states list
function checkIntersection(segment1, segment2, currentStates, states, eventQueue, intersections) {
    let newState = resetNewState(currentStates)
    
    // make segments purple
    newState.edges.push(createEdgeStateUpdatesFromEdge(segment1, currentStates, {
        "stroke": "purple"
    }))
    reverseStates.edgesFromEdge.push({
        "edge": segment1,
        "attr": {
            "stroke": "orange"
        }
    })
    newState.edges.push(createEdgeStateUpdatesFromEdge(segment2, currentStates, {
        "stroke": "purple"
    }))
    reverseStates.edgesFromEdge.push({
        "edge": segment2,
        "attr": {
            "stroke": "orange"
        }
    })

    // check for intersection
    let intersectionLoc = getSegmentsIntersection(segment1, segment2)
    let pointId = `p${intersectionLoc[0]}-${intersectionLoc[1]}`
    if (doIntersect(segment1, segment2) && intersectionLoc) {
        //console.log("Intersection:", intersectionLoc, segment1.node, segment2.node)
        newState.points.push(createPointStateUpdateFromCoord(intersectionLoc, currentStates, {
            "fill": "purple"
        }))
        reverseStates.pointsFromCoord.push({
            "coord": intersectionLoc,
            "attr": {
                "fill": "blue"
            }
        })
        if (!intersections[pointId]) {
            let seg1Status = new SegmentStatus(segment1)
            let seg2Status = new SegmentStatus(segment2)
            if (seg2Status.sortVal() < seg1Status.sortVal()) {
                //console.log("swap")
                let temp = seg1Status
                seg1Status = seg2Status
                seg2Status = temp
            }

            eventQueue.push({
                "pointLoc": intersectionLoc,
                "sortVal": Math.round(intersectionLoc[0]) + Math.round(intersectionLoc[1])/svg_height,
                "eventType": "intersection",
                "segments": [seg1Status, seg2Status]
            })
        }

        intersections[pointId] = true
    }

    states.push(newState)

    return intersectionLoc
}

// segment for sweep status
class SegmentStatus {
    constructor(segment) {
        this.segment = segment
        this.linearEq = getLineEquation(segment)
        this.slope = this.linearEq[0]
        this.y_int = this.linearEq[1]
        this.sortVal = () => {
            //console.log(this.slope)
            return this.slope*(window.sweepX-0.00000000001) + this.y_int
        }
    }
}

// set onClick
document.querySelector("#lineSweepBtn").onclick = lineSweep
document.querySelector("#lineSweepEndpointsBtn").onclick = lineSweepEndpoints

// TODO
// - in left event:
//      If there is an event associated with this pair, remove it from the event queue