import { Coordinate, Move } from "../../types/indexedAccessTypes";
import { PlayersData } from "../../types/mapTypes";
import { Player as PlayerType } from "../../types/unionTypes";
import Player from "../factory/playerFactory";
import Tile from "../factory/tileFactory";
import TileGraph from "./tileGraph";

export default class GameState {
  static #instance: GameState | null = null;

  playerTurn: PlayerType;
  history: Map<PlayerType, Move[]>;
  focusedTileThatHasPiece: Tile | null = null;
  previousAvailableTilesToMovePiece: Tile[] = [];

  private constructor(playerTurn: PlayerType) {
    this.playerTurn = playerTurn;
    this.history = new Map();
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
      const target = event.target as HTMLElement;

      if (
        target.classList.contains("possible-move") ||
        target.classList.contains("capture-move")
      ) {
        this.movePiece(
          tileGraph.getTileByVertex(target.dataset.coordinate as Coordinate),
          players
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
    if (!targetTile || !targetTile.hasPiece || !targetTile.pieceData) return;

    targetTile.addFocus();
    this.focusedTileThatHasPiece?.removeFocus();

    this.focusedTileThatHasPiece = targetTile;

    if (targetTile.pieceData.cachedMoves.length) {
      this.updateAvailableMoves(targetTile.pieceData.cachedMoves);
      console.log("Took from Cache");
      return;
    }

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
      case "knight": {
        this.getMovesForKnight(
          targetTile,
          targetTile.getCoordinate(),
          tileGraph
        );
        return;
      }
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

    const availableTilesToMovePawn: Tile[] = [];

    const availableMoves = neighborTiles.filter(
      (neighborTile) => neighborTile[1] === nextTileRankIndex
    );

    availableMoves.forEach((move) => {
      if (tileCoordinate[0] === move[0]) {
        const straightTile = tileGraph.getTileByVertex(move);
        !straightTile.hasPiece && availableTilesToMovePawn.push(straightTile);
      }

      if (tileCoordinate[0] === move[0] && !targetTile.pieceData?.hasMoved) {
        const secondStraightTile = tileGraph.getTileByVertex(
          `${move[0]}${
            Number(nextTileRankIndex) + (this.playerTurn === "white" ? 1 : -1)
          }` as Coordinate
        );

        !secondStraightTile.hasPiece &&
          availableTilesToMovePawn.push(secondStraightTile);
      }

      if (tileCoordinate[0] !== move[0]) {
        const diagonalTile = tileGraph.getTileByVertex(move);
        diagonalTile.hasPiece &&
          diagonalTile.player !== player &&
          availableTilesToMovePawn.push(diagonalTile);
      }
    });

    targetTile.pieceData!.cachedMoves = availableTilesToMovePawn;

    this.updateAvailableMoves(availableTilesToMovePawn);
  }

  private getMovesForKnight(
    targetTile: Tile,
    tileCoordinate: Coordinate,
    tileGraph: TileGraph
  ) {
    const neighborTiles: Coordinate[] = [
      ...tileGraph.getNeighbors(tileCoordinate),
    ].filter(
      (neighborTile) =>
        neighborTile[0] === tileCoordinate[0] ||
        neighborTile[1] === tileCoordinate[1]
    );

    const neighborTilesAsSet = new Set(neighborTiles);

    const availableTilesToMoveKnight: Tile[] = [];

    neighborTiles.forEach((tile) => {
      const neighborsOfNeighborTile = [...tileGraph.getNeighbors(tile)].filter(
        (neighborTile) =>
          neighborTile[0] !== tile[0] && neighborTile[1] !== tile[1]
      );

      neighborsOfNeighborTile.forEach((neighborTile) => {
        const tile = tileGraph.getTileByVertex(neighborTile);

        !neighborTilesAsSet.has(neighborTile) &&
          tile.player !== this.playerTurn &&
          availableTilesToMoveKnight.push(tile);
      });
    });

    targetTile.pieceData!.cachedMoves = availableTilesToMoveKnight;

    this.updateAvailableMoves(availableTilesToMoveKnight);
  }

  private movePiece(targetTile: Tile, players: PlayersData) {
    if (!targetTile || !this.focusedTileThatHasPiece) return;
    Tile.removePreviousAvailableMoves(this.previousAvailableTilesToMovePiece);
    targetTile.getPieceFromAnotherTile(this.focusedTileThatHasPiece);
    players
      .get(this.playerTurn)
      ?.piecesOnBoard.forEach((piece) => (piece.cachedMoves.length = 0));

    this.switchPlayer();
  }

  updateAvailableMoves(availableTilesToMovePiece: Tile[]) {
    Tile.removePreviousAvailableMoves(this.previousAvailableTilesToMovePiece);
    this.previousAvailableTilesToMovePiece = availableTilesToMovePiece;
    Tile.showAvailableMoves(availableTilesToMovePiece);
  }

  private switchPlayer() {
    this.playerTurn = this.playerTurn === "white" ? "black" : "white";
  }

  static reset(): void {
    this.#instance = null;
    this.getInstance();
  }
}
