import { describe, it, expect, beforeEach } from 'vitest'
import Tree, { TreeNode, type AsyncTraverser } from '../src'

interface TestPathMetadata {
  path: string
  dir: boolean
  fileCount: number
}


function getComplexDataTree(): Tree<TestPathMetadata, string> {
  const tree = new Tree<TestPathMetadata, string>({ path: '/', dir: true, fileCount: 5 }, (n, v) => v.startsWith(n.value.path), (n, v) => v === n.value.path)

  tree.addAll([
    { path: '/package.json', dir: false, fileCount: 0 },
    { path: '/a', dir: true, fileCount: 1 },
    { path: '/a/package.json', dir: false, fileCount: 0 },
    { path: '/a/b', dir: true, fileCount: 0 }
  ], (n, v) => v.path.startsWith(n.value.path), (n, v) => v.path === n.value.path)
  return tree
}

describe('Tree', () => {
  let tree: Tree<number>

  beforeEach(() => {
    tree = new Tree<number>(0, (node, value) => value > node.value)
  })

  describe('TreeNode', () => {
    it('should create a node with correct properties', () => {
      const node = new TreeNode(1, 5)
      expect(node.id).toBe(1)
      expect(node.value).toBe(5)
      expect(node.parent).toBeUndefined()
      expect(node.childCount).toBe(0)
      expect(node.children).toEqual([])
      expect(node.totalCount).toBe(0)
    })

    it('should add children correctly', () => {
      const node = new TreeNode(1, 5)
      node.add(2, 10)
      expect(node.childCount).toBe(1)
      expect(node.totalCount).toBe(1)
      expect(node.children[0].value).toBe(10)
      expect(node.children[0].parent).toBe(node)
    })

    it('recursively tracks the number of children', () => {
      const node = new TreeNode(1, 5)
      node.add(2, 10)
      node.children[0].add(3, 20)

      expect(node.childCount).toBe(1)
      expect(node.totalCount).toBe(2)
    })

    it('should correctly identify relationships', () => {
      const parent = new TreeNode(1, 5)
      parent.add(2, 10)
      const child = parent.children[0]

      expect(child.isChildOf(parent)).toBe(true)
      expect(parent.isParentOf(child)).toBe(true)
      expect(parent.isLeaf()).toBe(false)
      expect(child.isLeaf()).toBe(true)
      expect(parent.isRoot()).toBe(true)
      expect(child.isRoot()).toBe(false)
    })

    it('can distinguish between child and non-child nodes', () => {
      const parent = new TreeNode(1, 5)
      parent.add(2, 10)
      const child = parent.children[0]
      const nonChild = new TreeNode(3, 20)

      expect(child.isChildOf(parent)).toBe(true)
      expect(parent.isParentOf(child)).toBe(true)

      expect(nonChild.isChildOf(parent)).toBe(false)
      expect(parent.isParentOf(nonChild)).toBe(false)

      expect(nonChild.isParentOf(child)).toBe(false)
    })
  })

  describe('Tree construction and addition', () => {
    it('should initialize with root node', () => {
      expect(tree.root.value).toBe(0)
      expect(tree.root.id).toBe(0)
      expect(tree.counter).toBe(1)
    })

    it('should add nodes correctly', () => {
      tree.add(5)
      tree.add(3)
      tree.add(7)

      expect(tree.root.childCount).toBe(2)
      expect(tree.counter).toBe(4)
      expect(tree.root.children.map(n => n.value)).toEqual([5, 3])
    })

    it('should not add duplicate values', () => {
      tree.add(5)
      tree.add(5)

      expect(tree.root.childCount).toBe(1)
      expect(tree.counter).toBe(2)
    })

    it('should not add duplicate root value', () => {
      tree.add(0)

      expect(tree.root.childCount).toBe(0)
      expect(tree.counter).toBe(1)
    })

    it('can add multiple values at once', () => {
      const array: number[] = []
      for (let i = 0; i < 100; i++) array.push(i)
      tree.addAll(array)

      let counter = 0
      for (const node of tree) expect(node.value).toBe(counter++)
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
      expect(tree.counter).toBe(2)
    })

    it('removes leaves starting', () => {
      tree.add(5)
      tree.add(3)
      tree.add(7)

      tree.remove(7)
      expect(tree.root.childCount).toBe(2)
      expect(tree.counter).toBe(3)
    })

    it('removes leaves starting from a leaf', () => {
      tree.add(5)
      tree.add(3)
      tree.add(7)

      tree.remove(
        7,
        (n, v) => n.value === v,
        (n, v) => v > n.value,
        tree.node(3)
      )
      expect(tree.root.childCount).toBe(2)
      expect(tree.counter).toBe(3)
    })

    it('can remove the root', () => {
      tree.remove(0)
      expect(tree.root.value).toBeUndefined()
      expect(tree.counter).toBe(0)
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

      // Shouldn't retrieve invalid branches
      expect(pathTree.branch('foobar')).toEqual([])

      // Deep invalid branch
      expect(pathTree.branch('/a/foobar')).toEqual([])
    })

    it('can retrieve a branch of complex data from a primitive value', () => {
      const tree = getComplexDataTree()

      expect(tree.branch('/a/b').map((v) => v.path)).toEqual(['/', '/a', '/a/b'])
      expect(tree.branch('/package.json').map((v) => v.path)).toEqual(['/', '/package.json'])
      expect(tree.branch('/c')).toEqual([])
      expect(tree.branch('/a/b/c')).toEqual([])
    })
  })

  describe('Iterator', () => {
    it('recursively iterates through all nodes of the tree', () => {
      for (let i = 1; i < 10; i++) tree.add(i)

      let counter = 0
      for (const node of tree) {
        expect(node.value).toBe(counter++)
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
})
