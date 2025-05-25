import { Coordinate, KingCoordinates } from "../../types/indexedAccessTypes";
import { PieceType, Player as PlayerType } from "../../types/unionTypes";
import Piece from "../factory/pieceFactory";
import Tile from "../factory/tileFactory";
import MoveExecuter from "./moveExecuter";
import MoveGenerator from "./moveGenerator";
import TileGraph from "./tileGraph";

// This Class is responsible for Calculating Moves for the Selected Piece by Player
export default class MoveManager {
  static #instance: MoveManager | null = null;
  private _moveGenerator = MoveGenerator.getInstance();
  private _moveExecuter = MoveExecuter.getInstance();

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

  executeMove(targetTile: Tile, previouslyFocusedTileWithPiece: Tile | null) {
    this._moveExecuter.executeMove(targetTile, previouslyFocusedTileWithPiece);
  }

  // Checks Whether a Piece (Like Queen, Bishop etc...) can able to Check the Opponent's King, but some other Pieces are on the Way blocking the Path, So Storing that in Internal States to Avoid Players Accidentally Moving such pieces that exposes their King to Check
  threatensKingOnNextMove(
    targetPiece: Piece,
    kingCoordinates: KingCoordinates,
    playerTurn: PlayerType,
    tileGraph: TileGraph
  ) {
    const potentialBlockerTiles: Tile[] = [];

    for (let latentMoveTiles of targetPiece.nextMove) {
      let latentMoveTileIndex = latentMoveTiles.length - 1;
      let hasFoundKing = false;
      let hasTargetPieceTileIncluded = false;

      for (latentMoveTileIndex; latentMoveTileIndex >= 0; latentMoveTileIndex--) {
        if (
          latentMoveTiles[latentMoveTileIndex].getCoordinate() ===
          kingCoordinates[`${playerTurn === "white" ? "black" : "white"}King`]
        ) {
          hasFoundKing = true;
          continue;
        }

        if (!hasFoundKing) continue;

        let tile = latentMoveTiles[latentMoveTileIndex];

        if (!hasTargetPieceTileIncluded) {
          hasTargetPieceTileIncluded = true;
        }

        if (tile.hasPiece) {
          tile.pieceData?.blocking.set(targetPiece.id, targetPiece);
          tile.pieceData!.isProtectingKingFromOpponentPiece =
            tile.pieceData?.belongsTo !== playerTurn ? true : false;
          potentialBlockerTiles.push(tile);
        }
      }
    }

    if (potentialBlockerTiles.length > 1) {
      potentialBlockerTiles.forEach((blockerTile) => {
        blockerTile.pieceData!.isProtectingKingFromOpponentPiece = false;
      });
    }

    potentialBlockerTiles.map((blockerTile) =>
      targetPiece.blockerPieces.set(blockerTile.pieceData!.id, blockerTile.pieceData!)
    );
  }

  checkMovingBlockerThreatensKing(targetTile: Tile, kingCoordinates: KingCoordinates, tileGraph: TileGraph) {
    if (
      !targetTile.pieceData ||
      !targetTile.pieceData.blocking.size
      // && !targetTile.piecesTargetingKingViaThisTile.size
    )
      return;

    // If the Moved Piece has Blocked the Path of opponent piece, then We Update that Opponent Piece's Latent Check, because a Piece blocking its Way is moved and we need to Update it, so we can restrict to move the Last piece which is Protecting the King
    targetTile.pieceData.blocking.forEach((piece) => {
      this.threatensKingOnNextMove(piece, kingCoordinates, piece.belongsTo, tileGraph);
      piece.blockerPieces.delete(targetTile.pieceData!.id);
    });

    targetTile.pieceData.blocking.clear();
  }
}
