import { expect, test } from "bun:test"
import { ConnectivityMap } from "../src/ConnectivityMap"

test("new connections do not overwrite an existing generated-style net name", () => {
  const map = new ConnectivityMap({ connectivity_net1: ["A", "B"] })
  map.addConnections([["C", "D"]])

  expect(map.getIdsConnectedToNet("connectivity_net1")).toEqual(["A", "B"])
  expect(map.areIdsConnected("A", "B")).toBe(true)
  expect(map.areIdsConnected("C", "D")).toBe(true)
  expect(map.areIdsConnected("A", "C")).toBe(false)
})

test("every historical net alias follows a chain of merges and later additions", () => {
  const map = new ConnectivityMap({ alpha: ["A"], beta: ["B"], gamma: ["C"] })
  map.addConnections([["A", "B"]])
  map.addConnections([["C", "A"]])
  map.addConnections([["B", "D"]])

  const canonical = map.getIdsConnectedToNet("gamma")
  expect([...canonical].sort()).toEqual(["A", "B", "C", "D"])
  for (const alias of ["alpha", "beta", "gamma"]) {
    expect(map.getIdsConnectedToNet(alias)).toBe(canonical)
  }
  for (const id of ["A", "B", "C", "D"]) {
    expect(map.getNetConnectedToId(id)).toBe("gamma")
  }
  expect(map.areAllIdsConnected(["A", "B", "C", "D"])).toBe(true)
})

test("an empty-string net ID remains a real network during queries and merges", () => {
  const map = new ConnectivityMap({ "": ["A", "B"], other: ["C"] })
  expect(map.areIdsConnected("A", "B")).toBe(true)
  expect(map.areAllIdsConnected(["A", "B"])).toBe(true)

  map.addConnections([["A", "C", "D"]])
  expect(map.getNetConnectedToId("D")).toBe("")
  expect([...map.getIdsConnectedToNet("")].sort()).toEqual(["A", "B", "C", "D"])
  expect(map.getIdsConnectedToNet("other")).toBe(map.getIdsConnectedToNet(""))
  expect(map.areIdsConnected("B", "D")).toBe(true)
})

test("node names that match another net name do not create asymmetric connections", () => {
  const map = new ConnectivityMap({ left: ["A"], right: ["left"] })
  expect(map.areIdsConnected("left", "A")).toBe(false)
  expect(map.areIdsConnected("A", "left")).toBe(false)
  map.addConnections([["left", "A"]])
  expect(map.areIdsConnected("left", "A")).toBe(true)
  expect(map.areIdsConnected("A", "left")).toBe(true)
})

test("empty connection lists do not allocate networks", () => {
  const map = new ConnectivityMap({ original: ["A"] })
  map.addConnections([[], []])
  expect(Object.keys(map.netMap)).toEqual(["original"])
})

test("large networks merge without using one function argument per node", () => {
  const source = Array.from(
    { length: 200_000 },
    (_, index) => `source-${index}`,
  )
  const map = new ConnectivityMap({ target: ["A"], source })
  map.addConnections([["A", "source-0"]])
  expect(map.getIdsConnectedToNet("target")).toHaveLength(200_001)
  expect(map.getIdsConnectedToNet("source")).toBe(
    map.getIdsConnectedToNet("target"),
  )
  expect(map.areIdsConnected("A", "source-199999")).toBe(true)
})
