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

    let availableTilesToMovePiece: Array<Tile[]> = [];

    if (targetTile.pieceData.cachedMoves.length) {
      availableTilesToMovePiece = targetTile.pieceData.cachedMoves;
      this.#focusedPiece = targetTile.pieceData.type;
      console.log("From Cache");
    } else {
      switch (targetTile.pieceData?.type) {
        case "pawn": {
          availableTilesToMovePiece = this.#moveManager.getMovesForPawn(
            targetTile,
            targetTile.getCoordinate(),
            tileGraph,
            this.playerTurn
          );
          this.#focusedPiece = "pawn";
          break;
        }

        case "king": {
          // availableTilesToMovePiece = this.#moveManager.getMovesForKing(
          //   targetTile.getCoordinate(),
          //   tileGraph,
          //   this.playerTurn
          // );
          break;
        }

        case "queen": {
          availableTilesToMovePiece = this.#moveManager.getMovesForQueen(
            targetTile.getCoordinate(),
            tileGraph,
            this.playerTurn
          );
          break;
        }

        case "bishop": {
          availableTilesToMovePiece = this.#moveManager.getMovesForBishop(
            // targetTile,
            targetTile.getCoordinate(),
            tileGraph
            // this.playerTurn
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
          availableTilesToMovePiece = this.#moveManager.getMovesForRook(
            // targetTile,
            targetTile.getCoordinate(),
            tileGraph
            // this.playerTurn
          );
          break;
        }
      }
    }

    console.log(
      availableTilesToMovePiece.map((a) => a.map((a1) => a1.getCoordinate()))
    );

    targetTile.pieceData!.cachedMoves = availableTilesToMovePiece;
    this.updateGameState(availableTilesToMovePiece);
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
