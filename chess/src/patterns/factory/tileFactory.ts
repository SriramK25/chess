import { readonlyCoordinates } from "../../../data/coordinatesData";
import { Coordinate } from "../../types/indexedAccessTypes";
import { PieceType, Player } from "../../types/unionTypes";
import Piece from "./pieceFactory";

export default class Tile {
  #coordinate: Coordinate;
  player: string | null = null;
  hasPiece = false;
  pieceData: Piece | null = null;
  element: Element;
  piecesTargetingKingViaThisTile: Map<string, Piece> = new Map();

  static chessboardElement: Element;

  constructor(coordinate: Coordinate, tileElement: Element) {
    this.#coordinate = coordinate;
    this.element = tileElement;
  }

  static spawn(chessboardElement: Element, tiles: Tile[]): void {
    this.chessboardElement = chessboardElement;
    const tilesFragment = document.createDocumentFragment();

    readonlyCoordinates.forEach((coordinate) => {
      let tileColor: "white" | "black" = this.getTileColor(coordinate);

      tilesFragment.append(this.generateTileHTML(coordinate, tileColor));

      const tileElement: Element | null = tilesFragment.querySelector(
        `#tile-${coordinate}`
      );

      if (!tileElement)
        throw new Error("Tile not found while Initializing Chessboard");

      tiles.push(new Tile(coordinate, tileElement));
    });

    chessboardElement.append(tilesFragment);
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
  ): HTMLElement {
    const divElement = document.createElement("div");

    divElement.id = `tile-${coordinate}`;
    divElement.classList.add("tile", `${tileColor}-tile`);
    divElement.dataset.coordinate = coordinate;
    divElement.innerHTML = `<span class="dev-util">${coordinate}</span>`;

    return divElement;
  }

  getCoordinate(): Coordinate {
    return this.#coordinate;
  }

  static showAvailableMoves(
    availableSidesToMovePiece: Array<Tile[]>,
    playerTurn: Player,
    pieceType: PieceType | null = null
  ) {
    if (pieceType === "pawn") {
      availableSidesToMovePiece = this.filterMovesForPawn(
        availableSidesToMovePiece
      );
    }

    availableSidesToMovePiece.forEach((availableSideToMovePiece) => {
      for (let tile of availableSideToMovePiece) {
        if (tile.hasPiece) {
          tile.player !== playerTurn && tile.addCaptureMove();
          return;
        }
        tile.addPossibleMove();
      }
    });
  }

  static filterMovesForPawn(availableSidesToMovePawn: Array<Tile[]>) {
    const emptyTiles: Tile[] = [];

    return availableSidesToMovePawn.map((availableSideToMovePawn, index) => {
      if (!availableSideToMovePawn.length) return emptyTiles;

      if (!index) {
        const filteredStraightTile: Tile[] = [];
        for (let availableTile of availableSideToMovePawn) {
          if (availableTile.hasPiece) break;
          filteredStraightTile.push(availableTile);
        }

        return filteredStraightTile;
      }

      return availableSideToMovePawn[0].hasPiece
        ? availableSideToMovePawn
        : emptyTiles;
    });
  }

  static removePreviousAvailableMoves(
    previousAvailableSidesToMovePiece: Array<Tile[]>,
    playerTurn: Player
  ) {
    previousAvailableSidesToMovePiece.forEach(
      (previousAvailableSideToMovePiece) => {
        for (let tile of previousAvailableSideToMovePiece) {
          if (tile.hasPiece) {
            tile.removeCaptureMove();
            continue;
          }
          tile.removePossibleMove();
        }
      }
    );
  }

  getPieceFromAnotherTile(fromTile: Tile, toTileHasPiece: boolean = false) {
    const pieceElement = fromTile.element.querySelector(
      "img[id$='piece']"
    ) as HTMLElement;

    if (!pieceElement) return;

    if (toTileHasPiece) {
      this.element.querySelector("img[id$='piece']")?.remove();
    }

    pieceElement.dataset.onCoordinate = this.getCoordinate();

    this.hasPiece = true;
    this.player = fromTile.player;
    this.element.insertAdjacentElement("beforeend", pieceElement);
    this.pieceData = fromTile.pieceData;
    this.pieceData!.onTile = this.getCoordinate();
    this.pieceData!.hasMoved = true;
    this.pieceData!.blockerPieces.clear();
    this.updatePiecesTargetingKingViaTiles(this.pieceData!);
    this.changeStatusOfSenderTile(fromTile);
  }

  private changeStatusOfSenderTile(fromTile: Tile): void {
    fromTile.hasPiece = false;
    fromTile.player = null;
    fromTile.pieceData = null;
    fromTile.removeFocus();
  }

  private updatePiecesTargetingKingViaTiles(piece: Piece) {
    if (!piece)
      throw new Error("Piece Not Found while trying to update Tile Data");

    piece.targetingOpponentKingViaTiles.forEach((tile) => {
      tile.piecesTargetingKingViaThisTile.delete(piece.id);

      if (!tile.hasPiece || !tile.pieceData) return;

      tile.pieceData.isProtectingKingFromOpponentLatentMove = false;
      tile.pieceData.blocking.delete(piece.id);
    });

    piece.targetingOpponentKingViaTiles.clear();
  }

  addFocus(): void {
    this.element.classList.add("focused");
  }

  removeFocus(): void {
    this.element.classList.remove("focused");
  }

  addPossibleMove(): void {
    this.element.classList.add("possible-move");
  }

  removePossibleMove(): void {
    this.element.classList.remove("possible-move");
  }

  addCaptureMove(): void {
    this.element.classList.add("possible-move", "capture-move");
  }

  removeCaptureMove(): void {
    this.element.classList.remove("possible-move", "capture-move");
  }
}
