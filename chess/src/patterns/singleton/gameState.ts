import { Coordinate, Move } from "../../types/indexedAccessTypes";
import { Player } from "../../types/unionTypes";
import Tile from "../factory/tileFactory";
import TileGraph from "./tileGraph";

export default class GameState {
  static #instance: GameState | null = null;

  playerTurn: Player;
  history: Map<Player, Move[]>;
  focusedTileThatHasPiece: Tile | null = null;
  previousAvailableTilesToMovePiece: Tile[] = [];

  private constructor(playerTurn: Player) {
    this.playerTurn = playerTurn;
    this.history = new Map();
  }

  static getInstance() {
    if (!this.#instance) this.#instance = new GameState("white");
    return this.#instance;
  }

  start(chessboardElement: Element, tileGraph: TileGraph) {
    this.listenToBoard(chessboardElement, tileGraph);
  }

  private listenToBoard(
    chessboardElement: Element,
    tileGraph: TileGraph
  ): void {
    chessboardElement.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      if (
        target.classList.contains("possible-move") ||
        target.classList.contains("capture-move")
      ) {
        this.movePiece(
          tileGraph.getTileByVertex(target.dataset.coordinate as Coordinate)
        );
        return;
      }

      if (
        !target.dataset.playableBy ||
        target.dataset.playableBy !== this.playerTurn
      ) {
        return;
      }

      const targetTile = tileGraph.getTileByVertex(
        target.dataset.onCoordinate as Coordinate
      );

      this.allowPlayerToMovePiece(targetTile, tileGraph);
    });
  }

  private allowPlayerToMovePiece(targetTile: Tile, tileGraph: TileGraph) {
    if (!targetTile || !targetTile.hasPiece) return;

    targetTile.addFocus();
    this.focusedTileThatHasPiece?.removeFocus();

    this.focusedTileThatHasPiece = targetTile;

    switch (targetTile.pieceData?.type) {
      case "pawn": {
        this.getMovesForPawn(targetTile, targetTile.getCoordinate(), tileGraph);
        return;
      }
      case "king":
        return;
      case "queen":
        return;
      case "bishop":
        return;
      case "knight":
        return;
      case "rook":
        return;
    }
  }

  private getMovesForPawn(
    targetTile: Tile,
    tileCoordinate: Coordinate,
    tileGraph: TileGraph
  ) {
    const neighborTiles: Coordinate[] = [
      ...tileGraph.getNeighbors(tileCoordinate),
    ];

    const player = targetTile.pieceData?.belongsTo;

    const nextTileRankIndex =
      player === "white"
        ? (Number(tileCoordinate[1]) + 1).toString()
        : (Number(tileCoordinate[1]) - 1).toString();

    const availableTileToMovePawn: Tile[] = [];

    const availableMoves = neighborTiles.filter(
      (neighborTile) => neighborTile[1] === nextTileRankIndex
    );

    availableMoves.forEach((move) => {
      if (tileCoordinate[0] === move[0]) {
        const straightTile = tileGraph.getTileByVertex(move);
        !straightTile.hasPiece && availableTileToMovePawn.push(straightTile);
      }

      if (tileCoordinate[0] === move[0] && !targetTile.pieceData?.hasMoved) {
        const secondStraightTile = tileGraph.getTileByVertex(
          `${move[0]}${Number(nextTileRankIndex) + 1}` as Coordinate
        );

        !secondStraightTile.hasPiece &&
          availableTileToMovePawn.push(secondStraightTile);
      }

      if (tileCoordinate[0] !== move[0]) {
        const diagonalTile = tileGraph.getTileByVertex(move);
        diagonalTile.hasPiece &&
          diagonalTile.player !== player &&
          availableTileToMovePawn.push(diagonalTile);
      }
    });

    console.log(availableMoves);
    Tile.removePreviousAvailableMoves(this.previousAvailableTilesToMovePiece);
    this.previousAvailableTilesToMovePiece = availableTileToMovePawn;
    Tile.showAvailableMoves(availableTileToMovePawn);
  }

  private movePiece(targetTile: Tile) {
    if (!targetTile || !this.focusedTileThatHasPiece) return;
    Tile.removePreviousAvailableMoves(this.previousAvailableTilesToMovePiece);
    targetTile.getPieceFromAnotherTile(this.focusedTileThatHasPiece);
  }

  static reset(): void {
    this.#instance = null;
    this.getInstance();
  }
}
