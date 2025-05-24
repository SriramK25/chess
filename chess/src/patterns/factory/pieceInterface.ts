import { Coordinate } from "../../types/indexedAccessTypes";
import { PieceType, Player } from "../../types/unionTypes";
import Tile from "./tileFactory";

export default interface IPiece {
  belongsTo: Player;
  onTile: Coordinate;
  type: PieceType;
  hasCaptured: boolean;
  nextMove: Array<Tile[]>;
  startTile: Coordinate;
  hasMoved: boolean;
}
