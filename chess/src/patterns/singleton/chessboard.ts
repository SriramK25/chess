import GameState from "./gameState";
import Player from "../factory/playerFactory";
import Piece from "../factory/pieceFactory";
import Tile from "../factory/tileFactory";
import TileGraph from "./tileGraph";
import { Coordinate, KingCoordinates } from "../../types/indexedAccessTypes";
import { PlayersData } from "../../types/mapTypes";

export default class Chessboard {
  private static _instance: Chessboard | null = null;

  private _element: HTMLElement | null = document.querySelector("#chess-board");
  private _graph: TileGraph = new TileGraph();
  private _tiles: Tile[] = [];
  private _players: PlayersData;
  private _game: GameState;
  private _kingCoordinates: KingCoordinates;

  private constructor() {
    if (!this._element) throw new Error("Chessboard not found");

    // Create Game States and Everything for Internal Purpose
    this._game = GameState.getInstance();

    // Build Tiles
    Tile.spawn(this._element, this._tiles);

    // Build Graph for Internal purpose
    this._graph.initialise(this._tiles);

    // Place Pieces on the Board
    this._kingCoordinates = Piece.spawn(this._tiles, this._game, this._graph);

    // Initialise Players
    this._players = Player.initialisePlayers(this._tiles);

    // Start the Game
    this._game.start(this._element, this._graph, this._players, this._kingCoordinates);
  }

  static getInstance(): Chessboard {
    if (!this._instance) this._instance = new Chessboard();
    return this._instance;
  }

  // For Debugging -- Remove Later --
  getTileData(tile: Coordinate) {
    return this._graph.getTileByVertex(tile);
  }
}
