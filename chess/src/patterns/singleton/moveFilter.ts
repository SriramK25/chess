import { Coordinate } from "../../types/indexedAccessTypes";
import Tile from "../factory/tileFactory";

export default class MoveFilter {
  private static _instance: MoveFilter | null = null;

  private constructor() {}

  static getInstance() {
    if (!this._instance) this._instance = new MoveFilter();
    return this._instance;
  }

  private _getSafeMovesForKing(targetTile: Tile): Array<Tile[]> {
    if (!targetTile || !targetTile.pieceData) throw new Error("Error Occured While getting Safe moves for King");

    const newLatentMove: Array<Tile[]> = [];

    for (let nextMoveSide of targetTile.pieceData.nextMove) {
      // With this If we only Check Empty Tiles
      if (nextMoveSide[0].hasPiece) continue;

      const piecesTargetingNextMoveTileOfKing = Array.from(
        nextMoveSide[0].piecesTargetingThisTile.values()
      ).filter((piece) => piece.belongsTo !== targetTile.pieceData?.belongsTo);

      if (!piecesTargetingNextMoveTileOfKing.length) {
        newLatentMove.push([nextMoveSide[0]]);
        continue;
      }

      const newLatentMoveSide: Tile[] = [];
      let isSafeTile = true;

      isSafeTile = piecesTargetingNextMoveTileOfKing.some((piece) => piece.blockerPieces.size);

      isSafeTile = piecesTargetingNextMoveTileOfKing.some((piece) => {
        const kingSideMoves = piece.nextMove.find((tiles) =>
          tiles.some((tile) => tile.getCoordinate() === nextMoveSide[0].getCoordinate())
        );
        if (!kingSideMoves || !kingSideMoves.length) return false;

        for (let tile of kingSideMoves) {
          if (tile.getCoordinate() === nextMoveSide[0].getCoordinate()) break;
          if (tile.hasPiece) return true;
        }
      });

      isSafeTile && newLatentMoveSide.push(nextMoveSide[0]);

      newLatentMove.push(newLatentMoveSide);
    }

    return newLatentMove;
  }

  private _getSafeMovesForBlocker(targetTile: Tile): Array<Tile[]> {
    if (!targetTile || !targetTile.pieceData) throw new Error("Cannot Get Safe Moves");

    const filteredMove: Array<Tile[]> = [];
    const opponentPieceTargetingKingCoordinates: Set<Coordinate> = new Set();

    targetTile.piecesTargetingThisTile.forEach((piece) => {
      const filteredSide = piece.nextMove.find((side) =>
        side.some((tile) => tile.getCoordinate() === targetTile.getCoordinate())
      );

      if (!filteredSide) return;

      filteredSide.forEach((tile) => opponentPieceTargetingKingCoordinates.add(tile.getCoordinate()));
      opponentPieceTargetingKingCoordinates.add(piece.onTile);
    });

    for (let sides of targetTile.pieceData.nextMove) {
      const filteredTilesForThisSide: Tile[] = [];

      sides.forEach((tile) => {
        opponentPieceTargetingKingCoordinates.has(tile.getCoordinate()) && filteredTilesForThisSide.push(tile);
      });

      filteredMove.push(filteredTilesForThisSide);
    }

    return filteredMove;
  }

  filterMoves(targetTile: Tile): Array<Tile[]> {
    if (!targetTile || !targetTile.pieceData) return [];
    if (targetTile.pieceData.type === "king") return this._getSafeMovesForKing(targetTile);
    return this._getSafeMovesForBlocker(targetTile);
  }
}
