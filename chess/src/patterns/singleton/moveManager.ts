import { Coordinate, KingCoordinates } from "../../types/indexedAccessTypes";
import { PieceType, Player as PlayerType } from "../../types/unionTypes";
import Piece from "../factory/pieceFactory";
import Tile from "../factory/tileFactory";
import MoveExecuter from "./moveExecuter";
import MoveFilter from "./moveFilter";
import MoveGenerator from "./moveGenerator";
import TileGraph from "./tileGraph";

// This Class is responsible for Calculating Moves for the Selected Piece by Player
export default class MoveManager {
  static #instance: MoveManager | null = null;
  private _moveGenerator = MoveGenerator.getInstance();
  private _moveExecuter = MoveExecuter.getInstance();
  private _moveFilter = MoveFilter.getInstance();

  private constructor() {}

  static getInstance() {
    if (!this.#instance) this.#instance = new MoveManager();
    return this.#instance;
  }

  getMoves(pieceType: PieceType, coordinate: Coordinate, tileGraph: TileGraph): Array<Tile[]> {
    let availableTilesToMovePiece: Array<Tile[]> = [];

    switch (pieceType) {
      case "pawn": {
        availableTilesToMovePiece = this._moveGenerator.getMovesForPawn(coordinate, tileGraph);
        break;
      }

      case "king": {
        availableTilesToMovePiece = this._moveGenerator.getMovesForKing(coordinate, tileGraph);
        break;
      }

      case "queen": {
        availableTilesToMovePiece = this._moveGenerator.getMovesForQueen(coordinate, tileGraph);
        break;
      }

      case "bishop": {
        availableTilesToMovePiece = this._moveGenerator.getMovesForBishop(coordinate, tileGraph);
        break;
      }

      case "knight": {
        availableTilesToMovePiece = this._moveGenerator.getMovesForKnight(coordinate, tileGraph, this.playerTurn);
        break;
      }

      case "rook": {
        availableTilesToMovePiece = this._moveGenerator.getMovesForRook(coordinate, tileGraph);
        break;
      }
    }

    return availableTilesToMovePiece;
  }

  filterMoves(targetTile: Tile) {
    return this._moveFilter.filterMoves(targetTile);
  }

  executeMove(targetTile: Tile, previouslyFocusedTileWithPiece: Tile | null) {
    this._moveExecuter.executeMove(targetTile, previouslyFocusedTileWithPiece);
  }

  // Checks Whether a Piece (Like Queen, Bishop etc...) can able to Check the Opponent's King, but some other Pieces are on the Way blocking the Path, So Storing that in Internal States to Avoid Players Accidentally Moving such pieces that exposes their King to Check
  threatensKingOnNextMove(piece: Piece, kingCoordinates: KingCoordinates, playerTurn: PlayerType) {
    const blockerPieces: Piece[] = [];

    for (let sides of piece.nextMove) {
      let sideIndex = sides.length - 1;
      let hasFoundKing = false;
      let hasTargetPieceTileIncluded = false;

      for (sideIndex; sideIndex >= 0; sideIndex--) {
        if (
          sides[sideIndex].getCoordinate() === kingCoordinates[`${playerTurn === "white" ? "black" : "white"}King`]
        ) {
          hasFoundKing = true;
          continue;
        }

        if (!hasFoundKing) continue;

        let tile = sides[sideIndex];

        if (!tile.pieceData) continue;

        if (!hasTargetPieceTileIncluded) {
          hasTargetPieceTileIncluded = true;
        }

        if (tile.hasPiece && tile.pieceData.belongsTo !== playerTurn) {
          tile.pieceData.blocking.set(piece.id, piece);
          tile.pieceData.isProtectingKingFromOpponentPiece = true;
          blockerPieces.push(tile.pieceData);
        }
      }
    }

    blockerPieces.forEach((blockerPiece) => {
      piece.blockerPieces.set(blockerPiece.id, blockerPiece);

      // Only One Piece is Protecting the King, So Making it Non-Movable
      if (blockerPieces.length < 2) return;

      // More than 1 Piece is Protecting King, So Making all the Pieces Movable
      blockerPiece.isProtectingKingFromOpponentPiece = false;
    });
  }

  checkMovingBlockerThreatensKing(targetTile: Tile, kingCoordinates: KingCoordinates, tileGraph: TileGraph) {
    if (!targetTile.pieceData || !targetTile.pieceData.blocking.size) return;

    // If the Moved Piece has Blocked the Path of opponent piece, then We Update that Opponent Piece's Latent Check, because a Piece blocking its Way is moved and we need to Update it, so we can restrict to move the Last piece which is Protecting the King
    targetTile.pieceData.blocking.forEach((piece) => {
      this.threatensKingOnNextMove(piece, kingCoordinates, piece.belongsTo);
      piece.blockerPieces.delete(targetTile.pieceData!.id);
    });

    targetTile.pieceData.blocking.clear();
  }
}
