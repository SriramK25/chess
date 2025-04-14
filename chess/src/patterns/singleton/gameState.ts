import { Coordinate, Move } from "../../types/indexedAccessTypes";
import { PlayersData } from "../../types/mapTypes";
import { Player as PlayerType } from "../../types/unionTypes";
import Tile from "../factory/tileFactory";
import MoveManager from "./moveManager";
import TileGraph from "./tileGraph";

export default class GameState {
  static #instance: GameState | null = null;

  playerTurn: PlayerType;
  history: Map<PlayerType, Move[]>;
  previouslyFocusedTileWithPiece: Tile | null = null;
  previousAvailableTilesToMovePiece: Tile[] = [];
  #moveManager: MoveManager;

  private constructor(playerTurn: PlayerType) {
    this.playerTurn = playerTurn;
    this.history = new Map();
    this.#moveManager = MoveManager.getInstance();
  }

  static getInstance() {
    if (!this.#instance) this.#instance = new GameState("white");
    return this.#instance;
  }

  start(
    chessboardElement: Element,
    tileGraph: TileGraph,
    players: PlayersData
  ) {
    this.listenToBoard(chessboardElement, tileGraph, players);
  }

  private listenToBoard(
    chessboardElement: Element,
    tileGraph: TileGraph,
    players: PlayersData
  ): void {
    chessboardElement.addEventListener("click", (event) => {
      let target = event.target as HTMLElement;

      if (
        target.tagName === "IMG" &&
        target.id.endsWith("piece") &&
        target.dataset.playableBy
      )
        target = target.parentElement!;

      const targetTile = tileGraph.getTileByVertex(
        target.dataset.coordinate as Coordinate
      );

      if (target.classList.contains("capture-move")) {
        this.#moveManager.capturePiece(
          targetTile,
          this.previouslyFocusedTileWithPiece
        ) && this.switchPlayer(players);
        return;
      }

      if (target.classList.contains("possible-move")) {
        this.#moveManager.movePiece(
          targetTile,
          this.previouslyFocusedTileWithPiece
        ) && this.switchPlayer(players);
        return;
      }

      if (targetTile.player !== this.playerTurn) {
        return;
      }

      this.allowPlayerToMovePiece(targetTile, tileGraph);
    });
  }

  private allowPlayerToMovePiece(targetTile: Tile, tileGraph: TileGraph) {
    if (!targetTile || !targetTile.hasPiece || !targetTile.pieceData) return;

    this.previouslyFocusedTileWithPiece?.removeFocus();
    targetTile.addFocus();

    this.previouslyFocusedTileWithPiece = targetTile;

    let availableTilesToMovePiece: Tile[] = [];

    if (targetTile.pieceData.cachedMoves.length) {
      availableTilesToMovePiece = targetTile.pieceData.cachedMoves;
    } else {
      switch (targetTile.pieceData?.type) {
        case "pawn": {
          availableTilesToMovePiece = this.#moveManager.getMovesForPawn(
            targetTile,
            targetTile.getCoordinate(),
            tileGraph,
            this.playerTurn
          );
          break;
        }

        case "king": {
          break;
        }

        case "queen": {
          break;
        }

        case "bishop": {
          availableTilesToMovePiece = this.#moveManager.getMovesForBishop(
            targetTile,
            targetTile.getCoordinate(),
            tileGraph,
            this.playerTurn
          );
          break;
        }

        case "knight": {
          availableTilesToMovePiece = this.#moveManager.getMovesForKnight(
            targetTile,
            targetTile.getCoordinate(),
            tileGraph,
            this.playerTurn
          );
          break;
        }

        case "rook": {
          break;
        }
      }
    }

    targetTile.pieceData!.cachedMoves = availableTilesToMovePiece;
    this.updateGameState(availableTilesToMovePiece);
  }

  switchPlayer(players: PlayersData) {
    if (!this.previouslyFocusedTileWithPiece) return;

    Tile.removePreviousAvailableMoves(this.previousAvailableTilesToMovePiece);
    players
      .get(this.playerTurn)
      ?.piecesOnBoard.forEach((piece) => (piece.cachedMoves.length = 0));

    this.playerTurn = this.playerTurn === "white" ? "black" : "white";
  }

  private updateGameState(availableTilesToMovePiece: Tile[]) {
    Tile.removePreviousAvailableMoves(this.previousAvailableTilesToMovePiece);
    this.previousAvailableTilesToMovePiece = availableTilesToMovePiece;
    Tile.showAvailableMoves(availableTilesToMovePiece);
  }

  static reset(): void {
    this.#instance = null;
    this.getInstance();
  }
}
