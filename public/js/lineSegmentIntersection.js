const inputType = "segment"
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