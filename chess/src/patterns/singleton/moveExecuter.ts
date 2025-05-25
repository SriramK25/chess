import Tile from "../factory/tileFactory";

export default class MoveExecuter {
  private static _instance: MoveExecuter | null = null;

  private constructor() {}

  static getInstance() {
    if (!this._instance) this._instance = new MoveExecuter();
    return this._instance;
  }

  executeMove(targetTile: Tile, previouslyFocusedTileWithPiece: Tile | null) {
    if (!targetTile || !previouslyFocusedTileWithPiece) return false;
    const targetTileHasPiece = targetTile.pieceData ? true : false;
    targetTile.getPieceFromAnotherTile(previouslyFocusedTileWithPiece, targetTileHasPiece);
  }
}
