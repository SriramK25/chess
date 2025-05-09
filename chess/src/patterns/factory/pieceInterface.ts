import { Coordinate } from "../../types/indexedAccessTypes";
import { PieceType, Player } from "../../types/unionTypes";
import Tile from "./tileFactory";

export default interface IPiece {
  belongsTo: Player;
  onTile: Coordinate;
  type: PieceType;
  hasCaptured: boolean;
  nextLatentMove: Array<Tile[]>;
  startTile: Coordinate;
  hasMoved: boolean;
}
