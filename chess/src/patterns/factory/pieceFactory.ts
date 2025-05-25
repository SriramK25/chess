import IPiece from "../factory/pieceInterface";
import { Coordinate, KingCoordinates } from "../../types/indexedAccessTypes";
import { Player, PieceType } from "../../types/unionTypes";
import { pieces } from "../../../data/pieceType";
import { players } from "../../../data/playerType";
import { pieceStartTile } from "../../../data/pieceStartTileData";
import Tile from "./tileFactory";
import svg from "../../utils/defaultPieceSVGImporter";
import TileGraph from "../singleton/tileGraph";
import GameState from "../singleton/gameState";

export default class Piece implements IPiece {
  readonly id: string;
  readonly belongsTo: Player;
  readonly type: PieceType;
  readonly startTile: Coordinate;

  hasMoved: boolean;
  hasPromotion: boolean;
  hasCastling: boolean;
  hasCaptured: boolean;
  isProtectingKingFromOpponentPiece: boolean = false;

  onTile: Coordinate;

  nextMove: Array<Tile[]>;
  blockerPieces: Map<string, Piece> = new Map();
  blocking: Map<string, Piece> = new Map();

  private constructor(belongsTo: Player, pieceType: PieceType, startTile: Coordinate, nextMoves: Array<Tile[]>) {
    this.id = `${belongsTo}-${pieceType}-${crypto.randomUUID()}`;
    this.belongsTo = belongsTo;
    this.onTile = startTile;
    this.type = pieceType;
    this.hasCaptured = false;
    this.nextMove = nextMoves;
    this.startTile = startTile;
    this.hasMoved = false;
    this.hasPromotion = pieceType === "pawn";
    this.hasCastling = pieceType === "rook";
  }

  // Setting Pieces on the Board and Updating the Internal States of Tile
  static spawn(tiles: Tile[], gameState: GameState, tileGraph: TileGraph): KingCoordinates {
    let kingCoordinates: KingCoordinates = {} as KingCoordinates;

    players.forEach((player) => {
      pieces.forEach((piece) => {
        pieceStartTile[player][piece].forEach((startTile) => {
          const tile = tiles.find((tile) => tile.getCoordinate() === startTile);

          if (!tile) throw new Error("Error occured while Spawning Pieces");

          const tileCoordinate = tile.getCoordinate();
          const movesForThisPiece = gameState.getMoves(piece, tileCoordinate, tileGraph);

          tile.hasPiece = true;
          tile.player = player;
          tile.element.insertAdjacentHTML("beforeend", this._generatePiece(player, piece, tileCoordinate));
          tile.pieceData = new Piece(player, piece, tileCoordinate, movesForThisPiece);

          if (piece === "king") kingCoordinates[`${player}King`] = tileCoordinate;
        });
      });
    });

    return kingCoordinates;
  }

  static updateState() {}

  // Binds SVG to the <img /> tag and returns that as String
  private static _generatePiece(player: Player, pieceType: PieceType, coordinate: Coordinate): string {
    const chessPiece = svg[`${player}_${pieceType}`];
    return `<img id="${player}-${pieceType}-piece" src="${chessPiece}" alt="${player}-${pieceType}" data-playable-by="${player}" data-piece="${pieceType}" data-on-coordinate="${coordinate}" />`;
  }
}
