// Simple navigation blocker service
// Components can register a blocker id to prevent back navigation / swipes.

const blockers = new Set<string>()

export function blockNavigation(id: string) {
  blockers.add(id)
}

export function unblockNavigation(id: string) {
  blockers.delete(id)
}

export function isNavigationBlocked(): boolean {
  return blockers.size > 0
}

export function clearAllBlocks() {
  blockers.clear()
}
