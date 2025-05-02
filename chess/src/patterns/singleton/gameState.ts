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
  #players!: PlayersData;

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
    this.#players = players;
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
        );

        this.updateStateForMovedPiece(targetTile, tileGraph);

        this.switchPlayer();
        return;
      }

      if (target.classList.contains("possible-move")) {
        // Move the Selected Piece
        this.#moveManager.movePiece(
          targetTile,
          this.previouslyFocusedTileWithPiece
        );

        this.updateStateForMovedPiece(targetTile, tileGraph);

        // Switch to Next Player
        this.switchPlayer();

        return;
      }

      if (targetTile.player !== this.playerTurn) return;

      this.allowPlayerToMovePiece(targetTile);
    });
  }

  private updateStateForMovedPiece(targetTile: Tile, tileGraph: TileGraph) {
    // If Moved Piece was King then we Update its State
    if (targetTile.pieceData && targetTile.pieceData.type === "king") {
      const movedKingBelongsTo = targetTile.pieceData.belongsTo;

      this.#kingCoordinates[`${movedKingBelongsTo}King`] =
        targetTile.getCoordinate();

      const doLatentCheckFor =
        movedKingBelongsTo === "white" ? "black" : "white";

      this.#players.get(doLatentCheckFor)?.piecesOnBoard.forEach((piece) => {
        if (piece.hasCaptured) return;

        piece.blockerPieces.clear();
        piece.blocking.clear();
        piece.targetingOpponentKingViaTiles.forEach((tile) => {
          tile.piecesTargetingKingViaThisTile.clear();
        });
        piece.targetingOpponentKingViaTiles.clear();

        this.#moveManager.latentCheck(
          piece,
          this.#kingCoordinates,
          doLatentCheckFor,
          tileGraph
        );
      });
    }

    this.#moveManager.updateLatentCheck(
      targetTile,
      this.#kingCoordinates,
      tileGraph
    );

    // Get Next Moves for the Moved Piece
    targetTile.pieceData!.nextLatentMove = this.getMovesForPiece(
      targetTile.pieceData!.type,
      targetTile.getCoordinate(),
      tileGraph
    );

    // Check whether the Moved Piece's Next Move has King in its path (With & Without Blockers)
    this.#moveManager.latentCheck(
      targetTile.pieceData!,
      this.#kingCoordinates,
      this.playerTurn,
      tileGraph
    );
  }

  private allowPlayerToMovePiece(targetTile: Tile) {
    if (!targetTile || !targetTile.hasPiece || !targetTile.pieceData) return;

    this.previouslyFocusedTileWithPiece?.removeFocus();
    targetTile.addFocus();

    this.previouslyFocusedTileWithPiece = targetTile;

    let availableTilesToMovePiece: Array<Tile[]> = [];

    if (
      targetTile.pieceData.nextLatentMove.length &&
      !targetTile.pieceData.isProtectingKingFromOpponentLatentMove
    ) {
      availableTilesToMovePiece = targetTile.pieceData.nextLatentMove;
      this.#focusedPiece = targetTile.pieceData.type;
    } else if (
      targetTile.pieceData.nextLatentMove.length &&
      targetTile.pieceData.isProtectingKingFromOpponentLatentMove
    ) {
      availableTilesToMovePiece = this.getSafeMoves(targetTile);
      this.#focusedPiece = targetTile.pieceData.type;
    }

    this.updateGameState(availableTilesToMovePiece);
  }

  private getSafeMoves(targetTile: Tile): Array<Tile[]> {
    if (!targetTile || !targetTile.pieceData)
      throw new Error("Cannot Get Safe Moves");

    const opponentPieceTargetingKingCoordinates: Set<Coordinate> = new Set();

    targetTile.pieceData.blocking.forEach((opponentPiece) => {
      opponentPiece.targetingOpponentKingViaTiles.forEach((tile) => {
        opponentPieceTargetingKingCoordinates.add(tile.getCoordinate());
      });
    });

    const newLatentMove: Array<Tile[]> = [];

    for (let latentMoveSide of targetTile.pieceData.nextLatentMove) {
      const newLatentMoveSide: Tile[] = [];

      latentMoveSide.forEach((latentMoveTile) => {
        opponentPieceTargetingKingCoordinates.has(
          latentMoveTile.getCoordinate()
        ) && newLatentMoveSide.push(latentMoveTile);
      });

      newLatentMove.push(newLatentMoveSide);
    }

    return newLatentMove;
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

  switchPlayer() {
    if (!this.previouslyFocusedTileWithPiece) return;

    Tile.removePreviousAvailableMoves(
      this.previousAvailableTilesToMovePiece,
      this.playerTurn
    );

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
