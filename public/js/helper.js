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
    }

    // in-order helper
    inOrderHelper(node) {
        if (node) {
            this.inOrderHelper(node.left)
            console.log(node.item)
            this.inOrderHelper(node.right)
        }
    }

    // print the tree in order
    inOrder() {
        console.log("AVL Tree In-Order:")
        this.inOrderHelper(this._root)
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
        let current = this.findNode(item)
        let successor = this.findSuccessor(item)

        let tempItem = current.item
        current.item = successor.item
        successor.item = tempItem
    }
}

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

export { PriorityQueue, AVLTree, getEdgeId }