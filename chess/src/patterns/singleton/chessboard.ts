import { readonlyCoordinates } from "../../../data/coordinatesData";
import { Coordinate } from "../../../types/indexedAccessTypes";
import Tile from "../factory/tileFactory";

export default class Chessboard {
  static #instance: Chessboard | null = null;

  tile: Tile[] = [];

  private constructor() {
    readonlyCoordinates.forEach((coordinate) => {
      let tileColor: "white" | "black" = this.getTileColor(coordinate);

      const chessboardElement: HTMLDivElement | null =
        document.querySelector<HTMLDivElement>("#chess-board");

      if (!chessboardElement) throw new Error("Chessboard not found...");

      chessboardElement.insertAdjacentHTML(
        "beforeend",
        this.generateTileHTML(coordinate, tileColor)
      );
      const tileElement: HTMLDivElement | null =
        chessboardElement.querySelector(`#tile-${coordinate}`);

      if (!tileElement)
        throw new Error("Tile not found while Initializing Chessboard");

      this.tile.push(new Tile(coordinate, tileElement));
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
    coordinate: Coordinate,
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
