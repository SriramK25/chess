import IPiece from "../factory/pieceInterface";
import { Coordinate } from "../../types/indexedAccessTypes";
import { Player, PieceType } from "../../types/unionTypes";
import { pieces } from "../../../data/pieceType";
import { players } from "../../../data/playerType";
import { pieceStartTile } from "../../../data/pieceStartTileData";
import Tile from "./tileFactory";
import svg from "../../utils/defaultPieceSVGImporter";

export default class Piece implements IPiece {
  belongsTo!: Player;
  onTile!: Coordinate;
  type!: PieceType;
  hasCaptured!: boolean;
  visibility!: Set<Coordinate>;
  startTile!: Coordinate;
  hasMoved!: false;

  constructor(
    belongsTo: Player,
    onTile: Coordinate,
    pieceType: PieceType,
    startTile: Coordinate
  ) {
    this.belongsTo = belongsTo;
    this.onTile = onTile;
    this.type = pieceType;
    this.hasCaptured = false;
    this.visibility = new Set(["a1"]);
    this.startTile = startTile;
    this.hasMoved = false;
  }

  static spawn(tiles: Tile[]) {
    players.forEach((player) => {
      pieces.forEach((piece) => {
        pieceStartTile[player][piece].forEach((startTile) => {
          const tile = tiles.find((tile) => tile.getCoordinate() === startTile);
          if (!tile) throw new Error("Error occured while Spawning Pieces");

          tile.hasPiece = true;
          tile.player = player;
          tile.element.insertAdjacentHTML(
            "beforeend",
            this.getPiece(player, piece)
          );
          // Have to Implement
          //tile.pieceData = {};
        });
      });
    });
  }

  private static getPiece(player: Player, pieceType: PieceType): string {
    const chessPiece = svg[`${player}_${pieceType}`];
    return `<img id="${player}-${pieceType}-piece" src="${chessPiece}" alt="${pieceType}" />`;
  }
}
