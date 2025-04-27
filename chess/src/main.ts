import Chessboard from "./patterns/singleton/chessboard";

const chessboard = Chessboard.getInstance();

console.log(chessboard);

setInterval(() => console.log(chessboard), 30000);
