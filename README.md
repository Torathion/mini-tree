# mini-tree

<p align="center">
<h1 align="center">The smallest tree data structure for any purpose</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/mini-tree"><img src="https://img.shields.io/npm/v/mini-tree?style=for-the-badge&logo=npm"/></a>
  <a href="https://npmtrends.com/mini-tree"><img src="https://img.shields.io/npm/dm/mini-tree?style=for-the-badge"/></a>
  <a href="https://bundlephobia.com/package/mini-tree"><img src="https://img.shields.io/bundlephobia/minzip/mini-tree?style=for-the-badge"/></a>
  <a href="https://github.com/Torathion/mini-tree/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Torathion/mini-tree?style=for-the-badge"/></a>
  <a href="https://codecov.io/gh/torathion/mini-tree"><img src="https://codecov.io/gh/torathion/mini-tree/branch/main/graph/badge.svg?style=for-the-badge" /></a>
  <a href="https://github.com/torathion/mini-tree/actions"><img src="https://img.shields.io/github/actions/workflow/status/torathion/mini-tree/build.yml?style=for-the-badge&logo=esbuild"/></a>
<a href="https://github.com/prettier/prettier#readme"><img alt="code style" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=for-the-badge&logo=prettier"></a>
</p>
</p>

`mini-tree` is a tiny, flexible, zero-dependency [Tree data structure](https://en.wikipedia.org/wiki/Tree_(abstract_data_type)) designed to be used for any purpose that requires data either ordered in a hierarchical structure or are in relation to each other. With an easy to use API, it's designed for those problems suited for managing hierarchical data without asking the
question "What kind of tree fits the best?".

```powershell
    pnpm i mini-tree
```

## Why should I use a tree data structure?

Even if you don't know whether your data in question is in any kind of relation to each other, a tree data structure is designed to reduce the number of checks and branches by organizing your data. It's designed to efficiently search the data you need based on previously searched data, optimizing a linear or even binary search.
As an example we use the JS linter [`eslint`](https://eslint.org/). `eslint` is configured to lint our `src` folder using `eslint src` and for that, it tries to find this folder. Luckily, a modern OS structures its folders in a tree data structure, so instead of the 10.000+ folders a modern OS comes with, `eslint` only needs to check the current
working directory it's been called from and only has to check 5 or 6 folders as these are the direct child folders of the parent current working directory. And due to every folder being ordered hierarchically, `eslint` can easily detect what files belong to the `src` folder instead of blindly linting every file it finds. That is the power of a tree data structure.

**TL;DR**: It's to vastly optimize linear searching when searching something or to access scoped data relating to a common parent.

## Usage

`mini-tree` relies on callbacks to achieve it's universal-purpose design. And those callbacks are structured differently:

- `TreeComparator<T>` compares a `TreeNode<T>` with a specific value to usually check for further traversal to its child nodes. In other cases, namely if a value equals a node, it will either remove it (in `tree.remove`) or cancel a process (in `tree.add`).
- `Traverser<T>` takes only a node to either iterate through it (in `tree.traverseAsync`) or validate it for further traversal to its child nodes.
- `AsyncTraverser<T>` is an asynchronous version of `Traverser` only used in `tree.traverseAsync`

To reduce the bloat of using the `mini-tree` `Tree`, you pass a default comparator and on equal value callback into the constructor. This is used by default in every method of `Tree`, except `node` and `toJSON`. These callbacks can have different meanings depending on how you want to use the tree.

1. If the passed callbacks are used to search values in `has`, `remove`, `nodeByValue` and `branch`, define extra insertion callbacks into `add` and `addAll`.
2. If the passed callbacks are used to insert values, add callbacks to the search functions.

```typescript

import Tree, { type TreeNode, type TreeComparator, type Traverser } from 'mini-tree'


// Comparator that traverses down the hierarchy if the target value is larger than a node value
const comp: TreeComparator<number> = (node: TreeNode<number>, value: number) => value > node.value
// Edge case comparator to check if a tree already contains the value or a new node has to be added
const eq: TreeComparator<number> = (node: TreeNode<number>, value: number) => value === node.value

// Create a new tree with comp and eq as its default comparators and a root node value of 0.
// The root value dictates the generic type of the tree. This should match the generic type of comp and eq
const tree = new Tree(0, comp, eq)

// Add values
tree.add(5)
tree.add(3)
tree.add(7)

// Add same values (won't do anything)
tree.add(5)

// Start from a specific sub node (id). Every node holds an id.
tree.add(13, tree.node(3)) // start at the third added node
// or by value
tree.add(13, tree.nodeByValue(3))

// Remove node with a specific value
tree.remove(5)

// Traverse through all nodes using BFS
for (const node of tree) {
    console.log(node.value)
}

// Find nodes
if (tree.has(7)) // Do cool stuff
```

### Usage with complex data

Normally, you won't just use trees for mere numbers, but rather to hierarchically order metadata of specific items, like menus with sub menus, folders with files or categories with objects. For that, it's much easier to search for nodes using primitive values as keys.

```typescript
interface PathMetaData {
  path: string
  isDir: boolean
  fileCount: number
}
// ...

// Define a tree where the key (the value to compare to) is the path.
const comp: TreeComparator<PathMetaData, string> = (n, v) => v.startsWith(n.value.path)
const eq: TreeComparator<PathMetaData, string> = (n, v) => v === n.value.path

// Define callbacks in constructor
const tree = new Tree<PathMetaData, string>({ path: '/', isDir: true, fileCount: 7 }, comp, eq)

// or in extra methods
tree.eq(eq)
tree.comp(comp)

// Define what callbacks to use on add.
tree.onAdd(
  (n, v) => v.path === n.value.path,
  (n, v) => v.path.startsWith(n.value.path)
)

// Since we are adding complex data, the key to search for, i.e. the path string, doesn't fit when trying to
// order new elements to the tree. So we need to define custom comparators for simply adding new data.
tree.addAll([
  { path: '/package.json', dir: false, fileCount: 0 },
  { path: '/a', dir: true, fileCount: 1 },
  { path: '/a/package.json', dir: false, fileCount: 0 },
  { path: '/a/b', dir: true, fileCount: 0 }
])

// Find values
tree.has('/')
tree.has('/a/b')

// Get the branch with the value of /a/b
// This returns the actual complex data as an array
tree.branch('/a/b')
// This retrieves all child nodes belonging to the target node as well
tree.branchAll('/a', tree.nodeByValue('/a'))

tree.remove('/package.json')

// Find the node with the value '/a' and start searching from there.
tree.has('/a/b', tree.nodeByValue('/a'))
```

### Persistence

Persisting tree data can be a very useful thing as well. While it is very hard to persist the relations between nodes, you still want to persist node modifications. This can be done like so:

```typescript
// Define your tree. If you want to persist it, it's recommended to reuse the comparator globally
const comp: TreeComparator<number, number> = (n, v) => v > n.value
const tree = new Tree(0, comp)
// ... adding values
// Persist your tree with toJSON. This returns a string of an array of your node values.
const jsonString = tree.toJSON()

const parsed = JSON.parse(jsonString)
const newTree = new Tree(parsed[0], comp)
// Even with the root value still present, mini-tree is robust enough to filter out the duplicate value
newTree.addAll(parsed)
```

---

© Torathion 2025
