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
  total: number
  /**
   *  The actual value this node holds.
   */
  readonly value: T

  constructor(id: number, value: T, parent?: TreeNode<T>) {
    this.id = id
    this.value = value
    this.parent = parent
    this.children = []
    this.childCount = this.total = 0
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
      parent.total++
      parent = parent.parent
    }
  }

  /**
   *  Checks if a given node is the parent of this node.
   *
   * @param node - potential parent node.
   * @returns `true`, if the given node is the actual parent node of the current node, otherwise `false`.
   */
  childOf(node: TreeNode<T>): boolean {
    return this.parent?.id === node.id
  }

  /**
   *  Checks if the current node is a leaf of th tree, i.e. not having any children.
   *
   * @returns `true`, if the node doesn't have any children, otherwise `false`.
   */
  get leaf(): boolean {
    return !this.childCount
  }

  /**
   *  Checks if the given node is a child of the current node.
   *
   * @param node - potential child node.
   * @returns `true`, if the current node is the parent of the given node, otherwise `false`.
   */
  parentOf(node: TreeNode<T>): boolean {
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
  get root(): boolean {
    return !this.parent
  }
}

const defaultEq: TreeComparator<unknown> = (node, value) => node.value === value
const defaultComp: TreeComparator<unknown> = (_node, _value) => true

/**
 *  Generic tree structure for all sorts of purposes.
 */
export default class Tree<T, U = T> {
  #addComp: TreeComparator<T, T>
  #addEq: TreeComparator<T, T>
  #comp: TreeComparator<T, U>
  #eq: TreeComparator<T, U>
  /**
   *  The number of nodes inside the tree.
   */
  count: number
  /**
   *  The root element of the tree.
   */
  root: TreeNode<T>

  constructor(rootValue: T, comp: TreeComparator<T, U> = defaultComp, eq: TreeComparator<T, U> = defaultEq) {
    this.count = 0
    this.root = new TreeNode(this.count++, rootValue)
    this.#addComp = this.#comp = comp as any
    this.#addEq = this.#eq = eq as any
  }

  private removeMeta(root: TreeNode<T>, child: TreeNode<T>, children: TreeNode<T>[]): void {
    children.splice(children.indexOf(child), 1)
    this.count -= child.total + 1
    root.childCount--

    let parent: TreeNode<T> | undefined = root
    while (parent) {
      parent.total -= child.total
      parent = parent.parent
    }
  }

  /**
   *  Adds a new node to the tree.
   *
   *  @param value - target value to insert.
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   */
  add(value: T, root = this.root): void {
    if (this.#addEq(root, value)) return
    if (!root.leaf) {
      for (const child of root.children) {
        if (this.#addEq(child, value)) return
        if (this.#addComp(child, value)) {
          this.add(value, child)
          return
        }
      }
    }
    root.add(this.count++, value)
  }

  /**
   *  Adds an array of new nodes to the tree.
   *
   *  @param values - array holding the target values to insert.
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   */
  addAll(values: T[], root = this.root): void {
    for (const item of values) this.add(item, root)
  }

  /**
   *  Extracts the values from a branch that leads to the target value.
   *
   *  @param targetValue - value to search for.
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   *  @param store - array holding the values. New values will be pushed onto it. By default, a new array with
   *  the root element will be created.
   *  @returns the values of the branch leading towards the targeted value. If the value couldn't be found at all, it will return an empty array.
   */
  branch(targetValue: U, root = this.root, store: T[] = [root.value]): T[] {
    if (!root.leaf) {
      for (const child of root.children) {
        if (child.leaf && this.#eq(child, targetValue)) {
          store.push(child.value)
          return store
        }
        if (this.#comp(child, targetValue)) {
          store.push(child.value)
          return this.branch(targetValue, child, store)
        }
      }
    }
    // Last check to identify if the value is invalid
    return this.#eq(root, targetValue) ? store : []
  }

  /**
   *  Extracts the values from a branch that leads to the target value including all its children.
   *
   *  @param targetValue - value to search for.
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   *  @param store - array holding the values. New values will be pushed onto it. By default, a new array with
   *  the root element will be created.
   *  @param found - flag indicating whether the target value has already been found.
   *  @returns the values of the branch leading towards the targeted value. If the value couldn't be found at all, it will return an empty array.
   */
  branchAll(targetValue: U, root = this.root, store: T[] = [root.value], found = this.#eq(root, targetValue)): T[] {
    if (!root.leaf) {
      for (const child of root.children) {
        if (found) {
          store.push(child.value)
          if (child.leaf) continue
          return this.branchAll(targetValue, child, store, found)
        }
        if (this.#eq(child, targetValue)) {
          found = true
          store.push(child.value)
          return child.leaf ? store : this.branchAll(targetValue, child, store, found)
        }
        if (this.#comp(child, targetValue)) {
          store.push(child.value)
          return this.branchAll(targetValue, child, store, found)
        }
      }
    }
    return found || this.#eq(root, targetValue) ? store : []
  }

  /**
   *  Clears the entire tree and resets its state, while comparators remain.
   */
  clear(): void {
    this.count = 0
    this.root = new TreeNode(this.count++, this.root.value)
  }

  /**
   *  Defines the default comparator for tree traversal indicating whether to move further down the tree.
   *
   *  @param callback - callback defining how to validate further traversal.
   *  @returns the current instance
   */
  comp(callback: TreeComparator<T, U>): this {
    this.#comp = callback
    return this
  }

  /**
   *  Defines the default comparator for node existence. If true, the current root of the tree traversal is the desired value.
   *  It is used in search algorithms.
   *
   *  @param callback - callback defining how to validate node existence.
   *  @returns the current instance
   */
  eq(callback: TreeComparator<T, U>): this {
    this.#eq = callback
    return this
  }

  /**
   *  Defines the callbacks for node existence (addEq) and further traversal (addComp) when adding new values.
   *
   *  @param addEq - callback defining how to validate node existence.
   *  @param addComp - callback defining how to validate further traversal.
   *  @returns the current instance
   */
  onAdd(addEq: TreeComparator<T, T>, addComp: TreeComparator<T, T>): this {
    this.#addEq = addEq
    this.#addComp = addComp
    return this
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
  has(value: U, root = this.root, eq: TreeComparator<T, U> = this.#eq, comp: TreeComparator<T, U> = this.#comp): boolean {
    if (this.#eq(root, value)) return true
    if (!root.leaf) {
      for (const child of root.children) {
        if (this.#eq(child, value)) return true
        if (this.#comp(child, value)) return this.has(value, child, eq, comp)
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
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   *  @returns either the desired `TreeNode` or `undefined`, if not found.
   */
  nodeByValue(value: U, root = this.root): TreeNode<T> | undefined {
    if (this.#eq(root, value)) return root
    if (!root.leaf) {
      for (const child of root.children) {
        if (this.#eq(child, value)) return child
        if (this.#comp(child, value)) return this.nodeByValue(value, child)
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
  remove(value: U, root = this.root, comp: TreeComparator<T, U> = this.#eq, traverser: TreeComparator<T, U> = this.#comp): void {
    if (this.#eq(root, value)) {
      const parent = root.parent
      if (parent) {
        this.removeMeta(parent, root, parent.children)
      } else {
        this.root = new TreeNode(0, undefined as any)
        this.count = 0
      }
    } else if (!root.leaf) {
      const children = root.children
      for (const child of children) {
        if (this.#eq(child, value)) this.removeMeta(root, child, children)
        else if (this.#comp(child, value)) this.remove(value, child, comp, traverser)
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
   *  Converts the held values into a json-viable string.
   *
   *  @returns the json-viable string of only the values of the nodes.
   */
  toJSON(): string {
    let str = '['
    for (const node of this) str = `${str}${JSON.stringify(node.value)},`
    return `${str.substring(0, str.length - 1)}]`
  }

  /**
   *  Traverses the tree with an asynchronous traverser with the added optimization of running all children parallel.
   *
   *  @param traverser - asynchronous traverser callback.
   *  @param root - starting element to traverse through. By default, it starts at the tree root.
   */
  async traverseAsync(traverser: AsyncTraverser<T>, root = this.root): Promise<void> {
    if (root.leaf) await traverser(root)
    else {
      const length = root.childCount
      const promises: Promise<void>[] = new Array(length)
      for (let i = 0; i < length; i++) promises[i] = this.traverseAsync(traverser, root.children[i])
      promises.push(traverser(root))
      await Promise.all(promises)
    }
  }
}
