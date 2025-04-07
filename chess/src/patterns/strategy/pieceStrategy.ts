import IPiece from "../factory/pieceInterface";
import { Coordinate, Coordinates } from "../../../types/indexedAccessTypes";
import { Player, PieceType } from "../../../types/unionTypes";

export default class Piece implements IPiece {
  belongsTo!: Player;
  onTile!: Coordinate;
  type!: PieceType;
  hasCaptured!: boolean;
  visibility!: Set<Coordinates>;
  startTile!: Coordinate;
  hasMoved!: false;

  constructor(belongsTo: Player, pieceType: PieceType) {
    this.belongsTo = belongsTo;
    this.type = pieceType;

    this.hasCaptured = false;
    this.hasMoved = false;
  }
}
