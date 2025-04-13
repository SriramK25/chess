import IPiece from "../factory/pieceInterface";
import { Coordinate } from "../../types/indexedAccessTypes";
import { Player, PieceType } from "../../types/unionTypes";
import { pieces } from "../../../data/pieceType";
import { players } from "../../../data/playerType";
import { pieceStartTile } from "../../../data/pieceStartTileData";
import Tile from "./tileFactory";
import svg from "../../utils/defaultPieceSVGImporter";

export default class Piece implements IPiece {
  id: string;
  belongsTo: Player;
  onTile: Coordinate;
  type: PieceType;
  hasCaptured: boolean;
  visibility: Set<Coordinate>;
  startTile: Coordinate;
  hasMoved: boolean = false;
  hasPromotion: boolean;
  hasCastling: boolean;

  private constructor(
    belongsTo: Player,
    onTile: Coordinate,
    pieceType: PieceType,
    startTile: Coordinate
  ) {
    this.id = crypto.randomUUID();
    this.belongsTo = belongsTo;
    this.onTile = onTile;
    this.type = pieceType;
    this.hasCaptured = false;
    this.visibility = new Set(["a1"]);
    this.startTile = startTile;
    this.hasMoved = false;
    this.hasPromotion = pieceType === "pawn";
    this.hasCastling = pieceType === "rook";
  }

  // Setting Pieces on the Board and Updating the Internal States of Tile
  static spawn(tiles: Tile[]) {
    players.forEach((player) => {
      pieces.forEach((piece) => {
        pieceStartTile[player][piece].forEach((startTile) => {
          const tile = tiles.find((tile) => tile.getCoordinate() === startTile);
          if (!tile) throw new Error("Error occured while Spawning Pieces");

          const tileCoordinate = tile.getCoordinate();

          tile.hasPiece = true;
          tile.player = player;
          tile.element.insertAdjacentHTML(
            "beforeend",
            this.generatePiece(player, piece, tileCoordinate)
          );
          tile.pieceData = new Piece(
            player,
            tileCoordinate,
            piece,
            tileCoordinate
          );
        });
      });
    });
  }

  // Binds SVG to the <img /> tag and returns that as String
  private static generatePiece(
    player: Player,
    pieceType: PieceType,
    coordinate: Coordinate
  ): string {
    const chessPiece = svg[`${player}_${pieceType}`];
    return `<img id="${player}-${pieceType}-piece" src="${chessPiece}" alt="${player}-${pieceType}" data-playable-by="${player}" data-piece="${pieceType}" data-on-coordinate="${coordinate}" />`;
  }
}
