import { Coordinates } from "../../../data/coordinatesData";
import Tile from "../factory/tileFactory";

class Chessboard {
  static #instance: Chessboard | null = null;

  tile: Tile[] = [];

  private constructor() {
    Coordinates.forEach((coordinate, _) => {
      this.tile.push(new Tile(coordinate));
    });
  }

  static getInstance(): Chessboard {
    if (this.#instance) return this.#instance;

    this.#instance = new Chessboard();
    return this.#instance;
  }
}

const chessboard = Chessboard.getInstance();

console.log(chessboard);
