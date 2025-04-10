import { readonlyCoordinates } from "../../../data/coordinatesData";
import { Coordinate } from "../../types/indexedAccessTypes";
import Piece from "./pieceFactory";

export default class Tile {
  #coordinate!: Coordinate;
  player?: string;
  hasPiece = false;
  pieceData!: Piece;
  element!: HTMLDivElement;

  constructor(coordinate: Coordinate, tileElement: HTMLDivElement) {
    this.#coordinate = coordinate;
    this.element = tileElement;
  }

  static spawn(tiles: Tile[]) {
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

      tiles.push(new Tile(coordinate, tileElement));
    });
  }

  private static getTileColor(coordinate: string): "black" | "white" {
    const fileIndex = coordinate!.codePointAt(0);
    const rankIndex = +coordinate[1];

    if (!fileIndex)
      throw new Error("Coordinate Error while generating Tile Color");

    return (fileIndex + rankIndex) % 2 === 0 ? "black" : "white";
  }

  private static generateTileHTML(
    coordinate: Coordinate,
    tileColor: "black" | "white"
  ): string {
    return `<div id="tile-${coordinate}" class="tile ${tileColor}-tile">${coordinate}</div>`;
  }

  changeStatus(): void {
    this.hasPiece = !this.hasPiece;
    // if (!this.hasPiece) this.pieceData = null;
  }

  getCoordinate(): Coordinate {
    return this.#coordinate;
  }
}
