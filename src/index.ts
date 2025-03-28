/**
 *  Asynchronous version of the `Traverser` type for TreeNode traversal validation.
 */
export type AsyncTraverser<T> = (root: TreeNode<T>) => Promise<void>
/**
 *  Callback type validating a TreeNode for further traversal to its children.
 */
export type Traverser<T> = (root: TreeNode<T>) => boolean
/**
 *  Callback type comparing a TreeNode to a specific value for checks.
 */
export type TreeComparator<T, U = T> = (root: TreeNode<T>, value: U) => boolean

/**
 *  Internal node of the tree structure that is able to hold as many children as possible.
 */
export class TreeNode<T> {
  /**
   *  The amount of children it holds.
   */
  childCount: number
  /**
   *  Array holding the children.
   */
  children: TreeNode<T>[]
  /**
   *  Internally assigned id for faster node identification
   */
  readonly id: number
  /**
   *  Upwards parent relation
   */
  readonly parent?: TreeNode<T>
  /**
   *  The amount of total children over any underlying levels.
   */
  totalCount: number
  /**
   *  The actual value this node holds.
   */
  readonly value: T

  constructor(id: number, value: T, parent?: TreeNode<T>) {
    this.id = id
    this.value = value
    this.parent = parent
    this.children = []
    this.childCount = this.totalCount = 0
  }

  /**
   *  Adds a new child to the node.
   *
   *  @param id - id of the child.
   *  @param value - value of the child.
   */
  add(id: number, value: T): void {
    this.children.push(new TreeNode(id, value, this))
    this.childCount++
    let parent: TreeNode<T> | undefined = this
    while (parent) {
      parent.totalCount++
      parent = parent.parent
    }
  }

  /**
   *  Checks if a given node is the parent of this node.
   *
   * @param node - potential parent node.
   * @returns `true`, if the given node is the actual parent node of the current node, otherwise `false`.
   */
  isChildOf(node: TreeNode<T>): boolean {
    return this.parent?.id === node.id
  }

  /**
   *  Checks if the current node is a leaf of th tree, i.e. not having any children.
   *
   * @returns `true`, if the node doesn't have any children, otherwise `false`.
   */
  isLeaf(): boolean {
    return !this.childCount
  }

  /**
   *  Checks if the given node is a child of the current node.
   *
   * @param node - potential child node.
   * @returns `true`, if the current node is the parent of the given node, otherwise `false`.
   */
  isParentOf(node: TreeNode<T>): boolean {
    const childCount = this.childCount
    if (!childCount) return false
    for (let children = this.children, i = 0, id = node.id; i < childCount; i++) if (children[i].id === id) return true
    return false
  }

  /**
   *  Checks if the node is the root element of the tree, i.e. not having any parents.
   *
   * @returns `true`, if the node is the actual root of the tree, otherwise `false`.
   */
  isRoot(): boolean {
    return !this.parent
  }
}

const defaultEq: TreeComparator<unknown> = (node, value) => node.value === value

/**
 *  Generic tree structure for all sorts of purposes.
 */
export default class Tree<T, U = T> {
  readonly #comp: TreeComparator<T, U>
  readonly #eq: TreeComparator<T, U>
  /**
   *  The number of nodes inside the tree.
   */
  counter: number
  /**
   *  The root element of the tree.
   */
  root: TreeNode<T>

  constructor(rootValue: T, comp: TreeComparator<T, U>, eq: TreeComparator<T, U> = defaultEq) {
    this.counter = 0
    this.root = new TreeNode(this.counter++, rootValue)
    this.#comp = comp
    this.#eq = eq
  }

  private removeMeta(root: TreeNode<T>, child: TreeNode<T>, children: TreeNode<T>[]): void {
    children.splice(children.indexOf(child), 1)
    this.counter -= child.totalCount + 1
    root.childCount--

    let parent: TreeNode<T> | undefined = root
    while (parent) {
      parent.totalCount -= child.totalCount
      parent = parent.parent
    }
  }

  /**
   *  Adds a new node to the tree.
   *
   *  @param value - target value to insert.
   *  @param traverser - callback mapping the target value to a node value to check for further traversal.
   *  @param eq - callback checking if the target value is equal to a node value. If it's equal, it will cancel the process.
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   */
  add(value: T, traverser: TreeComparator<T, T> = this.#comp as unknown as TreeComparator<T, T>, eq: TreeComparator<T> = this.#eq as unknown as TreeComparator<T, T>, root = this.root): void {
    if (eq(root, value)) return
    if (!root.isLeaf()) {
      for (const child of root.children) {
        if (eq(child, value)) return
        if (traverser(child, value)) {
          this.add(value, traverser, eq, child)
          return
        }
      }
    }
    root.add(this.counter++, value)
  }

  /**
   *  Adds an array of new nodes to the tree.
   *
   *  @param values - array holding the target values to insert.
   *  @param traverser - callback mapping the target value to a node value to check for further traversal.
   *  @param eq - callback checking if the target value is equal to a node value. If it's equal, it will cancel the process.
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   */
  addAll(values: T[], traverser: TreeComparator<T, T> = this.#comp as unknown as TreeComparator<T, T>, eq: TreeComparator<T> = this.#eq as unknown as TreeComparator<T, T>, root = this.root): void {
    for (const item of values) this.add(item, traverser, eq, root)
  }

  /**
   *  Extracts the values from a branch that matches the target value as close as possible.
   *
   *  @param targetValue - value to search for.
   *  @param comp - callback to decide whether to traverse downwards to the children.
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   *  @param store - array holding the values. New values will be pushed onto it. By default, a new array with
   *  the root element will be created.
   *  @returns the values of the branch leading towards the targeted value. If the value couldn't be found at all, it will return an empty array.
   */
  branch(targetValue: U, comp: TreeComparator<T, U> = this.#comp, eq: TreeComparator<T, U> = this.#eq, root = this.root, store: T[] = [root.value]): T[] {
    if (!root.isLeaf()) {
      for (const child of root.children) {
        if (comp(child, targetValue)) {
          store.push(child.value)
          return this.branch(targetValue, comp, eq, child, store)
        }
      }
      // Edge case: Value not found
      // In nested invalid values, we need to discard the rest of the branch as well. So it's easier to just return an empty array.
      return []
    }
    return eq(root, targetValue) ? store : []
  }

  /**
   *  Checks if a specific value exists inside the tree.
   *
   *  @param value - target value.
   *  @param comp - comparator callback to compare the node value with the target value with for further traversal.
   *  @param traverser - callback to decide whether to traverse downwards to the children.
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   *  @returns `true`, if the tree has the value, otherwise `false`.
   */
  has(value: U, comp: TreeComparator<T, U> = this.#eq, traverser: TreeComparator<T, U> = this.#comp, root = this.root): boolean {
    if (comp(root, value)) return true
    if (!root.isLeaf()) {
      for (const child of root.children) {
        if (comp(child, value)) return true
        if (traverser(child, value)) return this.has(value, comp, traverser, child)
      }
    }
    return false
  }

  /**
   *  Finds a node by its id. Ids are an internally incremented number.
   *
   * @param id - internal id of the targeted node.
   * @returns either the found node or `undefined`.
   */
  node(id: number): TreeNode<T> | undefined {
    for (const node of this) {
      if (node.id === id) {
        return node
      }
    }
  }

  /**
   *  Finds a node by a given search value. It's particularly useful for getting an inner node to act as a sub-tree root for sub-tree operations.
   *
   *  @param value - target search value
   *  @param comp - comparator callback to compare the node value with the target value with for further traversal.
   *  @param eq - equality callback to compare the node value with the target to determine the correct node to find.
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   *  @returns either the desired `TreeNode` or `undefined`, if not found.
   */
  nodeByValue(value: U, comp: TreeComparator<T, U> = this.#comp, eq: TreeComparator<T, U> = this.#eq, root = this.root): TreeNode<T> | undefined {
    if (eq(root, value)) return root
    if (!root.isLeaf()) {
      for (const child of root.children) {
        if (eq(child, value)) return child
        if (comp(child, value)) return this.nodeByValue(value, comp, eq, child)
      }
    }
    return undefined
  }

  /**
   *  Removes a node from the tree chosen by a given remover callback. If a targeted node is a branch, the rest of the branch will be removed as well.
   *
   *  @param value - value to remove.
   *  @param comp - comparator callback to compare the node value with the target value with.
   *  @param traverser - callback to decide whether to traverse downwards to the children.
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   */
  remove(value: U, comp: TreeComparator<T, U> = this.#eq, traverser: TreeComparator<T, U> = this.#comp, root = this.root): void {
    if (comp(root, value)) {
      const parent = root.parent
      if (parent) {
        this.removeMeta(parent, root, parent.children)
      } else {
        this.root = new TreeNode(0, undefined as any)
        this.counter = 0
      }
    } else if (!root.isLeaf()) {
      const children = root.children
      for (const child of children) {
        if (comp(child, value)) this.removeMeta(root, child, children)
        else if (traverser(child, value)) this.remove(value, comp, traverser, child)
      }
    }
  }

  *[Symbol.iterator](): Iterator<TreeNode<T>> {
    const queue: TreeNode<T>[] = [this.root]
    while (queue.length > 0) {
      const currentNode = queue.shift()!
      yield currentNode
      for (const child of currentNode.children) queue.push(child)
    }
  }

  /**
   *  Traverses the tree with an asynchronous traverser with the added optimization of running all children parallel.
   *
   *  @param traverser - asynchronous traverser callback.
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   */
  async traverseAsync(traverser: AsyncTraverser<T>, root = this.root): Promise<void> {
    if (root.isLeaf()) await traverser(root)
    else {
      const length = root.childCount
      const promises: Promise<void>[] = new Array(length)
      for (let i = 0; i < length; i++) promises[i] = this.traverseAsync(traverser, root.children[i])
      promises.push(traverser(root))
      await Promise.all(promises)
    }
  }
}
