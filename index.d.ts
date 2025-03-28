declare module 'mini-tree' {
  /**
   *  Callback type comparing a TreeNode to a specific value for checks.
   */
  export type TreeComparator<T> = (root: TreeNode<T>, value: T) => boolean
  /**
   *  Callback type validating a TreeNode for further traversal to its children.
   */
  export type Traverser<T> = (root: TreeNode<T>) => boolean
  /**
   *  Asynchronous version of the `Traverser` type for TreeNode traversal validation.
   */
  export type AsyncTraverser<T> = (root: TreeNode<T>) => Promise<void>
  /**
   *  Internal node of the tree structure that is able to hold as many children as possible.
   */
  export class TreeNode<T> {
    /**
     *  The amount of children it holds.
     */
    childCount: number
    /**
     *  The amount of total children over any underlying levels.
     */
    totalCount: number
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
     *  The actual value this node holds.
     */
    readonly value: T
    constructor(id: number, value: T, parent?: TreeNode<T>)
    /**
     *  Adds a new child to the node.
     *
     *  @param id - id of the child.
     *  @param value - value of the child.
     */
    add(id: number, value: T): void
    /**
     *  Checks if a given node is the parent of this node.
     *
     * @param node - potential parent node.
     * @returns `true`, if the given node is the actual parent node of the current node, otherwise `false`.
     */
    isChildOf(node: TreeNode<T>): boolean
    /**
     *  Checks if the current node is a leaf of th tree, i.e. not having any children.
     *
     * @returns `true`, if the node doesn't have any children, otherwise `false`.
     */
    isLeaf(): boolean
    /**
     *  Checks if the given node is a child of the current node.
     *
     * @param node - potential child node.
     * @returns `true`, if the current node is the parent of the given node, otherwise `false`.
     */
    isParentOf(node: TreeNode<T>): boolean
    /**
     *  Checks if the node is the root element of the tree, i.e. not having any parents.
     *
     * @returns `true`, if the node is the actual root of the tree, otherwise `false`.
     */
    isRoot(): boolean
  }
  /**
   *  Generic tree structure for all sorts of purposes.
   */
  export default class Tree<T> {
    /**
     *  The number of nodes inside the tree.
     */
    counter: number
    /**
     *  The root element of the tree.
     */
    root: TreeNode<T>
    readonly #comp: TreeComparator<T>
    readonly #eq: TreeComparator<T>

    constructor(rootValue: T, comp: TreeComparator<T>, eq?: TreeComparator<T>)
    /**
     *  Adds a new node to the tree.
     *
     *  @param value - target value to insert.
     *  @param traverser - callback mapping the target value to a node value to check for further traversal.
     *  @param eq - callback checking if the target value is equal to a node value. If it's equal, it will cancel the process.
     *  @param root - starting element to traverse through. By default, it starts at the tree root.
     */
    add(value: T, traverser?: TreeComparator<T>, eq?: TreeComparator<T>, root?: TreeNode<T>): void
    /**
     *  Traverses the tree with an asynchronous traverser with the added optimization of running all children parallel.
     *
     *  @param traverser - asynchronous traverser callback.
     *  @param root - starting element to traverse through. By default, it starts at the tree root.
     */
    traverseAsync(traverser: AsyncTraverser<T>, root?: TreeNode<T>): Promise<void>
    /**
     *  Removes a node from the tree chosen by a given remover callback. If a targeted node is a branch, the rest of the branch will be removed as well.
     *
     *  @param value - value to remove.
     *  @param comp - comparator callback to compare the node value with the target value with.
     *  @param traverser - callback to decide whether to traverse downwards to the children.
     *  @param root - starting element to traverse through. By default, it starts at the tree root.
     */
    remove(value: T, comp?: TreeComparator<T>, traverser?: TreeComparator<T>, root?: TreeNode<T>): void
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
    branch(targetValue: T, comp?: TreeComparator<T>, root?: TreeNode<T>, store?: T[]): T[]
    /**
     *  Finds a node by its id. Ids are an internally incremened number.
     *
     *  @param id - internal id of the targeted node.
     *  @returns either the found node or `undefined`.
     */
    node(id: number): TreeNode<T> | undefined
    /**
     *  Checks if a specific value exists inside the tree.
     *
     *  @param value - target value.
     *  @param comp - comparator callback to compare the node value with the target value with.
     *  @param traverser - callback to decide whether to traverse downwards to the children.
     *  @param root - starting element to traverse through. By default, it starts at the tree root.
     *  @returns `true`, if the tree has the value, otherwise `false`.
     */
    has(value: T, comp?: TreeComparator<T>, traverser?: TreeComparator<T>, root?: TreeNode<T>): boolean
    [Symbol.iterator](): Iterator<TreeNode<T>>
  }
}
