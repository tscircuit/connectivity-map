export class ConnectivityMap {
  netMap: Record<string, string[]>

  idToNetMap: Record<string, string>

  constructor(netMap: Record<string, string[]>) {
    this.netMap = netMap
    this.idToNetMap = {}
    for (const [netId, ids] of Object.entries(netMap)) {
      for (const id of ids) {
        this.idToNetMap[id] = netId
      }
    }
  }

  addConnections(connections: string[][]) {
    for (const connection of connections) {
      if (connection.length === 0) continue
      const existingNets = new Set<string>()

      // Find all existing nets for the connection
      for (const id of connection) {
        const existingNetId = this.idToNetMap[id]
        if (existingNetId !== undefined) {
          existingNets.add(existingNetId)
        }
      }

      let targetNetId = existingNets.values().next().value
      if (targetNetId === undefined) {
        // If no existing nets found, create a new one
        let nextNetIndex = Object.keys(this.netMap).length
        targetNetId = `connectivity_net${nextNetIndex}`
        while (Object.hasOwn(this.netMap, targetNetId)) {
          targetNetId = `connectivity_net${++nextNetIndex}`
        }
        this.netMap[targetNetId] = []
      }

      const targetNet = this.netMap[targetNetId]!
      for (const netId of existingNets) {
        const sourceNet = this.netMap[netId]
        if (!sourceNet || sourceNet === targetNet) continue
        for (const id of sourceNet) {
          targetNet.push(id)
          this.idToNetMap[id] = targetNetId
        }
        // Every older alias must follow this merge, not just its current name.
        for (const [alias, members] of Object.entries(this.netMap)) {
          if (members === sourceNet) this.netMap[alias] = targetNet
        }
      }

      // Add all ids to the target net
      for (const id of connection) {
        if (!targetNet.includes(id)) {
          targetNet.push(id)
        }
        this.idToNetMap[id] = targetNetId
      }
    }
  }

  getIdsConnectedToNet(netId: string): string[] {
    return this.netMap[netId] || []
  }

  getNetConnectedToId(id: string): string | undefined {
    return this.idToNetMap[id]
  }

  areIdsConnected(id1: string, id2: string): boolean {
    if (id1 === id2) return true
    const netId1 = this.getNetConnectedToId(id1)
    if (netId1 === undefined) return false
    const netId2 = this.getNetConnectedToId(id2)
    if (netId2 === undefined) return false
    return netId1 === netId2
  }

  areAllIdsConnected(ids: string[]): boolean {
    if (ids.length === 0) return true
    const netId = this.getNetConnectedToId(ids[0]!)
    if (netId === undefined) return false

    for (const id of ids) {
      const nextNetId = this.getNetConnectedToId(id)
      if (nextNetId === undefined) {
        return false
      }
      if (nextNetId !== netId) {
        return false
      }
    }
    return true
  }
}
