import { describe, it, expect, beforeEach } from 'vitest'
import Tree, { TreeNode, type AsyncTraverser } from '../src'
import { afterEach } from 'vitest'

interface TestPathMetadata {
  path: string
  dir: boolean
  fileCount: number
}

function getComplexDataTree(): Tree<TestPathMetadata, string> {
  const tree = new Tree<TestPathMetadata, string>(
    { path: '/', dir: true, fileCount: 5 },
    (n, v) => v.startsWith(n.value.path),
    (n, v) => v === n.value.path
  )

  tree.onAdd(
    (n, v) => v.path === n.value.path,
    (n, v) => v.path.startsWith(n.value.path)
  )

  tree.addAll([
    { path: '/package.json', dir: false, fileCount: 0 },
    { path: '/a', dir: true, fileCount: 1 },
    { path: '/a/package.json', dir: false, fileCount: 0 },
    { path: '/a/b', dir: true, fileCount: 0 }
  ])
  return tree
}

describe('Tree', () => {
  let tree: Tree<number>

  beforeEach(() => {
    tree = new Tree<number>(
      0,
      (node, value) => value > node.value,
      (node, value) => value === node.value
    )
  })

  describe('TreeNode', () => {
    it('should create a node with correct properties', () => {
      const node = new TreeNode(1, 5)
      expect(node.id).toBe(1)
      expect(node.value).toBe(5)
      expect(node.parent).toBeUndefined()
      expect(node.childCount).toBe(0)
      expect(node.children).toEqual([])
      expect(node.total).toBe(0)
    })

    it('should add children correctly', () => {
      const node = new TreeNode(1, 5)
      node.add(2, 10)
      expect(node.childCount).toBe(1)
      expect(node.total).toBe(1)
      expect(node.children[0].value).toBe(10)
      expect(node.children[0].parent).toBe(node)
    })

    it('recursively tracks the number of children', () => {
      const node = new TreeNode(1, 5)
      node.add(2, 10)
      node.children[0].add(3, 20)

      expect(node.childCount).toBe(1)
      expect(node.total).toBe(2)
    })

    it('should correctly identify relationships', () => {
      const parent = new TreeNode(1, 5)
      parent.add(2, 10)
      const child = parent.children[0]

      expect(child.childOf(parent)).toBe(true)
      expect(parent.parentOf(child)).toBe(true)
      expect(parent.leaf).toBe(false)
      expect(child.leaf).toBe(true)
      expect(parent.root).toBe(true)
      expect(child.root).toBe(false)
    })

    it('can distinguish between child and non-child nodes', () => {
      const parent = new TreeNode(1, 5)
      parent.add(2, 10)
      const child = parent.children[0]
      const nonChild = new TreeNode(3, 20)

      expect(child.childOf(parent)).toBe(true)
      expect(parent.parentOf(child)).toBe(true)

      expect(nonChild.childOf(parent)).toBe(false)
      expect(parent.parentOf(nonChild)).toBe(false)

      expect(nonChild.parentOf(child)).toBe(false)
    })
  })

  it('can be cleared', () => {
    for (let i = 0; i < 10; i++) tree.add(i)

    expect(tree.count).toBeGreaterThan(0)
    expect(tree.root.children.length).toBeGreaterThan(0)

    tree.clear()

    expect(tree.count).toBe(1)
    expect(tree.root.children).toEqual([])
  })

  describe('Tree construction and addition', () => {
    it('should initialize with root node', () => {
      expect(tree.root.value).toBe(0)
      expect(tree.root.id).toBe(0)
      expect(tree.count).toBe(1)
    })

    it('should add nodes correctly', () => {
      tree.add(5)
      tree.add(3)
      tree.add(7)

      expect(tree.root.childCount).toBe(2)
      expect(tree.count).toBe(4)
      expect(tree.root.children.map(n => n.value)).toEqual([5, 3])
    })

    it('can redefine the standard comparator functions', () => {
      tree.comp((node, value) => value < node.value)
      tree.eq((node, value) => value === node.value)

      // Add comparators are still the same
      tree.add(5)
      tree.add(3)
      tree.add(7)

      expect(tree.has(5)).toBe(true)
      // Should fail, as we can't reach it anymore with the new comparator
      expect(tree.has(7)).toBe(false)
    })

    it('should not add duplicate values', () => {
      tree.add(5)
      tree.add(5)

      expect(tree.root.childCount).toBe(1)
      expect(tree.count).toBe(2)
    })

    it('should not add duplicate root value', () => {
      tree.add(0)

      expect(tree.root.childCount).toBe(0)
      expect(tree.count).toBe(1)
    })

    it('can add multiple values at once', () => {
      const array: number[] = []
      for (let i = 0; i < 100; i++) array.push(i)
      tree.addAll(array)

      let count = 0
      for (const node of tree) expect(node.value).toBe(count++)
    })
  })

  describe('Traversal', () => {
    it('should traverse asynchronously', async () => {
      tree.add(5)
      tree.add(3)

      const visited: number[] = []
      const visit: AsyncTraverser<number> = async node => {
        visited.push(node.value)
      }

      await tree.traverseAsync(visit)
      expect(visited).toContain(0)
      expect(visited).toContain(3)
      expect(visited).toContain(5)
    })
  })

  describe('Removal', () => {
    it('should remove nodes correctly', () => {
      tree.add(5)
      tree.add(3)
      tree.add(7)

      tree.remove(5)
      expect(tree.root.childCount).toBe(1)
      expect(tree.root.children[0].value).toEqual(3)
      expect(tree.count).toBe(2)
    })

    it('removes leaves starting', () => {
      tree.add(5)
      tree.add(3)
      tree.add(7)

      tree.remove(7)
      expect(tree.root.childCount).toBe(2)
      expect(tree.count).toBe(3)
    })

    it('removes leaves starting from a leaf', () => {
      tree.add(5)
      tree.add(3)
      tree.add(7)

      tree.remove(
        7,
        tree.node(3),
        (n, v) => n.value === v,
        (n, v) => v > n.value
      )
      expect(tree.root.childCount).toBe(2)
      expect(tree.count).toBe(3)
    })

    it('can remove the root', () => {
      tree.remove(0)
      expect(tree.root.value).toBeUndefined()
      expect(tree.count).toBe(0)
    })

    it('can remove complex data with primitive data', () => {
      const tree = getComplexDataTree()

      tree.remove('/package.json')
      expect(tree.root.childCount).toBe(1)
    })
  })

  describe('Branches', () => {
    it('can retrieve a specific branch from the tree', () => {
      const pathTree = new Tree<string>('/', (node, value) => value.includes(node.value))
      pathTree.add('/a')
      pathTree.add('/b')
      pathTree.add('/a/c')
      pathTree.add('/a/c/e')
      pathTree.add('/b/d')
      pathTree.add('/b/d/f')

      expect(pathTree.branch('/a/c/e')).toEqual(['/', '/a', '/a/c', '/a/c/e'])
      expect(pathTree.branch('/b/d/f')).toEqual(['/', '/b', '/b/d', '/b/d/f'])

      // Should stop after reaching target node, even if its not a leaf
      expect(pathTree.branch('/a/c')).toEqual(['/', '/a', '/a/c'])

      // Shouldn't retrieve invalid branches
      expect(pathTree.branch('foobar')).toEqual([])

      // Deep invalid branch
      expect(pathTree.branch('/a/foobar')).toEqual([])
    })

    it('can retrieve a branch of complex data from a primitive value', () => {
      const tree = getComplexDataTree()

      expect(tree.branch('/a/b').map(v => v.path)).toEqual(['/', '/a', '/a/b'])
      expect(tree.branch('/package.json').map(v => v.path)).toEqual(['/', '/package.json'])
      expect(tree.branch('/c')).toEqual([])
      expect(tree.branch('/a/b/c')).toEqual([])
    })

    it('can retrieve a branch starting from a sub-root', () => {
      tree.add(9)
      tree.add(3)
      tree.add(4)
      tree.add(6)
      tree.add(5)

      // Full branch: 0 -> 3 -> 4 -> 5
      expect(tree.branch(5, tree.nodeByValue(3))).toEqual([3, 4, 5])
      expect(tree.branch(5, tree.nodeByValue(5))).toEqual([5])
    })

    describe('All', () => {
      beforeEach(() => {
        tree.add(9)
        tree.add(3)
        tree.add(4)
        tree.add(6)
        tree.add(5)
      })

      afterEach(() => {
        tree.clear()
      })

      it('acts the same like branch on leaf element', () => {
        // Full branch: 0 -> 3 -> 4 -> 5
        expect(tree.branchAll(5)).toEqual([0, 3, 4, 5])
        expect(tree.branchAll(5, tree.nodeByValue(3))).toEqual([3, 4, 5])
        expect(tree.branchAll(9)).toEqual([0, 9])
        expect(tree.branchAll(9, tree.nodeByValue(9))).toEqual([9])
      })

      it('fetches all underlying child nodes when the value has already been found', () => {
        // Full branch: 0 -> 3 -> 4 -> [5, 6]
        expect(tree.branchAll(3)).toEqual([0, 3, 4, 6, 5])
        expect(tree.branchAll(7)).toEqual([])
      })

      it('can be found immediately', () => {
        // A node that only has two child nodes should still get all.
        expect(tree.branchAll(4, tree.nodeByValue(4))).toEqual([4, 6, 5])
      })
    })
  })

  describe('Iterator', () => {
    it('recursively iterates through all nodes of the tree', () => {
      for (let i = 1; i < 10; i++) tree.add(i)

      let count = 0
      for (const node of tree) {
        expect(node.value).toBe(count++)
      }
    })
  })

  describe('Find', () => {
    it('can find a node by its id', () => {
      for (let i = 1; i < 10; i++) tree.add(i)

      expect(tree.node(5)).toBeDefined()
      expect(tree.node(5)?.id).toBe(5)

      expect(tree.node(-1)).toBeUndefined()
    })

    it('can find for a specific value', () => {
      for (let i = 1; i < 10; i++) tree.add(i)

      expect(tree.has(5)).toBe(true)
      expect(tree.has(0)).toBe(true)
      expect(tree.has(-1)).toBe(false)
      expect(tree.has(2567834)).toBe(false)
    })

    it('can search for primitive data in complex data', () => {
      const tree = getComplexDataTree()

      expect(tree.has('/a/b')).toBe(true)
      expect(tree.has('/package.json')).toBe(true)
      expect(tree.has('/a/b/c')).toBe(false)
    })

    it('can find a node by its value', () => {
      for (let i = 0; i < 10; i++) tree.add(i)

      expect(tree.nodeByValue(5)?.value).toEqual(5)
      expect(tree.nodeByValue(-1)).toBeUndefined()
      expect(tree.nodeByValue(11)).toBeUndefined()
    })

    it('can find a node by its value inside complex data', () => {
      const tree = getComplexDataTree()

      expect(tree.nodeByValue('/')?.value.path).toBe('/')
      expect(tree.nodeByValue('/a/b')?.value.path).toBe('/a/b')
      expect(tree.nodeByValue('')).toBeUndefined()
      expect(tree.nodeByValue('/a/b/c')).toBeUndefined()
    })
  })

  describe('Persistence', () => {
    it('can be converted to a json-viable string', () => {
      expect(new Tree(0).toJSON()).toBe('[0]')

      tree.add(5)
      tree.add(3)
      tree.add(7)

      expect(tree.toJSON()).toBe('[0,5,3,7]')
    })

    it('should convert complex data to a json-viable string', () => {
      expect(getComplexDataTree().toJSON()).toBe(
        '[{"path":"/","dir":true,"fileCount":5},{"path":"/package.json","dir":false,"fileCount":0},{"path":"/a","dir":true,"fileCount":1},{"path":"/a/package.json","dir":false,"fileCount":0},{"path":"/a/b","dir":true,"fileCount":0}]'
      )
    })

    it('should parse simple stringified content back', () => {
      const zeroTree = new Tree(0)
      const parsedTree = new Tree(0)

      parsedTree.addAll(JSON.parse(zeroTree.toJSON()))

      expect(parsedTree.root.value).toEqual(zeroTree.root.value)
      expect(parsedTree.root.childCount).toBe(zeroTree.root.childCount)
      expect(parsedTree.count).toBe(zeroTree.count)
    })

    it('should parse simple stringified content back', () => {
      tree.addAll([5, 3, 7])

      const parsedTree = new Tree(0, (node, value) => value > node.value)
      parsedTree.addAll(JSON.parse(tree.toJSON()))

      expect(parsedTree.root.value).toEqual(tree.root.value)
      expect(parsedTree.root.childCount).toBe(tree.root.childCount)
      expect(parsedTree.count).toBe(tree.count)
    })

    it('should parse complex stringified content back', () => {
      const tree = getComplexDataTree()

      const parsedContent = JSON.parse(tree.toJSON())
      const parsedTree = new Tree(parsedContent[0])

      parsedTree.onAdd(
        (n, v) => v.path === n.value.path,
        (n, v) => v.path.startsWith(n.value.path)
      )

      parsedTree.addAll(parsedContent)

      expect(tree.toJSON()).toBe(parsedTree.toJSON())
      expect(JSON.parse(tree.toJSON())).toEqual(JSON.parse(parsedTree.toJSON()))
    })
  })
})
