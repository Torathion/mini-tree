# CHANGELOG

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
