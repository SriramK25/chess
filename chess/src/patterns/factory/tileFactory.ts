import { Coordinate } from "../../../types/indexedAccessTypes";

export default class Tile {
  #coordinate!: Coordinate;
  player?: string;
  hasPiece = false;
  pieceData = {};
  element!: HTMLDivElement;

  constructor(coordinate: Coordinate, tileElement: HTMLDivElement) {
    this.#coordinate = coordinate;
    this.element = tileElement;
  }

  changeStatus(): void {
    this.hasPiece = !this.hasPiece;
    if (!this.hasPiece) this.pieceData = {};
  }

  getCoordinate(): string {
    return this.#coordinate;
  }
}
