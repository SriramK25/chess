import { Coordinates } from "../../../data/coordinatesData.js";

export default class Tile {
  #coordinate!: (typeof Coordinates)[number];
  player?: string;
  hasPiece = false;
  pieceData = {};

  constructor(coordinate: (typeof Coordinates)[number]) {
    this.#coordinate = coordinate;
  }

  changeStatus(): void {
    this.hasPiece = !this.hasPiece;
    if (!this.hasPiece) this.pieceData = {};
  }

  getCoordinate(): string {
    return this.#coordinate;
  }
}
