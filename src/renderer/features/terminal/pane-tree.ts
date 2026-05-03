export type PaneLeaf = { type: 'leaf'; sessionId: string }
export type PaneSplit = {
  type: 'split'
  id: string
  direction: 'horizontal' | 'vertical'
  children: PaneNode[]
}
export type PaneNode = PaneLeaf | PaneSplit

export function makeLeaf(sessionId: string): PaneLeaf {
  return { type: 'leaf', sessionId }
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function splitLeaf(
  node: PaneNode,
  targetId: string,
  direction: 'horizontal' | 'vertical',
  newId: string
): PaneNode {
  if (node.type === 'leaf') {
    if (node.sessionId === targetId) {
      return {
        type: 'split',
        id: makeId(),
        direction,
        children: [node, { type: 'leaf', sessionId: newId }]
      }
    }
    return node
  }
  return { ...node, children: node.children.map((c) => splitLeaf(c, targetId, direction, newId)) }
}

export function removeLeaf(node: PaneNode, targetId: string): PaneNode | null {
  if (node.type === 'leaf') {
    return node.sessionId === targetId ? null : node
  }
  const children = node.children
    .map((c) => removeLeaf(c, targetId))
    .filter((c): c is PaneNode => c !== null)
  if (children.length === 0) return null
  if (children.length === 1) return children[0]
  return { ...node, children }
}

export function collectSessionIds(node: PaneNode): string[] {
  if (node.type === 'leaf') return [node.sessionId]
  return node.children.flatMap(collectSessionIds)
}

export function findTabForSession(
  paneTree: Record<string, PaneNode>,
  sessionId: string
): string | null {
  for (const tabId of Object.keys(paneTree)) {
    if (collectSessionIds(paneTree[tabId]).includes(sessionId)) return tabId
  }
  return null
}
