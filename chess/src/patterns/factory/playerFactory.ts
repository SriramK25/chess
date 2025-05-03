import { players as readonlyPlayers } from "../../../data/playerType";
import { Player as PlayerType } from "../../types/unionTypes";
import Piece from "./pieceFactory";
import Tile from "./tileFactory";

export default class Player {
  name: PlayerType;
  piecesOnBoard: Piece[];
  hasDoneCastling = false;
  hasKingInCheck = false;

  static players: Map<PlayerType, Player> | null = null;

  private constructor(name: PlayerType, piecesOnBoard: Piece[]) {
    this.name = name;
    this.piecesOnBoard = piecesOnBoard;
  }

  static initialisePlayers(tiles: Tile[]): Map<PlayerType, Player> {
    if (this.players) return this.players;

    let players: Map<PlayerType, Player> = new Map();

    readonlyPlayers.forEach((player) => {
      const playerHasPiecesOnBoard = tiles
        .filter(
          (tile): tile is typeof tile & { pieceData: Piece } =>
            tile.hasPiece &&
            tile.pieceData !== null &&
            tile.pieceData.belongsTo === player
        )
        .map((tile) => tile.pieceData);

      players.set(player, new Player(player, playerHasPiecesOnBoard));
    });
    this.players = players;
    return players;
  }
}
