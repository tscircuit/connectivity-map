import { expect, test } from "bun:test"
import { ConnectivityMap } from "../src/ConnectivityMap"

test("aliased net merges preserve unique pin IDs across chained merges and re-initialization", () => {
  const pinIds = ["A", "B", "C", "D", "E", "F"]
  const connections = [
    ["EDGE_0", "A", "B"],
    ["EDGE_1", "C", "D"],
    ["EDGE_2", "E", "F"],
    ["EDGE_3", "C", "E"],
    ["EDGE_4", "A", "D"],
  ]

  const directMap = new ConnectivityMap({})
  directMap.addConnections(connections)
  const aliases = Object.keys(directMap.netMap)

  const netMap = new ConnectivityMap(directMap.netMap)
  netMap.addConnections([["V3V3", "A", "C", "E"]])

  for (const alias of aliases) {
    expect(
      netMap
        .getIdsConnectedToNet(alias)
        .filter((id) => pinIds.includes(id))
        .toSorted(),
    ).toEqual(pinIds.toSorted())
  }
  for (const connection of connections) {
    expect(netMap.areAllIdsConnected(connection)).toBe(true)
  }
})
