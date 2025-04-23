import {
  Coordinate,
  KingCoordinates,
  Move,
} from "../../types/indexedAccessTypes";
import { PlayersData } from "../../types/mapTypes";
import { PieceType, Player as PlayerType } from "../../types/unionTypes";
import Tile from "../factory/tileFactory";
import MoveManager from "./moveManager";
import TileGraph from "./tileGraph";

export default class GameState {
  static #instance: GameState | null = null;

  playerTurn: PlayerType;
  history: Map<PlayerType, Move[]>;
  previouslyFocusedTileWithPiece: Tile | null = null;
  previousAvailableTilesToMovePiece: Array<Tile[]> = [];
  #moveManager: MoveManager;
  #kingCoordinates!: KingCoordinates;
  #focusedPiece: PieceType | null = null;

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
    players: PlayersData,
    kingCoordinates: KingCoordinates
  ) {
    this.#kingCoordinates = kingCoordinates;
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
        (target.tagName === "IMG" &&
          target.id.endsWith("piece") &&
          target.dataset.playableBy) ||
        target.tagName === "SPAN"
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

        targetTile.pieceData!.nextLatentMove = this.getMovesForPiece(ta);

        return;
      }

      if (targetTile.player !== this.playerTurn) {
        return;
      }

      this.allowPlayerToMovePiece(targetTile);
    });
  }

  private allowPlayerToMovePiece(targetTile: Tile) {
    if (!targetTile || !targetTile.hasPiece || !targetTile.pieceData) return;

    this.previouslyFocusedTileWithPiece?.removeFocus();
    targetTile.addFocus();

    this.previouslyFocusedTileWithPiece = targetTile;

    let availableTilesToMovePiece: Array<Tile[]> = [];

    if (targetTile.pieceData.nextLatentMove.length) {
      availableTilesToMovePiece = targetTile.pieceData.nextLatentMove;
      this.#focusedPiece = targetTile.pieceData.type;
      console.log("From Latent Move");
    } else {
    }

    this.updateGameState(availableTilesToMovePiece);
  }

  getMovesForPiece(
    pieceType: PieceType,
    coordinate: Coordinate,
    tileGraph: TileGraph
  ): Array<Tile[]> {
    let availableTilesToMovePiece: Array<Tile[]> = [];

    switch (pieceType) {
      case "pawn": {
        availableTilesToMovePiece = this.#moveManager.getMovesForPawn(
          coordinate,
          tileGraph
        );
        this.#focusedPiece = "pawn";
        break;
      }

      case "king": {
        availableTilesToMovePiece = this.#moveManager.getMovesForKing(
          coordinate,
          tileGraph
        );
        break;
      }

      case "queen": {
        availableTilesToMovePiece = this.#moveManager.getMovesForQueen(
          coordinate,
          tileGraph
        );
        break;
      }

      case "bishop": {
        availableTilesToMovePiece = this.#moveManager.getMovesForBishop(
          coordinate,
          tileGraph
        );
        break;
      }

      case "knight": {
        availableTilesToMovePiece = this.#moveManager.getMovesForKnight(
          coordinate,
          tileGraph,
          this.playerTurn
        );
        break;
      }

      case "rook": {
        availableTilesToMovePiece = this.#moveManager.getMovesForRook(
          coordinate,
          tileGraph
        );
        break;
      }
    }

    return availableTilesToMovePiece;
  }

  switchPlayer(players: PlayersData) {
    if (!this.previouslyFocusedTileWithPiece) return;

    Tile.removePreviousAvailableMoves(
      this.previousAvailableTilesToMovePiece,
      this.playerTurn
    );
    players
      .get(this.playerTurn)
      ?.piecesOnBoard.forEach((piece) => (piece.cachedMoves.length = 0));

    this.playerTurn = this.playerTurn === "white" ? "black" : "white";
  }

  private updateGameState(availableTilesToMovePiece: Array<Tile[]>) {
    Tile.removePreviousAvailableMoves(
      this.previousAvailableTilesToMovePiece,
      this.playerTurn
    );
    this.previousAvailableTilesToMovePiece = availableTilesToMovePiece;
    Tile.showAvailableMoves(
      availableTilesToMovePiece,
      this.playerTurn,
      this.#focusedPiece
    );

    this.#focusedPiece = null;
  }

  static reset(): void {
    this.#instance = null;
    this.getInstance();
  }
}
