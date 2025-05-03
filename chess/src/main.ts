import Chessboard from "./patterns/singleton/chessboard";
import { Coordinate } from "./types/indexedAccessTypes";

const chessboard = Chessboard.getInstance();

// console.log(chessboard);

// setInterval(() => console.log(chessboard), 30000);

function tile(tile: Coordinate) {
  if (!tile) return;
  console.log(chessboard.getTileData(tile));
}

document.addEventListener("keypress", (event) => {
  if (event.key !== "Enter") return;
  const input = document.querySelector("input");
  tile(input?.value as Coordinate);
  input!.value = "";
});
