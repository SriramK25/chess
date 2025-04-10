import Piece from "../factory/pieceFactory";
import Player from "../factory/playerFactory";
import Tile from "../factory/tileFactory";
import TileGraph from "./tileGraph";
import { Player as PlayerType } from "../../types/unionTypes";

export default class Chessboard {
  static #instance: Chessboard | null = null;
  #graph: TileGraph = new TileGraph();
  #tiles: Tile[] = [];
  #players!: Map<PlayerType, Player>;

  private constructor() {
    Tile.spawn(this.#tiles);

    Piece.spawn(this.#tiles);

    this.#graph.initialise(this.#tiles);

    this.#players = Player.initialisePlayers(this.#tiles);
  }

  static getInstance(): Chessboard {
    if (this.#instance) return this.#instance;

    this.#instance = new Chessboard();
    return this.#instance;
  }
}
