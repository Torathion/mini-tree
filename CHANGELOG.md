# CHANGELOG

## [2.1.0] 06-10-2025

### Added

- Method `tree.clear()` to remove all children and reset the count.
- Method `tree.sub()` as shortcut to `branchAll(x, tree.nodeByValue(x))`
- Property `level` to `TreeNode`

### Fixed

- Missing type declarations for `comp`, `eq` and `onAdd`
- Incorrect type declaration for `branchAll`
- Missing edge case on root value being the target value in `branchAll`

## [2.0.0] 06-08-2025

### BREAKING:

- Restricted callback definition.
    - Callback definitions have been moved to new functions `eq`, `comp` and `onAdd`, while also remaining in the constructor.
    - Methods have less parameters to allow sub-root operations.
    - Custom callback definitions still remain in search functions `remove` and `has`.
- Shortened syntax of properties and functions:
    - `node.totalCount` -> `node.total`
    - `node.isChildOf(node2)` -> `node.childOf(node2)`
    - `node.isParentOf(node2)` -> `node.parentOf(node2)`
    - `node.isLeaf()` -> `node.leaf`
    - `node.isRoot()` -> `node.root`
    - `tree.counter` -> `tree.count`

### Added

- `tree.branchAll()` as alternative to `tree.branch()` to also fetch all child nodes of the target value node.

### Fixed

-  `tree.branch()` better detects target value leaf nodes now.
-  `root` being required as parameter in `addAll` and `nodeByValue`.

## [1.2.0] 03-30-2025

- Add `toJSON` to persist the tree.
- Make constructor comparator callback optional for stub data.

## [1.1.1] 03-28-2025

- Remove win32 vitest build dependency from 'dependencies'

## [1.1.0] 03-28-2025

### Fixed

- Duplicate root value could be added
- Wrong childCount update when removing nodes
- `branch` not detecting deeply invalid values
- `branch` not stopping when target value has been reached in the middle of the branch.

### Added

- `addAll` to parse arrays into the tree
- `nodeByValue` to extract a node by its value for sub-tree operations
- Ability to search with primitive values in complex data in `has`, `branch`, `remove` and `nodeByValue`

## [1.0.1] 03-27-2025

- Change: rename `micro-tree` to `mini-tree` due to npm registry bug: [issue](https://github.com/npm/cli/issues/8194)
