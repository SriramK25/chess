import Piece from "../factory/pieceFactory";
import Tile from "../factory/tileFactory";
import { TileGraph } from "./tileGraph";

export default class Chessboard {
  static #instance: Chessboard | null = null;
  #graph: TileGraph = new TileGraph();
  tiles: Tile[] = [];

  private constructor() {
    Tile.spawn(this.tiles);

    Piece.spawn(this.tiles);

    this.#graph.initialise(this.tiles);

    // console.log(this.#graph);
  }

  static getInstance(): Chessboard {
    if (this.#instance) return this.#instance;

    this.#instance = new Chessboard();
    return this.#instance;
  }
}
