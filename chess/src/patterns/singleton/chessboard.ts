import { Coordinates } from "../../../data/coordinatesData";
import Tile from "../factory/tileFactory";

export default class Chessboard {
  static #instance: Chessboard | null = null;

  tile: Tile[] = [];

  private constructor() {
    Coordinates.forEach((coordinate) => {
      let tileColor: "white" | "black" = this.getTileColor(coordinate);

      document
        .querySelector<HTMLDivElement>("#chess-board")
        ?.insertAdjacentHTML(
          "beforeend",
          this.generateTileHTML(coordinate, tileColor)
        );

      this.tile.push(new Tile(coordinate));
    });
  }

  private getTileColor(coordinate: string): "black" | "white" {
    const fileIndex = coordinate!.codePointAt(0);
    const rankIndex = +coordinate[1];

    if (!fileIndex)
      throw new Error("Coordinate Error while generating Tile Color");

    return (fileIndex + rankIndex) % 2 === 0 ? "black" : "white";
  }

  private generateTileHTML(
    coordinate: (typeof Coordinates)[number],
    tileColor: "black" | "white"
  ): string {
    return `<div id="tile-${coordinate}" class="tile ${tileColor}-tile"></div>`;
  }

  static getInstance(): Chessboard {
    if (this.#instance) return this.#instance;

    this.#instance = new Chessboard();
    return this.#instance;
  }
}
