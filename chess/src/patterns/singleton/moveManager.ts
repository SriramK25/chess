import { Coordinate } from "../../types/indexedAccessTypes";
import { PlayersData } from "../../types/mapTypes";
import { Player as PlayerType } from "../../types/unionTypes";
import Tile from "../factory/tileFactory";
import TileGraph from "./tileGraph";

// This Class is responsible for Calculating Moves for the Selected Piece by Player
export default class MoveManager {
  static #instance: MoveManager | null = null;

  private constructor() {}

  static getInstance() {
    if (!this.#instance) this.#instance = new MoveManager();
    return this.#instance;
  }

  getMovesForPawn(
    targetTile: Tile,
    tileCoordinate: Coordinate,
    tileGraph: TileGraph,
    playerTurn: PlayerType
  ): Tile[] {
    const neighborTiles: Coordinate[] = [
      ...tileGraph.getNeighbors(tileCoordinate),
    ];

    const nextTileRankIndex =
      playerTurn === "white"
        ? (Number(tileCoordinate[1]) + 1).toString()
        : (Number(tileCoordinate[1]) - 1).toString();

    const availableTilesToMovePawn: Tile[] = [];

    const availableMoves = neighborTiles.filter(
      (neighborTile) => neighborTile[1] === nextTileRankIndex
    );

    availableMoves.forEach((move) => {
      let straightTile: Tile | null;
      if (tileCoordinate[0] === move[0]) {
        straightTile = tileGraph.getTileByVertex(move);
        !straightTile.hasPiece && availableTilesToMovePawn.push(straightTile);
      }

      if (
        tileCoordinate[0] === move[0] &&
        !targetTile.pieceData?.hasMoved &&
        !straightTile!.hasPiece
      ) {
        const secondStraightTile = tileGraph.getTileByVertex(
          `${move[0]}${
            Number(nextTileRankIndex) + (playerTurn === "white" ? 1 : -1)
          }` as Coordinate
        );

        !secondStraightTile.hasPiece &&
          availableTilesToMovePawn.push(secondStraightTile);
      }

      if (tileCoordinate[0] !== move[0]) {
        const diagonalTile = tileGraph.getTileByVertex(move);
        diagonalTile.hasPiece &&
          diagonalTile.player !== playerTurn &&
          availableTilesToMovePawn.push(diagonalTile);
      }
    });

    return availableTilesToMovePawn;
  }

  getMovesForKnight(
    targetTile: Tile,
    tileCoordinate: Coordinate,
    tileGraph: TileGraph,
    playerTurn: PlayerType
  ): Tile[] {
    const neighborTiles: Coordinate[] = [
      ...tileGraph.getNeighbors(tileCoordinate),
    ].filter(
      (neighborTile) =>
        neighborTile[0] === tileCoordinate[0] ||
        neighborTile[1] === tileCoordinate[1]
    );

    const neighborTilesAsSet = new Set(neighborTiles);

    const availableTilesToMoveKnight: Tile[] = [];

    neighborTiles.forEach((tile) => {
      const neighborsOfNeighborTile = [...tileGraph.getNeighbors(tile)].filter(
        (neighborTile) =>
          neighborTile[0] !== tile[0] && neighborTile[1] !== tile[1]
      );

      neighborsOfNeighborTile.forEach((neighborTile) => {
        const tile = tileGraph.getTileByVertex(neighborTile);

        !neighborTilesAsSet.has(neighborTile) &&
          tile.player !== playerTurn &&
          availableTilesToMoveKnight.push(tile);
      });
    });

    return availableTilesToMoveKnight;
  }

  getMovesForBishop(
    targetTile: Tile,
    tileCoordinate: Coordinate,
    tileGraph: TileGraph,
    playerTurn: PlayerType
  ): Tile[] {
    const neighborTiles: Coordinate[] = [
      ...tileGraph.getNeighbors(tileCoordinate),
    ].filter(
      (neighborTile) =>
        neighborTile[0] !== tileCoordinate[0] &&
        neighborTile[1] !== tileCoordinate[1]
    );

    const availableTilesToMoveBishop: Tile[] = [];

    neighborTiles.forEach((neighborTileCoordinate) => {
      const neighborTile = tileGraph.getTileByVertex(neighborTileCoordinate);
      let hasTilePushedWithPiece = false;

      if (neighborTile.hasPiece) {
        if (neighborTile.player === playerTurn) return;

        hasTilePushedWithPiece = true;
      }

      availableTilesToMoveBishop.push(neighborTile);

      const diagonalTileCoordinates = this.getDiagonals(
        tileCoordinate,
        neighborTileCoordinate,
        tileGraph
      );

      diagonalTileCoordinates.forEach((diagonalTileCoordinate) => {
        const diagonalTile = tileGraph.getTileByVertex(diagonalTileCoordinate);
        if (diagonalTile.hasPiece) {
          if (diagonalTile.player === playerTurn) {
            hasTilePushedWithPiece = true;
            return;
          }

          if (!hasTilePushedWithPiece) {
            hasTilePushedWithPiece = true;
            availableTilesToMoveBishop.push(diagonalTile);
          }
          return;
        }
        if (hasTilePushedWithPiece) return;

        availableTilesToMoveBishop.push(diagonalTile);
      });
    });

    return availableTilesToMoveBishop;
  }

  getDiagonals(
    previousTileCoordinate: Coordinate,
    tileCoordinate: Coordinate,
    tileGraph: TileGraph
  ) {
    const diagonalCoordinates = [
      ...tileGraph.getNeighbors(tileCoordinate),
    ].filter(
      (diagonalCoordinate) =>
        diagonalCoordinate[0] !== tileCoordinate[0] &&
        diagonalCoordinate[1] !== tileCoordinate[1] &&
        diagonalCoordinate[0] !== previousTileCoordinate[0] &&
        diagonalCoordinate[1] !== previousTileCoordinate[1]
    );

    if (diagonalCoordinates.length) {
      diagonalCoordinates.map((diagonalCoordinate) => {
        diagonalCoordinates.push(
          ...this.getDiagonals(tileCoordinate, diagonalCoordinate, tileGraph)
        );
      });
    }

    return diagonalCoordinates;
  }

  getMovesForRook(
    targetTile: Tile,
    tileCoordinate: Coordinate,
    tileGraph: TileGraph,
    playerTurn: PlayerType
  ) {
    const neighborTiles: Coordinate[] = [
      ...tileGraph.getNeighbors(tileCoordinate),
    ].filter(
      (neighborTile) =>
        neighborTile[0] === tileCoordinate[0] ||
        neighborTile[1] === tileCoordinate[1]
    );
  }

  getStraights(
    previousTileCoordinate: Coordinate,
    tileCoordinate: Coordinate,
    tileGraph: TileGraph
  ) {
    // const straightCoordinates = [...tileGraph.getNeighbors(tileCoordinate)].filter(straightCoordinate => );
    // Will be Implemented
  }

  movePiece(
    targetTile: Tile,
    previouslyFocusedTileWithPiece: Tile | null
  ): boolean {
    if (!targetTile || !previouslyFocusedTileWithPiece) return false;
    targetTile.getPieceFromAnotherTile(previouslyFocusedTileWithPiece);
    return true;
  }

  capturePiece(
    targetTile: Tile,
    previouslyFocusedTileWithPiece: Tile | null
  ): boolean {
    if (!targetTile || !previouslyFocusedTileWithPiece) return false;

    targetTile.getPieceFromAnotherTile(previouslyFocusedTileWithPiece, true);
    return true;
  }
}
