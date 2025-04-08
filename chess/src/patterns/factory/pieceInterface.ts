import { Coordinate } from "../../types/indexedAccessTypes";
import { PieceType, Player } from "../../types/unionTypes";

export default interface IPiece {
  belongsTo: Player;
  onTile: Coordinate;
  type: PieceType;
  hasCaptured: boolean;
  visibility: Set<Coordinate>;
  startTile: Coordinate;
  hasMoved: boolean;
}
