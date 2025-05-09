import { BOARD } from "../../rules/indexRules";
import { Coordinate, KingCoordinates } from "../../types/indexedAccessTypes";
import { Player as PlayerType } from "../../types/unionTypes";
import Piece from "../factory/pieceFactory";
import Tile from "../factory/tileFactory";
import TileGraph from "./tileGraph";

// This Class is responsible for Calculating Moves for the Selected Piece by Player
export default class MoveManager {
  static #instance: MoveManager | null = null;

  private constructor() {}

  static getInstance() {
    if (!this.#instance) this.#instance = new MoveManager();
    return this.#instance;
  }

  getMovesForPawn(
    tileCoordinate: Coordinate,
    tileGraph: TileGraph
  ): Array<Tile[]> {
    const targetTile = tileGraph.getTileByVertex(tileCoordinate);

    const neighborTiles: Coordinate[] = [
      ...tileGraph.getNeighbors(tileCoordinate),
    ];

    const nextTileRankIndex =
      targetTile.player === "white"
        ? (Number(tileCoordinate[1]) + 1).toString()
        : (Number(tileCoordinate[1]) - 1).toString();

    const availableTilesToMovePawn: Array<Tile[]> = [[], [], []];

    const availableMoves = neighborTiles.filter(
      (neighborTile) => neighborTile[1] === nextTileRankIndex
    );

    availableMoves.forEach((move, index) => {
      if (tileCoordinate[0] === move[0]) {
        const straightTile = tileGraph.getTileByVertex(move);
        straightTile && availableTilesToMovePawn[0].push(straightTile);
      }

      if (tileCoordinate[0] === move[0] && !targetTile.pieceData?.hasMoved) {
        const secondStraightRankIndex =
          Number(nextTileRankIndex) + (targetTile.player === "white" ? 1 : -1);

        const secondStraightTile = tileGraph.getTileByVertex(
          `${move[0]}${secondStraightRankIndex}` as Coordinate
        );

        secondStraightTile &&
          availableTilesToMovePawn[0].push(secondStraightTile);
      }

      if (tileCoordinate[0] !== move[0]) {
        const diagonalTile = tileGraph.getTileByVertex(move);
        diagonalTile &&
          availableTilesToMovePawn[!index ? index + 1 : index].push(
            diagonalTile
          );
      }
    });

    return availableTilesToMovePawn;
  }

  getMovesForKnight(
    tileCoordinate: Coordinate,
    tileGraph: TileGraph,
    playerTurn: PlayerType
  ): Array<Tile[]> {
    const neighborTiles: Coordinate[] = [
      ...tileGraph.getNeighbors(tileCoordinate),
    ].filter(
      (neighborTile) =>
        neighborTile[0] === tileCoordinate[0] ||
        neighborTile[1] === tileCoordinate[1]
    );

    const neighborTilesAsSet = new Set(neighborTiles);

    const availableTilesToMoveKnight: Array<Tile[]> = [];

    neighborTiles.forEach((tile, index) => {
      const neighborsOfNeighborTile = [...tileGraph.getNeighbors(tile)].filter(
        (neighborTile) =>
          neighborTile[0] !== tile[0] && neighborTile[1] !== tile[1]
      );

      availableTilesToMoveKnight.push([]);

      neighborsOfNeighborTile.forEach((neighborTile) => {
        const tile = tileGraph.getTileByVertex(neighborTile);

        !neighborTilesAsSet.has(neighborTile) &&
          tile.player !== playerTurn &&
          availableTilesToMoveKnight[index].push(tile);
      });
    });

    return availableTilesToMoveKnight;
  }

  getMovesForBishop(
    tileCoordinate: Coordinate,
    tileGraph: TileGraph
  ): Array<Tile[]> {
    const neighborTiles: Coordinate[] = [
      ...tileGraph.getNeighbors(tileCoordinate),
    ].filter(
      (neighborTile) =>
        neighborTile[0] !== tileCoordinate[0] &&
        neighborTile[1] !== tileCoordinate[1]
    );

    const availableTilesToMoveBishop: Array<Tile[]> = [];

    neighborTiles.forEach((neighborTileCoordinate, index) => {
      const neighborTile = tileGraph.getTileByVertex(neighborTileCoordinate);

      availableTilesToMoveBishop.push([neighborTile]);

      const diagonalTileCoordinates = this.getDiagonals(
        tileCoordinate,
        neighborTileCoordinate,
        tileGraph
      );

      for (const diagonalTileCoordinate of diagonalTileCoordinates) {
        const diagonalTile = tileGraph.getTileByVertex(diagonalTileCoordinate);

        availableTilesToMoveBishop[index].push(diagonalTile);
      }
    });

    return availableTilesToMoveBishop;
  }

  getDiagonals(
    previousTileCoordinate: Coordinate,
    tileCoordinate: Coordinate,
    tileGraph: TileGraph
  ) {
    const diagonalCoordinates = [
      ...tileGraph.getNeighbors(tileCoordinate),
    ].filter(
      (diagonalCoordinate) =>
        diagonalCoordinate[0] !== tileCoordinate[0] &&
        diagonalCoordinate[1] !== tileCoordinate[1] &&
        diagonalCoordinate[0] !== previousTileCoordinate[0] &&
        diagonalCoordinate[1] !== previousTileCoordinate[1]
    );

    if (diagonalCoordinates.length) {
      diagonalCoordinates.map((diagonalCoordinate) => {
        diagonalCoordinates.push(
          ...this.getDiagonals(tileCoordinate, diagonalCoordinate, tileGraph)
        );
      });
    }

    return diagonalCoordinates;
  }

  getMovesForRook(
    tileCoordinate: Coordinate,
    tileGraph: TileGraph
  ): Array<Tile[]> {
    const neighborTiles: Coordinate[] = [
      ...tileGraph.getNeighbors(tileCoordinate),
    ].filter(
      (neighborTile) =>
        neighborTile[0] === tileCoordinate[0] ||
        neighborTile[1] === tileCoordinate[1]
    );

    const availableTilesToMoveRook: Array<Tile[]> = [];

    neighborTiles.forEach((neighborTileCoordinate, index) => {
      availableTilesToMoveRook.push([]);

      const { iterableIndex, bindingIndex, indexName, seed } =
        this.getIterableAndBindingIndex(tileCoordinate, neighborTileCoordinate);

      for (const coordinate of this.generateMove(
        iterableIndex,
        bindingIndex,
        indexName,
        seed
      )) {
        const tile = tileGraph.getTileByVertex(coordinate as Coordinate);

        availableTilesToMoveRook[index].push(tile);
      }
    });

    return availableTilesToMoveRook;
  }

  getIterableAndBindingIndex(
    onCoordinate: Coordinate,
    neighborTileCoordinate: Coordinate
  ): {
    iterableIndex: number;
    bindingIndex: string;
    indexName: "rank" | "file";
    seed: number;
  } {
    if (onCoordinate[0] === neighborTileCoordinate[0]) {
      return {
        iterableIndex: +neighborTileCoordinate[1],
        bindingIndex: neighborTileCoordinate[0],
        indexName: "rank",
        seed: +onCoordinate[1] + 1 === +neighborTileCoordinate[1] ? 1 : -1,
      };
    }

    const tileCoordinateCode = neighborTileCoordinate[0].charCodeAt(0);

    return {
      iterableIndex: tileCoordinateCode,
      bindingIndex: neighborTileCoordinate[1],
      indexName: "file",
      seed:
        onCoordinate.charCodeAt(0) + 1 ===
        neighborTileCoordinate[0].charCodeAt(0)
          ? 1
          : -1,
    };
  }

  movePiece(
    targetTile: Tile,
    previouslyFocusedTileWithPiece: Tile | null
  ): boolean {
    if (!targetTile || !previouslyFocusedTileWithPiece) return false;
    targetTile.getPieceFromAnotherTile(previouslyFocusedTileWithPiece);
    return true;
  }

  capturePiece(
    targetTile: Tile,
    previouslyFocusedTileWithPiece: Tile | null
  ): boolean {
    if (!targetTile || !previouslyFocusedTileWithPiece) return false;

    targetTile.getPieceFromAnotherTile(previouslyFocusedTileWithPiece, true);
    return true;
  }

  registerMoveAndCanAdvance(
    tile: Tile,
    playerTurn: PlayerType,
    availableTilesToMovePiece: Tile[]
  ): boolean {
    if (tile.hasPiece) {
      if (tile.player === playerTurn) return false;

      availableTilesToMovePiece.push(tile);
      return false;
    }

    availableTilesToMovePiece.push(tile);

    return true;
  }

  *generateMove(
    iterableIndex: number,
    bindingIndex: string,
    indexName: "file" | "rank",
    seed: number
  ) {
    const maxIndex =
      indexName === "file" ? BOARD.END_FILE_INDEX : BOARD.END_RANK_INDEX;
    const minIndex =
      indexName === "file" ? BOARD.START_FILE_INDEX : BOARD.START_RANK_INDEX;

    for (
      iterableIndex;
      seed > 0 ? iterableIndex <= maxIndex : iterableIndex >= minIndex;
      iterableIndex += seed
    ) {
      yield indexName === "file"
        ? `${String.fromCharCode(iterableIndex)}${bindingIndex}`
        : `${bindingIndex}${iterableIndex}`;
    }
  }

  getMovesForKing(tileCoordinate: Coordinate, tileGraph: TileGraph) {
    const neighborTileCoordinates = [...tileGraph.getNeighbors(tileCoordinate)];

    const availableTilesToMoveKing: Array<Tile[]> = [];
    neighborTileCoordinates.forEach((neighborTileCoordinate) => {
      const neighborTile = tileGraph.getTileByVertex(neighborTileCoordinate);
      availableTilesToMoveKing.push([neighborTile]);
    });

    return availableTilesToMoveKing;
  }

  getMovesForQueen(tileCoordinate: Coordinate, tileGraph: TileGraph) {
    return [
      ...this.getMovesForBishop(tileCoordinate, tileGraph),
      ...this.getMovesForRook(tileCoordinate, tileGraph),
    ];
  }

  // Checks Whether a Piece (Like Queen, Bishop etc...) can able to Check the Opponent's King, but some other Pieces are on the Way blocking the Path, So Storing that in Internal States to Avoid Players Accidentally Moving such pieces that exposes their King to Check
  latentCheck(
    targetPiece: Piece,
    kingCoordinates: KingCoordinates,
    playerTurn: PlayerType,
    tileGraph: TileGraph
  ) {
    const potentialBlockerTiles: Tile[] = [];

    for (let latentMoveTiles of targetPiece.nextLatentMove) {
      let latentMoveTileIndex = latentMoveTiles.length - 1;
      let hasFoundKing = false;
      let hasTargetPieceTileIncluded = false;
      for (
        latentMoveTileIndex;
        latentMoveTileIndex >= 0;
        latentMoveTileIndex--
      ) {
        if (
          latentMoveTiles[latentMoveTileIndex].getCoordinate() ===
          kingCoordinates[`${playerTurn === "white" ? "black" : "white"}King`]
        ) {
          hasFoundKing = true;
          continue;
        }

        if (!hasFoundKing) continue;

        let tile = latentMoveTiles[latentMoveTileIndex];

        targetPiece.targetingOpponentKingViaTiles.add(tile);
        tile.piecesTargetingKingViaThisTile.set(targetPiece.id, targetPiece);

        if (!hasTargetPieceTileIncluded) {
          hasTargetPieceTileIncluded = true;
          targetPiece.targetingOpponentKingViaTiles.add(
            tileGraph.getTileByVertex(targetPiece.onTile)
          );
        }

        if (tile.hasPiece) {
          tile.pieceData?.blocking.set(targetPiece.id, targetPiece);
          tile.pieceData!.isProtectingKingFromOpponentLatentMove =
            tile.pieceData?.belongsTo !== playerTurn ? true : false;
          potentialBlockerTiles.push(tile);
        }
      }
    }

    if (potentialBlockerTiles.length > 1) {
      potentialBlockerTiles.forEach((blockerTile) => {
        blockerTile.pieceData!.isProtectingKingFromOpponentLatentMove = false;
      });
    }

    potentialBlockerTiles.map((blockerTile) =>
      targetPiece.blockerPieces.set(
        blockerTile.pieceData!.id,
        blockerTile.pieceData!
      )
    );
  }

  updateLatentCheck(
    targetTile: Tile,
    kingCoordinates: KingCoordinates,
    tileGraph: TileGraph
  ) {
    if (
      !targetTile.pieceData ||
      (!targetTile.pieceData.blocking.size &&
        !targetTile.piecesTargetingKingViaThisTile.size)
    )
      return;

    // If the Moved Piece has Blocked the Path of opponent piece, then We Update that Opponent Piece's Latent Check, because a Piece blocking its Way is moved and we need to Update it, so we can restrict to move the Last piece which is Protecting the King
    targetTile.pieceData.blocking.forEach((piece) => {
      this.latentCheck(piece, kingCoordinates, piece.belongsTo, tileGraph);
      piece.blockerPieces.delete(targetTile.pieceData!.id);
    });

    targetTile.pieceData.blocking.clear();

    targetTile.piecesTargetingKingViaThisTile.forEach((piece) =>
      this.latentCheck(piece, kingCoordinates, piece.belongsTo, tileGraph)
    );
  }

  // To Check and Update if Any Opponent Piece is Targeting the King Neighbor Tiles
  latentCheckForKingMoves(
    movedPiece: Piece,
    kingCoordinates: KingCoordinates,
    playerTurn: PlayerType,
    tileGraph: TileGraph
  ) {
    const neighborTilesOfOpponentKing = tileGraph.getNeighbors(
      playerTurn === "white"
        ? kingCoordinates["blackKing"]
        : kingCoordinates["whiteKing"]
    );

    for (let latentSide of movedPiece.nextLatentMove) {
      if (
        !latentSide.some((tile) => {
          neighborTilesOfOpponentKing.has(tile.getCoordinate());
        })
      )
        break;

      for (let latentMoveTile of latentSide) {
        latentMoveTile.piecesTargetingNeighborTilesOfKing.set(
          movedPiece.id,
          movedPiece
        );

        if (latentMoveTile.hasPiece && movedPiece.type !== "knight") {
          movedPiece.blockerPieces.set(
            latentMoveTile.pieceData!.id,
            latentMoveTile.pieceData!
          );

          latentMoveTile.pieceData!.blocking.set(movedPiece.id, movedPiece);
        }

        if (neighborTilesOfOpponentKing.has(latentMoveTile.getCoordinate())) {
          latentMoveTile.piecesTargetingNeighborTilesOfKing.set(
            movedPiece.id,
            movedPiece
          );

          break;
        }
      }
    }
  }
}
