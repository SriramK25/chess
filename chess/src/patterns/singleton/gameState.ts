import { Coordinate, KingCoordinates, Move } from "../../types/indexedAccessTypes";
import { PlayersData } from "../../types/mapTypes";
import { PieceType, Player as PlayerType } from "../../types/unionTypes";
import Tile from "../factory/tileFactory";
import MoveManager from "./moveManager";
import Opponent from "./opponent";
import TileGraph from "./tileGraph";

export default class GameState {
  private static _instance: GameState | null = null;

  private _moveManager: MoveManager;
  private _kingCoordinates!: KingCoordinates;
  private _focusedPiece: PieceType | null = null;
  private _players!: PlayersData;

  opponent!: Opponent;
  playerTurn: PlayerType;
  history: Map<PlayerType, Move[]>;
  previouslyFocusedTileWithPiece: Tile | null = null;
  previousAvailableTilesToMovePiece: Array<Tile[]> = [];

  private constructor(playerTurn: PlayerType) {
    this.playerTurn = playerTurn;
    this.history = new Map();
    this._moveManager = MoveManager.getInstance();
  }

  static getInstance() {
    if (!this._instance) this._instance = new GameState("white");
    return this._instance;
  }

  start(chessboardElement: Element, tileGraph: TileGraph, players: PlayersData, kingCoordinates: KingCoordinates) {
    this._kingCoordinates = kingCoordinates;
    this._players = players;
    this.opponent = Opponent.getInstance(tileGraph);
    this.listenToBoard(chessboardElement, tileGraph);
  }

  private listenToBoard(chessboardElement: Element, tileGraph: TileGraph): void {
    chessboardElement.addEventListener("click", (event) => {
      let target = event.target as HTMLElement;

      if (
        (target.tagName === "IMG" && target.id.endsWith("piece") && target.dataset.playableBy) ||
        target.tagName === "SPAN"
      )
        target = target.parentElement!;

      const targetTile = tileGraph.getTileByVertex(target.dataset.coordinate as Coordinate);

      if (!targetTile) return;

      if (["possible-move", "capture-move"].some((className) => target.classList.contains(className))) {
        // Move the Selected Piece
        this._moveManager.executeMove(targetTile, this.previouslyFocusedTileWithPiece);
        this.updateStateForMovedPiece(targetTile, tileGraph);

        // Switch to Next Player
        this.switchPlayer();
        return;
      }

      if (targetTile.player !== this.playerTurn) return;

      // if (this.playerTurn === "white")
      this.allowPlayerToMovePiece(targetTile);
    });
  }

  getMoves(piece: PieceType, coordinate: Coordinate, tileGraph: TileGraph) {
    return this._moveManager.getMoves(piece, coordinate, tileGraph);
  }

  getNextMovesForMovedPiece(piece: PieceType, coordinate: Coordinate, tileGraph: TileGraph) {
    return this.getMoves(piece, coordinate, tileGraph);
  }

  private updateStateForMovedPiece(targetTile: Tile, tileGraph: TileGraph) {
    // If Moved Piece was King then we Update its State
    if (targetTile.pieceData && targetTile.pieceData.type === "king") {
      const movedKingBelongsTo = targetTile.pieceData.belongsTo;

      this._kingCoordinates[`${movedKingBelongsTo}King`] = targetTile.getCoordinate();

      const opponent = movedKingBelongsTo === "white" ? "black" : "white";

      this._players.get(opponent)?.piecesOnBoard.forEach((piece) => {
        if (piece.hasCaptured) return;

        piece.blockerPieces.clear();
        piece.blocking.clear();

        this._moveManager.updateBlockers(piece, this._kingCoordinates, opponent);
      });
    }

    this._moveManager.checkMovingBlockerThreatensKing(targetTile, this._kingCoordinates, tileGraph);

    targetTile.pieceData!.blockerPieces.forEach((blockerPiece) => {
      blockerPiece.blocking.clear();
      blockerPiece.isProtectingKingFromOpponentPiece = false;
    });

    targetTile.piecesTargetingThisTile.forEach((opponentPiece) => {
      if (
        !opponentPiece.nextMove.some((side) =>
          side.some(
            (move) => move.getCoordinate() === this._kingCoordinates[`${targetTile.pieceData!.belongsTo}King`]
          )
        )
      )
        return;

      if (opponentPiece.blockerPieces.size === 1) {
        Array.from(opponentPiece.blockerPieces.values())[0].isProtectingKingFromOpponentPiece = false;
      } else if (!opponentPiece.blockerPieces.size) {
        targetTile.pieceData!.isProtectingKingFromOpponentPiece = true;
      }

      opponentPiece.blockerPieces.set(targetTile.pieceData!.id, targetTile.pieceData!);

      targetTile.pieceData!.blocking.set(opponentPiece.id, opponentPiece);
    });

    targetTile.pieceData!.blockerPieces.clear();

    targetTile.pieceData?.nextMove.forEach((side) => {
      side.forEach((move) => {
        if (!targetTile.pieceData) return;
        move.piecesTargetingThisTile.delete(targetTile.pieceData.id);
      });
    });

    // Get Next Moves for the Moved Piece
    targetTile.pieceData!.nextMove = this.getNextMovesForMovedPiece(
      targetTile.pieceData!.type,
      targetTile.getCoordinate(),
      tileGraph
    );

    // Register Moved Piece's Next move to the Tiles
    targetTile.pieceData?.nextMove.forEach((side) => {
      side.forEach((move) => {
        if (!targetTile.pieceData) return;
        move.piecesTargetingThisTile.set(targetTile.pieceData.id, targetTile.pieceData);
      });
    });

    // Check whether the Moved Piece's Next Move has King in its path (With & Without Blockers)
    this._moveManager.updateBlockers(targetTile.pieceData!, this._kingCoordinates, this.playerTurn);
  }

  private allowPlayerToMovePiece(targetTile: Tile) {
    if (!targetTile || !targetTile.hasPiece || !targetTile.pieceData) return;

    this.previouslyFocusedTileWithPiece?.removeFocus();
    targetTile.addFocus();

    this.previouslyFocusedTileWithPiece = targetTile;

    let availableTilesToMovePiece: Array<Tile[]> = [];

    if (
      targetTile.pieceData.nextMove.length &&
      !targetTile.pieceData.isProtectingKingFromOpponentPiece &&
      targetTile.pieceData.type !== "king"
    ) {
      availableTilesToMovePiece = targetTile.pieceData.nextMove;
    } else if (targetTile.pieceData.nextMove.length) {
      availableTilesToMovePiece = this._moveManager.filterMoves(targetTile);
    }

    this._focusedPiece = targetTile.pieceData.type;
    this.updateGameState(availableTilesToMovePiece);
  }

  switchPlayer() {
    if (!this.previouslyFocusedTileWithPiece) return;
    Tile.removePreviousAvailableMoves(this.previousAvailableTilesToMovePiece);
    this.playerTurn = this.playerTurn === "white" ? "black" : "white";

    if (this.playerTurn === "black") this.opponent.sendFEN();
  }

  private updateGameState(availableTilesToMovePiece: Array<Tile[]>) {
    Tile.removePreviousAvailableMoves(this.previousAvailableTilesToMovePiece);
    this.previousAvailableTilesToMovePiece = availableTilesToMovePiece;
    Tile.showAvailableMoves(availableTilesToMovePiece, this.playerTurn, this._focusedPiece);
    this._focusedPiece = null;
  }

  static reset(): void {
    this._instance = null;
    this.getInstance();
  }
}
