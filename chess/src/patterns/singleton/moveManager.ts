import { BOARD } from "../../rules/indexRules";
import { Coordinate } from "../../types/indexedAccessTypes";
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

    const availableTilesToMoveRook: Tile[] = [];

    neighborTiles.forEach((neighborTileCoordinate) => {
      const { iterableIndex, bindingIndex, indexName, seed } =
        this.getIterableAndBindingIndex(tileCoordinate, neighborTileCoordinate);

      for (const coordinate of this.generateMove(
        iterableIndex,
        bindingIndex,
        indexName,
        seed
      )) {
        const tile = tileGraph.getTileByVertex(coordinate as Coordinate);

        if (
          !this.registerMoveAndCanAdvance(
            tile,
            playerTurn,
            availableTilesToMoveRook
          )
        )
          break;
      }
    });

    return availableTilesToMoveRook;
  }

  getIterableAndBindingIndex(
    onCoordinate: Coordinate,
    neighborTileCoordinate: Coordinate
  ): {
    iterableIndex: number;
    bindingIndex: string;
    indexName: "rank" | "file";
    seed: number;
  } {
    if (onCoordinate[0] === neighborTileCoordinate[0]) {
      return {
        iterableIndex: +neighborTileCoordinate[1],
        bindingIndex: neighborTileCoordinate[0],
        indexName: "rank",
        seed: +onCoordinate[1] + 1 === +neighborTileCoordinate[1] ? 1 : -1,
      };
    }

    const tileCoordinateCode = neighborTileCoordinate[0].charCodeAt(0);

    return {
      iterableIndex: tileCoordinateCode,
      bindingIndex: neighborTileCoordinate[1],
      indexName: "file",
      seed:
        onCoordinate.charCodeAt(0) + 1 ===
        neighborTileCoordinate[0].charCodeAt(0)
          ? 1
          : -1,
    };
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

  registerMoveAndCanAdvance(
    tile: Tile,
    playerTurn: PlayerType,
    availableTilesToMovePiece: Tile[]
  ): boolean {
    if (tile.hasPiece) {
      if (tile.player === playerTurn) return false;

      availableTilesToMovePiece.push(tile);
      return false;
    }

    availableTilesToMovePiece.push(tile);

    return true;
  }

  *generateMove(
    iterableIndex: number,
    bindingIndex: string,
    indexName: "file" | "rank",
    seed: number
  ) {
    const maxIndex =
      indexName === "file"
        ? BOARD.END_FILE_INDEX.charCodeAt(0)
        : BOARD.END_RANK_INDEX;
    const minIndex =
      indexName === "file"
        ? BOARD.START_FILE_INDEX.charCodeAt(0)
        : BOARD.START_RANK_INDEX;

    for (
      iterableIndex;
      seed > 0 ? iterableIndex <= maxIndex : iterableIndex >= minIndex;
      iterableIndex += seed
    ) {
      yield indexName === "file"
        ? `${String.fromCharCode(iterableIndex)}${bindingIndex}`
        : `${bindingIndex}${iterableIndex}`;
    }
  }

  getMovesForKing(
    tileCoordinate: Coordinate,
    tileGraph: TileGraph,
    playerTurn: PlayerType
  ) {
    const neighborTileCoordinates = [...tileGraph.getNeighbors(tileCoordinate)];

    const availableTilesToMoveKing: Tile[] = [];
    neighborTileCoordinates.forEach((neighborTileCoordinate) => {
      const neighborTile = tileGraph.getTileByVertex(neighborTileCoordinate);

      this.registerMoveAndCanAdvance(
        neighborTile,
        playerTurn,
        availableTilesToMoveKing
      );
    });

    return availableTilesToMoveKing;
  }

  getMovesForQueen(
    tileCoordinate: Coordinate,
    tileGraph: TileGraph,
    playerTurn: PlayerType
  ) {
    return [
      ...this.getMovesForBishop(
        {} as Tile,
        tileCoordinate,
        tileGraph,
        playerTurn
      ),
      ...this.getMovesForRook(
        {} as Tile,
        tileCoordinate,
        tileGraph,
        playerTurn
      ),
    ];
  }
}
