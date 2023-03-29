import { points } from "/js/graphEditor.js"

class PriorityQueue {
    constructor(comparator = (a, b) => a > b) {
        this._heap = []
        this._comparator = comparator
        this._top = 0
        this._parent = i => ((i + 1) >>> 1) - 1
        this._left = i => (i << 1) + 1
        this._right = i => (i + 1) << 1
    }
    size() {
        return this._heap.length
    }
    isEmpty() {
        return this.size() == 0
    }
    peek() {
        return this._heap[this._top]
    }
    push(...values) {
        values.forEach(value => {
            this._heap.push(value)
            this._siftUp()
        })
        return this.size()
    }
    pop() {
        const poppedValue = this.peek()
        const bottom = this.size() - 1
        if (bottom > this._top) {
        this._swap(this._top, bottom)
        }
        this._heap.pop()
        this._siftDown()
        return poppedValue
    }
    replace(value) {
        const replacedValue = this.peek()
        this._heap[this._top] = value
        this._siftDown()
        return replacedValue
    }
    _greater(i, j) {
        return this._comparator(this._heap[i], this._heap[j])
    }
    _swap(i, j) {
        [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]]
    }
    _siftUp() {
        let node = this.size() - 1
        while (node > this._top && this._greater(node, this._parent(node))) {
            this._swap(node, this._parent(node))
            node = this._parent(node)
        }
    }
    _siftDown() {
        let node = this._top
        while (
        (this._left(node) < this.size() && this._greater(this._left(node), node)) ||
        (this._right(node) < this.size() && this._greater(this._right(node), node))
        ) {
        let maxChild = (this._right(node) < this.size() && this._greater(this._right(node), this._left(node))) ? this._right(node) : this._left(node)
        this._swap(node, maxChild)
        node = maxChild
        }
    }
}

// node
class Node {
    constructor(item) {
        this.item = item
        this.height = 1
        this.left = null
        this.right = null
    }
}

// AVL Tree
class AVLTree {
    constructor(comparator = (a, b) => a > b) {
        this._comparator = comparator
        this._root = null
    }

    // return True if <i> is greater, False if <j> is
    greater(i, j) {
        return this._comparator(i, j)
    }

    //return height of the node
    height(node) {
        if (node === null){
            return 0
        }
        
        return node.height
    }

    //right rotate
    rightRotate(y) {
        let x = y.left
        let T2 = x.right
        x.right = y
        y.left = T2
        y.height = Math.max(this.height(y.left), this.height(y.right)) + 1
        x.height = Math.max(this.height(x.left), this.height(x.right)) + 1
        return x
    }

    //left rotate
    leftRotate(x) {
        let y = x.right
        let T2 = y.left
        y.left = x
        x.right = T2
        x.height = Math.max(this.height(x.left), this.height(x.right)) + 1
        y.height = Math.max(this.height(y.left), this.height(y.right)) + 1
        return y
    }

    // get balance factor of a node
    getBalanceFactor(node) {
        if (node == null){
            return 0
        }
        
        return this.height(node.left) - this.height(node.right)
    }

    // helper function to insert a node
    insertNodeHelper(node, item) {

        // find the position and insert the node
        if (node === null){
            return (new Node(item))
        }
        
        if (this.greater(node.item, item)) {
            node.left = this.insertNodeHelper(node.left, item)
        } else if (this.greater(item, node.item)) {
            node.right = this.insertNodeHelper(node.right, item)
        } else {
            return node
        }
        
        // update the balance factor of each node
        // and, balance the tree
        node.height = 1 + Math.max(this.height(node.left), this.height(node.right))
        
        let balanceFactor = this.getBalanceFactor(node)
        
        if (balanceFactor > 1) {
            if (this.greater(node.left.item, item)) {
                return this.rightRotate(node)
            } else if (this.greater(item, node.left.item)) {
                node.left = this.leftRotate(node.left)
                return this.rightRotate(node)
            }
        }
        
        if (balanceFactor < -1) {
            if (this.greater(item, node.right.item)) {
                return this.leftRotate(node)
            } else if (this.greater(node.right.item, item)) {
                node.right = this.rightRotate(node.right)
                return this.leftRotate(node)
            }
        }
        
        return node
    }

    // insert a node
    insertNode(item) {
        this._root = this.insertNodeHelper(this._root, item)
    }

    //get node with minimum value
    nodeWithMinimumValue(node) {
        let current = node
        while (current.left !== null){
            current = current.left
        }
        return current
    }

    //get node with maximum value
    nodeWithMaximumValue(node) {
        let current = node
        while (current.right !== null){
            current = current.right
        }
        return current
    }

    // delete helper
    deleteNodeHelper(root, item) {
        // find the node to be deleted and remove it
        if (root == null){
            return root
        }
        if (this.greater(root.item, item)){
            root.left = this.deleteNodeHelper(root.left, item)
        } else if (this.greater(item, root.item)) {
            root.right = this.deleteNodeHelper(root.right, item)
        } else {
            if ((root.left === null) || (root.right === null)) {
                let temp = null
                if (temp == root.left){
                    temp = root.right
                } else {
                    temp = root.left
                }
                
                if (temp == null) {
                    temp = root
                    root = null
                } else {
                    root = temp
                }
            } else {
                let temp = this.nodeWithMinimumValue(root.right)
                root.item = temp.item
                root.right = this.deleteNodeHelper(root.right, temp.item)
            }
        }
        if (root == null) {
            return root
        }

        // Update the balance factor of each node and balance the tree
        root.height = Math.max(this.height(root.left), this.height(root.right)) + 1
        
        let balanceFactor = this.getBalanceFactor(root)
        if (balanceFactor > 1) {
        if (this.getBalanceFactor(root.left) >= 0) {
            return this.rightRotate(root)
        } else {
            root.left = this.leftRotate(root.left)
            return this.rightRotate(root)
        }
        }
        if (balanceFactor < -1) {
        if (this.getBalanceFactor(root.right) <= 0) {
            return this.leftRotate(root)
        } else {
            root.right = this.rightRotate(root.right)
            return this.leftRotate(root)
        }
        }
        return root
    }

    //delete a node
    deleteNode(item) {
        this._root = this.deleteNodeHelper(this._root, item)
    }

    // preorder helper
    preOrderHelper(node) {
        if (node) {
            console.log(node.item)
            this.preOrderHelper(node.left)
            this.preOrderHelper(node.right)
        }
    }

    // print the tree in pre - order
    preOrder() {
        console.log("AVL Tree Pre-Order:")
        this.preOrderHelper(this._root)
        console.log(" ")
    }

    // in-order helper
    inOrderHelper(node) {
        if (node) {
            this.inOrderHelper(node.left)
            console.log(node.item.segment.node, node.item)
            this.inOrderHelper(node.right)
        }
    }

    // print the tree in order
    inOrder() {
        console.log("AVL Tree In-Order:")
        this.inOrderHelper(this._root)
        console.log(" ")
    }

    // get node predecessor
    findPredecessor(item) {
        // base case
        let root = this._root
        if (!root) {
            return null
        }
    
        let pred = null
    
        while (true) {
            if (this.greater(root.item, item)){
                // if the given item is less than that of root node, visit the left subtree
                root = root.left
            } else if (this.greater(item, root.item)) {
                // if the given key is more than the root node, visit the right subtree
                pred = root
                root = root.right
            } else {
                // if a node with the desired value is found, the predecessor is the maximum value node in its left subtree (if any)
                if (root.left) {
                    pred = this.nodeWithMaximumValue(root.left)
                }
                break
            }
    
            // if the key doesn't exist in the binary tree, return previous greater node
            if (!root) {
                return pred
            }
        }

        // return predecessor, if any
        return pred
    }

    // get node successor
    findSuccessor(item) {
        // base case
        let root = this._root
        if (!root) {
            return null
        }
    
        let pred = null
    
        while (true) {
            if (this.greater(root.item, item)){
                // if the given item is less than that of root node, visit the left subtree
                pred = root
                root = root.left
            } else if (this.greater(item, root.item)) {
                // if the given key is more than the root node, visit the right subtree
                root = root.right
            } else {
                // if a node with the desired value is found, the predecessor is the maximum value node in its left subtree (if any)
                if (root.right) {
                    pred = this.nodeWithMinimumValue(root.right)
                }
                break
            }
    
            // if the key doesn't exist in the binary tree, return previous greater node
            if (!root) {
                return pred
            }
        }

        // return predecessor, if any
        return pred
    }

    // find node
    findNode(item) {
        let root = this._root
        if (root === null){
            return null
        }
        while (true) {
            if (this.greater(root.item, item)){
                root = root.left
            } else if (this.greater(item, root.item)) {
                root = root.right
            } else {
                return root
            }
    
            // if the key doesn't exist in the binary tree, return null
            if (!root) {
                return null
            }
        }
    }

    // find node by match on a data
    findNodeByData(item, match = (a, b) => a === b) {
        let root = this._root
        if (root === null){
            return null
        }
        while (true) {
            if (this.greater(root.item, item)){
                root = root.left
            } else if (this.greater(item, root.item)) {
                root = root.right
            } else {
                return root
            }
    
            // if the key doesn't exist in the binary tree, return null
            if (!root) {
                return null
            }
        }
    }

    // find node
    findParent(item) {
        let root = this._root
        if (root === null){
            return null
        }

        let parent = null
        while (true) {
            if (this.greater(root.item, item)){
                parent = root
                root = root.left
            } else if (this.greater(item, root.item)) {
                parent = root
                root = root.right
            } else {
                return parent
            }
    
            // if the key doesn't exist in the binary tree, return null
            if (!root) {
                return null
            }
        }
    }

    // swap with immediate successor
    swapSuccessor(item) {
        console.log("*ITEM TO SWAP WITH SUCC*", item)
        let current = this.findNode(item)
        let successor = this.findSuccessor(item)

        let tempItem = current.item
        current.item = successor.item
        successor.item = tempItem
    }
}

// segment for sweep status
class SegmentStatus {
    constructor(segment) {
        this.segment = segment
        this.linearEq = getLineEquation(segment)
        this.slope = this.linearEq[0]
        this.y_int = this.linearEq[1]
        this.sortVal = () => {
            if (this.slope === Infinity) {
                return Number((window.sweepY).toFixed(9))
            }
            return Number((this.slope*(window.sweepX) + this.y_int).toFixed(10))
        }
    }
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

    if (slope === -Infinity) {
        slope = Infinity
    }

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
    let p1 = points.findOne(`[id='${segment1PointIDs[0]}']`)
    let q1 = points.findOne(`[id='${segment1PointIDs[1]}']`)
    let segment2Id = segment2.attr("id")
    let segment2PointIDs = segment2Id.split("_").slice(1,3)
    let p2 = points.findOne(`[id='${segment2PointIDs[0]}']`)
    let q2 = points.findOne(`[id='${segment2PointIDs[1]}']`)

    return doIntersectFromPts(p1, q1, p2, q2)
}

// FUNCTION: returns true if the points of segments indicate intersection
function doIntersectFromPts(p1, q1, p2, q2) {
    // Find the four orientations needed for general and special cases
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

// FUNCTION: get intersection of two segments
function getSegmentsIntersection(segment1, segment2) {
    // get points of segments
    let segment1Id = segment1.attr("id")
    let segment1PointIDs = segment1Id.split("_").slice(1,3)
    let A = points.findOne(`[id='${segment1PointIDs[0]}']`)
    let B = points.findOne(`[id='${segment1PointIDs[1]}']`)
    let segment2Id = segment2.attr("id")
    let segment2PointIDs = segment2Id.split("_").slice(1,3)
    let C = points.findOne(`[id='${segment2PointIDs[0]}']`)
    let D = points.findOne(`[id='${segment2PointIDs[1]}']`)

    return getSegmentIntersectionFromPts(A, B, C, D)
}

// FUNCTION: get intersection of 2 lines based on endpoints of 2 segments
function getSegmentIntersectionFromPts(A, B, C, D) {
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

// FUNCTION: get intersection of 2 lines based on endpoints coordinates of 2 segments
function getSegmentIntersectionFromCoord(A, B, C, D) {
    if (doIntersectFromCoord(A, B, C, D)) {
        return getLineIntersectionFromCoord(A, B, C, D)
    } else {
        return null
    }
}

function getLineIntersectionFromCoord(A, B, C, D) {
    // Line AB represented as a1x + b1y = c1
    var a1 = B[1] - A[1];
    var b1 = A[0] - B[0];
    var c1 = a1*(A[0]) + b1*(A[1]);
    
    // Line CD represented as a2x + b2y = c2
    var a2 = D[1] - C[1];
    var b2 = C[0] - D[0];
    var c2 = a2*(C[0])+ b2*(C[1]);
    
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

// FUNCTION: returns true if the points of segments indicate intersection from coordinates
function doIntersectFromCoord(p1, q1, p2, q2) {
    // Find the four orientations needed for general and special cases
    let o1 = orientationFromCoord(p1, q1, p2);
    let o2 = orientationFromCoord(p1, q1, q2);
    let o3 = orientationFromCoord(p2, q2, p1);
    let o4 = orientationFromCoord(p2, q2, q1);
    
    // General case
    if (o1 != o2 && o3 != o4) return true

    // Special Cases
    // p1, q1 and p2 are collinear and p2 lies on segment p1q1
    if (o1 == 0 && onSegmentFromCoord(p1, p2, q1)) return true;
    
    // p1, q1 and q2 are collinear and q2 lies on segment p1q1
    if (o2 == 0 && onSegmentFromCoord(p1, q2, q1)) return true;
    
    // p2, q2 and p1 are collinear and p1 lies on segment p2q2
    if (o3 == 0 && onSegmentFromCoord(p2, p1, q2)) return true;
    
    // p2, q2 and q1 are collinear and q1 lies on segment p2q2
    if (o4 == 0 && onSegmentFromCoord(p2, q1, q2)) return true;
    
    return false; // Doesn't fall in any of the above cases
}

// FUNCTION: To find orientation of ordered triplet (p, q, r) based on coordinates
function orientationFromCoord(p, q, r) {
    // 0 --> p, q and r are collinear
    // 1 --> Clockwise
    // 2 --> Counterclockwise
    let p_x = p[0]
    let q_x = q[0]
    let r_x = r[0]
    let p_y = p[1]
    let q_y = q[1]
    let r_y = r[1]

    let val = (q_y-p_y) * (r_x-q_x) - (q_x-p_x) * (r_y-q_y);
    
    if (val == 0) return 0; // collinear
    
    return (val > 0)? 1: 2; // clock or counterclock wise
}

// FUNCTION: Given three collinear points p, q, r, the function checks if point q lies on line segment 'pr' using coordinates
function onSegmentFromCoord(p, q, r) {
    let p_x = p[0]
    let q_x = q[0]
    let r_x = r[0]
    let p_y = p[1]
    let q_y = q[1]
    let r_y = r[1]
    if (q_x <= Math.max(p_x, r_x) && q_x >= Math.min(p_x, r_x) &&
        q_y <= Math.max(p_y, r_y) && q_y >= Math.min(p_y, r_y)) {
        return true;
    }
    
    return false;
}


//FUNCTION: using endpoints, check if 2 segments overlap outside of single endpoint
function doOverlapFromPts(A, B, C, D) {
    let intersectionLoc = getSegmentIntersectionFromPts(A, B, C, D)
    if (intersectionLoc === null) {
        // since null, they are the same line, now need to check if x-range (and by default y-range) overlap
        let segment1_minX = Math.min(A.attr("cx"), B.attr("cx"))
        let segment1_maxX = Math.max(A.attr("cx"), B.attr("cx"))
        let segment2_minX = Math.min(C.attr("cx"), D.attr("cx"))
        let segment2_maxX = Math.max(C.attr("cx"), D.attr("cx"))

        // overlap if segment 2 minimum X is on range [segment 1 minimum X, segment 1 maximum x)
        if (segment2_minX >= segment1_minX && segment2_minX < segment1_maxX) {
            return true
        }
        // overlap if segment 2 maximum X is on range (segment 1 minimum X, segment 1 maximum x]
        if (segment2_maxX <= segment1_maxX && segment2_maxX > segment1_minX) {
            return true
        }

        return false
    } else {
        return false
    }
}

// use points to get Edge ID
function getEdgeId(point1, point2) {
    // get coordinates for each point
    let p1_coord = point1.attr("id").substring(1).split("-")
    let x1 = Number(p1_coord[0])
    let y1 = Number(p1_coord[1])
    let p2_coord = point2.attr("id").substring(1).split("-")
    let x2 = Number(p2_coord[0])
    let y2 = Number(p2_coord[1])

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

    return id
}

// use endpoint coordinates to get Edge ID
function getEdgeIdFromCoord(p1, p2) {
    let x1 = Number(p1[0])
    let y1 = Number(p1[1])
    let x2 = Number(p2[0])
    let y2 = Number(p2[1])
    // points ids
    let point1ID = `p${x1}-${y1}`
    let point2ID = `p${x2}-${y2}`

    // id is ordered with points left to right (top to bottom tiebreaker)
    let id = null
    if (x1 < x2) {
        id = `e_${point1ID}_${point2ID}`
    } else if (x1 > x2) {
        id = `e_${point2ID}_${point1ID}`

    } else {
        if (y1 < y2) {
            id = `e_${point1ID}_${point2ID}`
        } else {
            id = `e_${point2ID}_${point1ID}`
        }
    }

    return id
}

// get endpoint coordinates from edge ID
function getEdgeCoordFromID(edgeID) {
    let pointIDs = edgeID.substring(2).split("_")
    let p1_coord = pointIDs[0].substring(1).split("-")
    let x1 = p1_coord[0]
    let y1 = p1_coord[1]
    let p2_coord = pointIDs[1].substring(1).split("-")
    let x2 = p2_coord[0]
    let y2 = p2_coord[1]

    return [[x1, y1], [x2, y2]]
}

// get perpendicular bisector of 2 points where p1 and p2 are poin
function getPerpendicularBisectorFromPtIDs(p1, p2) {
    // get coordinates
    let p1_coord = p1.attr("id").substring(1).split("-")
    let x1 = Number(p1_coord[0])
    let y1 = Number(p1_coord[1])
    let p2_coord = p2.attr("id").substring(1).split("-")
    let x2 = Number(p2_coord[0])
    let y2 = Number(p2_coord[1])

    // get midpoint
    let midX = (x1+x2)/2
    let midY = (y1+y2)/2

    // get slope of line (p1, p2)
    let slope = (y2-y1)/(x2-x1)

    // get slope and y-intercept of perpendicular bisector
    let bi_slope = -1/slope
    let bi_yInt = midY - bi_slope*midX

    return [bi_slope, bi_yInt]
}

// get perpendicular bisector endpoint
function getPerpendicularBisectorEndpointsFromPtIDs(p1, p2) {
    // get coordinates
    let p1_coord = p1.attr("id").substring(1).split("-")
    let x1 = Number(p1_coord[0])
    let y1 = Number(p1_coord[1])
    let p2_coord = p2.attr("id").substring(1).split("-")
    let x2 = Number(p2_coord[0])
    let y2 = Number(p2_coord[1])

    // get midpoint
    let midX = (x1+x2)/2
    let midY = (y1+y2)/2

    // get linear equation
    let lineEq = getPerpendicularBisectorFromPtIDs(p1, p2)
    let bi_slope = lineEq[0]
    let bi_yInt = lineEq[1]

    // endpoints type is based on slope
    if (bi_slope === 0) {
        // horizontal line
        return [[0, midY], [window.svg_width, midY]]

    } else if (bi_slope === Infinity || bi_slope === -Infinity) {
        // vertical line
        return [[midX, 0], [midX, window.svg_height]]
    
    } else {
        // normal slope
        let endpoints = []

        let leftInter_y = bi_yInt
        let rightInter_y = bi_slope*window.svg_width + bi_yInt
        let topInter_x = (-bi_yInt)/bi_slope
        let bottomInter_x = (window.svg_height-bi_yInt)/bi_slope

        if (leftInter_y >= 0 && leftInter_y <= window.svg_height) {
            endpoints.push([0, leftInter_y])
        }
        if (rightInter_y >= 0 && rightInter_y <= window.svg_height) {
            endpoints.push([window.svg_width, rightInter_y])
        }
        if (topInter_x > 0 && topInter_x < window.svg_width) {
            endpoints.push([topInter_x, 0])
        }
        if (bottomInter_x > 0 && bottomInter_x < window.svg_width) {
            endpoints.push([bottomInter_x, window.svg_height])
        }

        return endpoints

    // } else if (lineEq[0] < 0) {
    //     // negative slope (since graph is essentially inverted, but would look positive when plotted)
    //     let endpoints = []

    //     // left point intersects left side or bottom
    //     let leftIntersection_y = lineEq[1]
    //     let bottomIntersection_x = (window.svg_height-lineEq[1])/lineEq[0]
    //     // correct one is positive and within range
    //     if (leftIntersection_y >= 0 && leftIntersection_y <= window.svg_height) {
    //         endpoints.push([0, leftIntersection_y])
    //     } else if (bottomIntersection_x >= 0 && bottomIntersection_x <= window.svg_width) {
    //         endpoints.push([bottomIntersection_x, window.svg_height])
    //     }

    //     // right point intersections
    }
}

// get the turn between 3 points based on coordinates
function getPointsTurnFromCoord(p1, p2, p3) {
    let x1 = p1[0]
    let y1 = p1[1]
    let x2 = p2[0]
    let y2 = p2[1]
    let x3 = p3[0]
    let y3 = p3[1]

    return ((x2 - x1)*((-1)*y3 - (-1)*y1)) - (((-1)*y2 - (-1)*y1)*(x3 - x1))
}

// barely extend a line segment's endpoint by a certain amount
function barelyExtendEndpointsFromCoord(endpoints, amount) {
    // ensure endpoints are numbers not strings
    let x1 = Number(endpoints[0][0])
    let y1 = Number(endpoints[0][1])
    let x2 = Number(endpoints[1][0])
    let y2 = Number(endpoints[1][1])

    // got total length of the line segment
    let totalLength = Math.sqrt(Math.pow(x1 - x2, 2.0) + Math.pow(y1 - y2, 2.0))

    // extended value added
    // i.e. for x1 take the ratio of distance between x values to the total length. multiple this by amount to extend
    let new_x1 = x1 + (x1-x2)/totalLength*amount
    let new_y1 = y1 + (y1-y2)/totalLength*amount
    let new_x2 = x2 + (x2-x1)/totalLength*amount
    let new_y2 = y2 + (y2-y1)/totalLength*amount

    return [[new_x1, new_y1], [new_x2, new_y2]]
}

export { PriorityQueue, AVLTree, SegmentStatus, getEdgeId, doIntersect, getSegmentsIntersection, doIntersectFromPts, getSegmentIntersectionFromPts, doOverlapFromPts, getEdgeIdFromCoord, getPerpendicularBisectorFromPtIDs, getPerpendicularBisectorEndpointsFromPtIDs, getPointsTurnFromCoord, getSegmentIntersectionFromCoord, getEdgeCoordFromID, barelyExtendEndpointsFromCoord }