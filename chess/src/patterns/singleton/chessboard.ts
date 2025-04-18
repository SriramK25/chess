import Piece from "../factory/pieceFactory";
import Player from "../factory/playerFactory";
import Tile from "../factory/tileFactory";
import TileGraph from "./tileGraph";
import GameState from "./gameState";
import { PlayersData } from "../../types/mapTypes";
import { KingCoordinates } from "../../types/indexedAccessTypes";

export default class Chessboard {
  static #instance: Chessboard | null = null;

  #element = document.querySelector("#chess-board");
  #graph: TileGraph = new TileGraph();
  #tiles: Tile[] = [];
  #players: PlayersData;
  #game: GameState;
  #kingCoordinates: KingCoordinates;

  private constructor() {
    if (!this.#element) throw new Error("Chessboard not found");

    // Build Tiles
    Tile.spawn(this.#element, this.#tiles);

    // Place Pieces on the Board
    this.#kingCoordinates = Piece.spawn(this.#tiles);

    // Build Graph for Internal purpose
    this.#graph.initialise(this.#tiles);

    // Initialise Players
    this.#players = Player.initialisePlayers(this.#tiles);

    this.#game = GameState.getInstance();

    // Start the Game
    this.#game.start(
      this.#element,
      this.#graph,
      this.#players,
      this.#kingCoordinates
    );
  }

  static getInstance(): Chessboard {
    if (!this.#instance) this.#instance = new Chessboard();
    return this.#instance;
  }
}
