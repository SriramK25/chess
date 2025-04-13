import { readonlyCoordinates } from "../../../data/coordinatesData";
import { Coordinate } from "../../types/indexedAccessTypes";
import { Player } from "../../types/unionTypes";
import Piece from "./pieceFactory";

export default class Tile {
  #coordinate: Coordinate;
  player: string | null = null;
  hasPiece = false;
  pieceData: Piece | null = null;
  element: Element;

  static chessboardElement: Element;

  constructor(coordinate: Coordinate, tileElement: Element) {
    this.#coordinate = coordinate;
    this.element = tileElement;
  }

  static spawn(chessboardElement: Element, tiles: Tile[]): void {
    this.chessboardElement = chessboardElement;

    readonlyCoordinates.forEach((coordinate) => {
      let tileColor: "white" | "black" = this.getTileColor(coordinate);

      chessboardElement.insertAdjacentHTML(
        "beforeend",
        this.generateTileHTML(coordinate, tileColor)
      );

      const tileElement: Element | null = chessboardElement.querySelector(
        `#tile-${coordinate}`
      );

      if (!tileElement)
        throw new Error("Tile not found while Initializing Chessboard");

      tiles.push(new Tile(coordinate, tileElement));
    });
  }

  private static getTileColor(coordinate: string): Player {
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
    return `<div id="tile-${coordinate}" class="tile ${tileColor}-tile" data-coordinate="${coordinate}"><span class="dev-util">${coordinate}</span></div>`;
  }

  getCoordinate(): Coordinate {
    return this.#coordinate;
  }

  showAvailableMoves(availableTileToMovePawn: Tile[]) {
    availableTileToMovePawn.forEach((tile) => {
      tile.element.classList.add(
        tile.hasPiece ? "capture-move" : "possible-move"
      );
    });
  }

  getPieceFromAnotherTile(fromTile: Tile) {
    const pieceElement = fromTile.element.querySelector(
      "img[id$='piece']"
    ) as HTMLElement;

    if (!pieceElement) return;

    pieceElement.dataset.onCoordinate = this.getCoordinate();

    this.hasPiece = true;
    this.player = fromTile.player;
    this.element.insertAdjacentElement("beforeend", pieceElement);
    this.pieceData = fromTile.pieceData;
    this.element.classList.remove("possible-move");

    this.changeStatusOfSenderTile(fromTile);
  }

  private changeStatusOfSenderTile(fromTile: Tile): void {
    fromTile.hasPiece = false;
    fromTile.player = null;
    fromTile.pieceData = null;
    fromTile.element.classList.remove("focused");
  }
}
