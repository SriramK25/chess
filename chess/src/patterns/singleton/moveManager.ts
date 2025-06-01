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
  static _instance: MoveManager | null = null;
  private _moveGenerator = MoveGenerator.getInstance();
  private _moveExecuter = MoveExecuter.getInstance();
  private _moveFilter = MoveFilter.getInstance();

  private constructor() {}

  static getInstance() {
    if (!this._instance) this._instance = new MoveManager();
    return this._instance;
  }

  getMoves(pieceType: PieceType, coordinate: Coordinate, tileGraph: TileGraph): Array<Tile[]> {
    return this._moveGenerator.getMoves(pieceType, coordinate, tileGraph);
  }

  filterMoves(targetTile: Tile) {
    return this._moveFilter.filterMoves(targetTile);
  }

  executeMove(targetTile: Tile, previouslyFocusedTileWithPiece: Tile | null) {
    this._moveExecuter.executeMove(targetTile, previouslyFocusedTileWithPiece);
  }

  // Checks Whether a Piece (Like Queen, Bishop etc...) can able to Check the Opponent's King, but some other Pieces are on the Way blocking the Path, So Storing that in Internal States to Avoid Players Accidentally Moving such pieces that exposes their King to Check
  updateBlockers(piece: Piece, kingCoordinates: KingCoordinates, playerTurn: PlayerType) {
    if (piece && piece.type === "knight") return;

    const blockerPieces: Piece[] = [];

    for (let sides of piece.nextMove) {
      let sideIndex = sides.length - 1;
      let hasFoundKing = false;
      let hasTargetPieceTileIncluded = false;

      for (sideIndex; sideIndex >= 0; sideIndex--) {
        if (
          sides[sideIndex].getCoordinate() ===
          kingCoordinates[`${piece.belongsTo === "white" ? "black" : "white"}King`]
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

        if (tile.hasPiece) {
          tile.pieceData.blocking.set(piece.id, piece);
          blockerPieces.push(tile.pieceData);

          if (tile.pieceData.belongsTo !== playerTurn) {
            console.log(`${tile.pieceData.type} from ${tile.getCoordinate()}`, "is protecting king");
            tile.pieceData.isProtectingKingFromOpponentPiece = true;
          }
        }
      }
    }

    blockerPieces.forEach((blockerPiece) => {
      piece.blockerPieces.set(blockerPiece.id, blockerPiece);

      // Only One Piece is Protecting the King, So Making it Non-Movable
      if (blockerPieces.length < 2 && blockerPiece.belongsTo !== playerTurn) return;

      console.log("More than 1 Piece is Protecting King");
      // More than 1 Piece is Protecting King, So Making all the Pieces Movable
      blockerPiece.isProtectingKingFromOpponentPiece = false;
    });
  }

  // If the Moved Piece has Blocked the Path of opponent piece, then We Update that Opponent, because a Piece blocking its Way is moved and we need to Update it, so we can restrict to move the Last piece which is Protecting the King
  checkMovingBlockerThreatensKing(targetTile: Tile, kingCoordinates: KingCoordinates, tileGraph: TileGraph) {
    if (!targetTile.pieceData || !targetTile.pieceData.blocking.size) return;

    targetTile.pieceData.blocking.forEach((piece) => {
      this.updateBlockers(piece, kingCoordinates, piece.belongsTo);
      piece.blockerPieces.delete(targetTile.pieceData!.id);
    });

    targetTile.pieceData.blocking.clear();
  }
}
