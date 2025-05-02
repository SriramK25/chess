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
  id: string;
  belongsTo: Player;
  onTile: Coordinate;
  type: PieceType;
  hasCaptured: boolean;
  nextLatentMove: Array<Tile[]>;
  blockerPieces: Map<string, Piece> = new Map();
  blocking: Map<string, Piece> = new Map();
  startTile: Coordinate;
  hasMoved: boolean;
  hasPromotion: boolean;
  hasCastling: boolean;
  isProtectingKingFromOpponentLatentMove: boolean = false;
  targetingOpponentKingViaTiles: Set<Tile> = new Set();

  private constructor(
    belongsTo: Player,
    pieceType: PieceType,
    startTile: Coordinate,
    nextLatentMoves: Array<Tile[]>
  ) {
    this.id = crypto.randomUUID();
    this.belongsTo = belongsTo;
    this.onTile = startTile;
    this.type = pieceType;
    this.hasCaptured = false;
    this.nextLatentMove = nextLatentMoves;
    this.startTile = startTile;
    this.hasMoved = false;
    this.hasPromotion = pieceType === "pawn";
    this.hasCastling = pieceType === "rook";
  }

  // Setting Pieces on the Board and Updating the Internal States of Tile
  static spawn(
    tiles: Tile[],
    gameState: GameState,
    tileGraph: TileGraph
  ): KingCoordinates {
    let kingCoordinates: KingCoordinates = {} as KingCoordinates;

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

          const nextLatentMove = gameState.getMovesForPiece(
            piece,
            tileCoordinate,
            tileGraph
          );

          tile.pieceData = new Piece(
            player,
            piece,
            tileCoordinate,
            nextLatentMove
          );

          if (piece === "king")
            kingCoordinates[`${player}King`] = tileCoordinate;
        });
      });
    });

    return kingCoordinates;
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
