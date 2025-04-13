import { players as readonlyPlayers } from "../../../data/playerType";
import { Coordinate } from "../../types/indexedAccessTypes";
import { Player as PlayerType } from "../../types/unionTypes";
import Tile from "./tileFactory";

export default class Player {
  name: PlayerType;
  piecesOnTiles: Set<Coordinate>;
  hasDoneCastling = false;
  hasKingInCheck = false;

  static players: Map<PlayerType, Player> | null = null;

  private constructor(name: PlayerType, piecesOnTile: Set<Coordinate>) {
    this.name = name;
    this.piecesOnTiles = piecesOnTile;
  }

  static initialisePlayers(tiles: Tile[]): Map<PlayerType, Player> {
    if (this.players) return this.players;

    let players: Map<PlayerType, Player> = new Map();

    readonlyPlayers.forEach((player) => {
      const playerHasPiecesOnTiles = tiles
        .filter((tile) => tile.hasPiece && tile.pieceData?.belongsTo === player)
        .map((tile) => tile.getCoordinate());

      players.set(player, new Player(player, new Set(playerHasPiecesOnTiles)));
    });
    this.players = players;
    return players;
  }
}
