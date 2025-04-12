import { Move } from "../../types/indexedAccessTypes";
import { Player } from "../../types/unionTypes";

export default class GameState {
  static #instance: GameState | null = null;

  playerTurn: Player;
  history: Map<Player, Move[]>;

  private constructor(playerTurn: Player) {
    this.playerTurn = playerTurn;
    this.history = new Map();
  }

  static getInstance() {
    if (!this.#instance) this.#instance = new GameState("white");
    return this.#instance;
  }

  start(chessboardElement: Element) {
    this.listenToBoard(chessboardElement);
  }

  private listenToBoard(chessboardElement: Element): void {
    chessboardElement.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (
        !target.dataset.playableBy ||
        target.dataset.playableBy !== this.playerTurn
      ) {
        return;
      }

      target.parentElement?.classList.add("focused");
      this.allowPlayerToMovePiece(target);
    });
  }

  private allowPlayerToMovePiece(pieceElement: HTMLElement) {}

  static reset() {
    this.#instance = null;
    this.getInstance();
  }
}
