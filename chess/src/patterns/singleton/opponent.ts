import { readonlyCoordinates } from "../../../data/coordinatesData";
import { Coordinate } from "../../types/indexedAccessTypes";
import TileGraph from "./tileGraph";

export default class Opponent {
  private static _instance: Opponent | null = null;
  private _tilegraph: TileGraph;
  private _player: Worker;
  private _fenCode = {
    pawn: "p",
    knight: "n",
    bishop: "p",
    rook: "r",
    queen: "q",
    king: "k",
  };

  private constructor(tileGraph: TileGraph) {
    this._player = new Worker("/engines/stockfish.js");
    this._player.postMessage("uci");
    this._player.postMessage("ready");

    this._tilegraph = tileGraph;

    this._player.onmessage = (event) => this.getMove(event);
  }

  static getInstance(tileGraph: TileGraph) {
    if (!this._instance) this._instance = new Opponent(tileGraph);
    return this._instance;
  }

  buildFEN(tileGraph: TileGraph) {
    let fenString = "";
    let emptyTileCount = 0;

    readonlyCoordinates.forEach((coordinate, index) => {
      const tile = tileGraph.getTileByVertex(coordinate);

      if (!tile.pieceData) emptyTileCount++;

      if (tile.pieceData) {
        if (emptyTileCount) {
          fenString += `${emptyTileCount}`;
          emptyTileCount = 0;
        }
        fenString +=
          tile.pieceData.belongsTo === "white"
            ? this._fenCode[tile.pieceData.type].toUpperCase()
            : this._fenCode[tile.pieceData.type];
      }

      if ((index + 1) % 8 === 0 && index + 1 !== 64) {
        fenString += emptyTileCount ? `${emptyTileCount}/` : "/";
        emptyTileCount = 0;
      }
    });

    fenString += " b - - 0 1";

    return fenString;
  }

  sendFEN(depth: number = 10) {
    const fenString = this.buildFEN(this._tilegraph);
    this._player.postMessage(`position fen ${fenString}`);
    this._player.postMessage(`go depth ${depth}`);
  }

  getMove(event: MessageEvent) {
    if (!event.data || typeof event.data !== "string" || !event.data.startsWith("bestmove")) return [];
    console.log(event.data);
    const bestMove = event.data.split(" ")[1];
    const fromCoordinate = bestMove.slice(0, 2) as Coordinate;
    const toCoordinate = bestMove.slice(2) as Coordinate;
    const targetCoordinates = [fromCoordinate, toCoordinate];

    const isValidMove = this.validateGeneratedMove(targetCoordinates);

    if (!isValidMove) {
      const recomputedDepth = this.recomputeDepth(10);
      this.sendFEN(recomputedDepth);
      return;
    }

    targetCoordinates.forEach((coordinate) => this._tilegraph.getTileByVertex(coordinate).element.click());
  }

  validateGeneratedMove(targetCoordinates: Coordinate[]): boolean {
    if (targetCoordinates.length !== 2) return false;

    return targetCoordinates.every((coordinate, index) => {
      const tile = this._tilegraph.getTileByVertex(coordinate);

      if (!tile) return false;
      else if (index === 0 && (!tile.hasPiece || tile.player !== "black")) return false;
      else if (index === 1 && tile.hasPiece && tile.player === "black") return false;
      else if (index === 1 && tile.hasPiece && tile.pieceData && tile.pieceData.belongsTo === "black")
        return false;

      return true;
    });
  }

  recomputeDepth(previousDepth: number): number {
    return Math.floor(previousDepth + Math.random() * 10);
  }
}
