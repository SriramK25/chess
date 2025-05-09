import { Coordinate } from "../../types/indexedAccessTypes";
import Tile from "../factory/tileFactory";

export default class TileGraph {
  #vertices: Map<Coordinate, Tile> = new Map();
  #edges: Map<Coordinate, Set<Coordinate>> = new Map();

  addVertex(coordinate: Coordinate, tile: Tile): boolean {
    if (this.#vertices.get(coordinate)) return false;

    this.#vertices.set(coordinate, tile);
    return true;
  }

  addEdge(baseEdge: Coordinate, targetEdge: Coordinate): boolean {
    if (
      baseEdge === targetEdge ||
      !this.#vertices.has(baseEdge) ||
      !this.#vertices.has(targetEdge)
    )
      return false;

    let baseEdgeConnection: Set<Coordinate> =
      this.#edges.get(baseEdge) ?? new Set();

    let targetEdgeConnection: Set<Coordinate> =
      this.#edges.get(targetEdge) ?? new Set();

    if (
      baseEdgeConnection.has(targetEdge) ||
      targetEdgeConnection.has(baseEdge)
    )
      return false;

    baseEdgeConnection.add(targetEdge);
    targetEdgeConnection.add(baseEdge);

    this.#edges.set(baseEdge, baseEdgeConnection);
    this.#edges.set(targetEdge, targetEdgeConnection);

    return true;
  }

  initialise(tiles: Tile[]): void {
    tiles.forEach((tile) => {
      const fileIndex: number = tile.getCoordinate().charCodeAt(0);
      const rankIndex: number = Number(tile.getCoordinate()[1]);
      const neighborTiles: Coordinate[] = [];

      const fileIndices = [
        fileIndex,
        fileIndex - 1 > 96 ? fileIndex - 1 : 0,
        fileIndex + 1 < 105 ? fileIndex + 1 : 0,
      ];
      const rankIndices = [
        rankIndex,
        rankIndex - 1 > 0 ? rankIndex - 1 : 0,
        rankIndex + 1 < 9 ? rankIndex + 1 : 0,
      ];

      fileIndices.forEach((fIndex) => {
        if (!fIndex) return;
        rankIndices.forEach((rIndex) => {
          if (!rIndex) return;

          neighborTiles.push(
            `${String.fromCharCode(fIndex)}${rIndex}` as Coordinate
          );
        });
      });
      neighborTiles.shift();

      if (!neighborTiles.length) return;

      neighborTiles.forEach((coordinate) => {
        const matchedTile = tiles.find(
          (tile) => tile.getCoordinate() === coordinate
        );

        if (!matchedTile)
          throw new Error("Error occured while initializing Graph");

        this.addVertex(coordinate, matchedTile);

        this.addEdge(tile.getCoordinate(), coordinate);
      });
    });
  }

  getNeighbors(coordinate: Coordinate): Set<Coordinate> {
    return this.#edges.get(coordinate) ?? new Set();
  }

  getTileByVertex(coordinate: Coordinate): Tile {
    return this.#vertices.get(coordinate)!;
  }
}
