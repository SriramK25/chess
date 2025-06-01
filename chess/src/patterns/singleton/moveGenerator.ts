import { BOARD } from "../../rules/indexRules";
import { Coordinate } from "../../types/indexedAccessTypes";
import { PieceType, Player } from "../../types/unionTypes";
import Tile from "../factory/tileFactory";
import TileGraph from "./tileGraph";

// Generate Initial Moves when Game Starts and Next Moves for the Moved Piece
export default class MoveGenerator {
  private static _instance: MoveGenerator | null = null;

  private constructor() {}

  static getInstance(): MoveGenerator {
    if (!this._instance) this._instance = new MoveGenerator();
    return this._instance;
  }

  private _decideStartingCoordinateForRook(
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
      seed: onCoordinate.charCodeAt(0) + 1 === neighborTileCoordinate[0].charCodeAt(0) ? 1 : -1,
    };
  }

  private *_generateCoordinateForRook(
    iterableIndex: number,
    bindingIndex: string,
    indexName: "file" | "rank",
    seed: number
  ) {
    const maxIndex = indexName === "file" ? BOARD.END_FILE_INDEX : BOARD.END_RANK_INDEX;
    const minIndex = indexName === "file" ? BOARD.START_FILE_INDEX : BOARD.START_RANK_INDEX;

    for (iterableIndex; seed > 0 ? iterableIndex <= maxIndex : iterableIndex >= minIndex; iterableIndex += seed) {
      yield indexName === "file"
        ? `${String.fromCharCode(iterableIndex)}${bindingIndex}`
        : `${bindingIndex}${iterableIndex}`;
    }
  }

  private _getDiagonalsForBishop(
    previousTileCoordinate: Coordinate,
    tileCoordinate: Coordinate,
    tileGraph: TileGraph
  ): Coordinate[] {
    const diagonalCoordinates = [...tileGraph.getNeighbors(tileCoordinate)].filter(
      (diagonalCoordinate) =>
        diagonalCoordinate[0] !== tileCoordinate[0] &&
        diagonalCoordinate[1] !== tileCoordinate[1] &&
        diagonalCoordinate[0] !== previousTileCoordinate[0] &&
        diagonalCoordinate[1] !== previousTileCoordinate[1]
    );

    if (diagonalCoordinates.length) {
      diagonalCoordinates.map((diagonalCoordinate) => {
        diagonalCoordinates.push(...this._getDiagonalsForBishop(tileCoordinate, diagonalCoordinate, tileGraph));
      });
    }

    return diagonalCoordinates;
  }

  private _getMovesForPawn(tileCoordinate: Coordinate, tileGraph: TileGraph): Array<Tile[]> {
    const targetTile = tileGraph.getTileByVertex(tileCoordinate);

    const neighborTiles: Coordinate[] = [...tileGraph.getNeighbors(tileCoordinate)];

    const nextTileRankIndex =
      targetTile.player === "white"
        ? (Number(tileCoordinate[1]) + 1).toString()
        : (Number(tileCoordinate[1]) - 1).toString();

    const availableTilesToMovePawn: Array<Tile[]> = [[], [], []];

    const availableMoves = neighborTiles.filter((neighborTile) => neighborTile[1] === nextTileRankIndex);

    availableMoves.forEach((move, index) => {
      if (tileCoordinate[0] === move[0]) {
        const straightTile = tileGraph.getTileByVertex(move);
        straightTile && availableTilesToMovePawn[0].push(straightTile);
      }

      if (tileCoordinate[0] === move[0] && !targetTile.pieceData?.hasMoved) {
        const secondStraightRankIndex = Number(nextTileRankIndex) + (targetTile.player === "white" ? 1 : -1);

        const secondStraightTile = tileGraph.getTileByVertex(`${move[0]}${secondStraightRankIndex}` as Coordinate);

        secondStraightTile && availableTilesToMovePawn[0].push(secondStraightTile);
      }

      if (tileCoordinate[0] !== move[0]) {
        const diagonalTile = tileGraph.getTileByVertex(move);
        diagonalTile && availableTilesToMovePawn[!index ? index + 1 : index].push(diagonalTile);
      }
    });

    return availableTilesToMovePawn;
  }

  private _getMovesForKnight(tileCoordinate: Coordinate, tileGraph: TileGraph): Array<Tile[]> {
    const neighborTiles: Coordinate[] = [...tileGraph.getNeighbors(tileCoordinate)].filter(
      (neighborTile) => neighborTile[0] === tileCoordinate[0] || neighborTile[1] === tileCoordinate[1]
    );

    const playerTurn = tileGraph.getTileByVertex(tileCoordinate).player;
    const neighborTilesAsSet = new Set(neighborTiles);
    const availableTilesToMoveKnight: Array<Tile[]> = [];

    neighborTiles.forEach((tile, index) => {
      const neighborsOfNeighborTile = [...tileGraph.getNeighbors(tile)].filter(
        (neighborTile) => neighborTile[0] !== tile[0] && neighborTile[1] !== tile[1]
      );

      availableTilesToMoveKnight.push([]);

      neighborsOfNeighborTile.forEach((neighborTile) => {
        const tile = tileGraph.getTileByVertex(neighborTile);
        !neighborTilesAsSet.has(neighborTile) && availableTilesToMoveKnight[index].push(tile);
      });
    });

    return availableTilesToMoveKnight;
  }

  private _getMovesForBishop(tileCoordinate: Coordinate, tileGraph: TileGraph): Array<Tile[]> {
    const neighborTiles: Coordinate[] = [...tileGraph.getNeighbors(tileCoordinate)].filter(
      (neighborTile) => neighborTile[0] !== tileCoordinate[0] && neighborTile[1] !== tileCoordinate[1]
    );

    const availableTilesToMoveBishop: Array<Tile[]> = [];

    neighborTiles.forEach((neighborTileCoordinate, index) => {
      const neighborTile = tileGraph.getTileByVertex(neighborTileCoordinate);

      availableTilesToMoveBishop.push([neighborTile]);

      const diagonalTileCoordinates = this._getDiagonalsForBishop(
        tileCoordinate,
        neighborTileCoordinate,
        tileGraph
      );

      for (const diagonalTileCoordinate of diagonalTileCoordinates) {
        const diagonalTile = tileGraph.getTileByVertex(diagonalTileCoordinate);

        availableTilesToMoveBishop[index].push(diagonalTile);
      }
    });

    return availableTilesToMoveBishop;
  }

  private _getMovesForRook(tileCoordinate: Coordinate, tileGraph: TileGraph): Array<Tile[]> {
    const neighborTiles: Coordinate[] = [...tileGraph.getNeighbors(tileCoordinate)].filter(
      (neighborTile) => neighborTile[0] === tileCoordinate[0] || neighborTile[1] === tileCoordinate[1]
    );

    const availableTilesToMoveRook: Array<Tile[]> = [];

    neighborTiles.forEach((neighborTileCoordinate, index) => {
      availableTilesToMoveRook.push([]);

      const { iterableIndex, bindingIndex, indexName, seed } = this._decideStartingCoordinateForRook(
        tileCoordinate,
        neighborTileCoordinate
      );

      for (const coordinate of this._generateCoordinateForRook(iterableIndex, bindingIndex, indexName, seed)) {
        const tile = tileGraph.getTileByVertex(coordinate as Coordinate);
        availableTilesToMoveRook[index].push(tile);
      }
    });

    return availableTilesToMoveRook;
  }

  private _getMovesForKing(tileCoordinate: Coordinate, tileGraph: TileGraph): Array<Tile[]> {
    const neighborTileCoordinates = [...tileGraph.getNeighbors(tileCoordinate)];

    const availableTilesToMoveKing: Array<Tile[]> = [];
    neighborTileCoordinates.forEach((neighborTileCoordinate) => {
      const neighborTile = tileGraph.getTileByVertex(neighborTileCoordinate);
      availableTilesToMoveKing.push([neighborTile]);
    });

    return availableTilesToMoveKing;
  }

  private _getMovesForQueen(tileCoordinate: Coordinate, tileGraph: TileGraph): Array<Tile[]> {
    return [
      ...this._getMovesForBishop(tileCoordinate, tileGraph),
      ...this._getMovesForRook(tileCoordinate, tileGraph),
    ];
  }

  getMoves(pieceType: PieceType, coordinate: Coordinate, tileGraph: TileGraph): Array<Tile[]> {
    const generator: Record<PieceType, () => Array<Tile[]>> = {
      pawn: () => this._getMovesForPawn(coordinate, tileGraph),
      knight: () => this._getMovesForKnight(coordinate, tileGraph),
      bishop: () => this._getMovesForBishop(coordinate, tileGraph),
      rook: () => this._getMovesForRook(coordinate, tileGraph),
      queen: () => this._getMovesForQueen(coordinate, tileGraph),
      king: () => this._getMovesForKing(coordinate, tileGraph),
    };

    return generator[pieceType]() ?? [];
  }
}
