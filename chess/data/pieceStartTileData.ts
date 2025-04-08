import { Coordinate } from "../src/types/indexedAccessTypes";

interface IPieceStartTile {
  white: {
    pawn: Coordinate[];
    rook: Coordinate[];
    knight: Coordinate[];
    bishop: Coordinate[];
    queen: Coordinate[];
    king: Coordinate[];
  };
  black: {
    pawn: Coordinate[];
    rook: Coordinate[];
    knight: Coordinate[];
    bishop: Coordinate[];
    queen: Coordinate[];
    king: Coordinate[];
  };
}

export const pieceStartTile: IPieceStartTile = {
  white: {
    pawn: ["a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2"],
    rook: ["a1", "h1"],
    knight: ["b1", "g1"],
    bishop: ["c1", "f1"],
    queen: ["d1"],
    king: ["e1"],
  },
  black: {
    pawn: ["a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7"],
    rook: ["a8", "h8"],
    knight: ["b8", "g8"],
    bishop: ["c8", "f8"],
    queen: ["d8"],
    king: ["e8"],
  },
} as const;
