import { Coordinates } from "../../../data/coordinatesData";

export default interface Piece {
  belongsTo: "white" | "black";
  onTile: (typeof Coordinates)[number];
  type: "king" | "queen" | "bishop" | "knight" | "rook" | "pawn";
  hasCaptured: boolean;
  visibility: typeof Coordinates;
}
