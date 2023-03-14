// imports
import { stateList } from "/js/stateList.js"
import { points, edges } from "/js/graphEditor.js"

function updateDisplay(direction) {
    if (direction === "next" && stateList.curIteration < stateList.numIterations-1) {
        //increment curIteration
        stateList.curIteration += 1

        //update points
        stateList.states[stateList.curIteration].points.forEach(pointData => {
            updatePoint(pointData, direction)
        })

        //update edges
        stateList.states[stateList.curIteration].edges.forEach(edgeData => {
            updateEdge(edgeData, direction)
        })

        //update progress bar
        updateProgressBar(stateList.curIteration, stateList.numIterations)

        //update isPlaying if reached end
        if (stateList.curIteration === stateList.numIterations-1) {
            stateList.isPlaying = false
        }
    } else if (direction === "prev"  && stateList.curIteration > 0) {
        //update points
        let reversePoints = (stateList.states[stateList.curIteration].points).map((x) => x).reverse()
        reversePoints.forEach(pointData => {
            updatePoint(pointData, direction)
        })

        //update edges
        let reverseEdges = (stateList.states[stateList.curIteration].edges).map((x) => x).reverse()
        reverseEdges.forEach(edgeData => {
            updateEdge(edgeData, direction)
        })

        //decrement curIteration
        stateList.curIteration -= 1

        //update progress bar
        updateProgressBar(stateList.curIteration, stateList.numIterations)
    } else {
        //update progress bar
        updateProgressBar(stateList.curIteration, stateList.numIterations)
    }
}

function updatePoint(pointData, direction) {
    let point = points.findOne(`[id=${pointData.id}]`)
    if (point) {
        point.attr(pointData[direction])
    } else {
        let newPoint = points.circle()
            .attr(pointData[direction])
            .attr("id", pointData.id)
    }
}

function updateEdge(edgeData, direction) {
    let edge = edges.findOne(`[id=${edgeData.id}]`)
    if (edge) {
        edge.attr(edgeData[direction])
    } else {
        edges.line()
            .attr(edgeData[direction])
            .attr("id", edgeData.id)
    }
}

function updateProgressBar(curIter, numIter) {
    let progressBar = document.getElementById("media-progress")
    progressBar.setAttribute("value", curIter+1)
    progressBar.setAttribute("max", numIter)
}

function toStart() {
    while (stateList.curIteration > 0) {
        updateDisplay("prev")
    }
}

function previousState() {
    stateList.isPlaying = false
    updateDisplay("prev")
}

function playPause() {
    if (stateList.curIteration < stateList.numIterations-1) {
        stateList.isPlaying = !stateList.isPlaying
    } else {
        stateList.isPlaying = false
    }
    if (stateList.isPlaying) {
        playThrough()
    }
}

function playThrough() {
    if (stateList.isPlaying) {
        setTimeout(function() {
            if (stateList.isPlaying) {
                updateDisplay("next")
                playThrough()
            }
        }, 500)
    }
}

function nextState() {
    stateList.isPlaying = false
    updateDisplay("next")
}

function toEnd() {
    while (stateList.curIteration < stateList.numIterations-1) {
        updateDisplay("next")
    }
}

document.querySelector("#media-to-start").onclick = toStart
document.querySelector("#media-previous").onclick = previousState
document.querySelector("#media-playpause").onclick = playPause
document.querySelector("#media-next").onclick = nextState
document.querySelector("#media-to-end").onclick = toEnd

export { updateDisplay }