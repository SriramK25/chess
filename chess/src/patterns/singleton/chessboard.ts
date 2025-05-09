import Piece from "../factory/pieceFactory";
import Player from "../factory/playerFactory";
import Tile from "../factory/tileFactory";
import TileGraph from "./tileGraph";
import GameState from "./gameState";
import { PlayersData } from "../../types/mapTypes";
import { Coordinate, KingCoordinates } from "../../types/indexedAccessTypes";

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

    // Create Game States and Everything for Internal Purpose
    this.#game = GameState.getInstance();

    // Build Tiles
    Tile.spawn(this.#element, this.#tiles);

    // Build Graph for Internal purpose
    this.#graph.initialise(this.#tiles);

    // Place Pieces on the Board
    this.#kingCoordinates = Piece.spawn(this.#tiles, this.#game, this.#graph);

    // Initialise Players
    this.#players = Player.initialisePlayers(this.#tiles);

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

  // For Debugging -- Remove Later --
  getTileData(tile: Coordinate) {
    return this.#graph.getTileByVertex(tile);
  }
}
