import Player from "../patterns/factory/playerFactory";
import { Player as PlayerType } from "./unionTypes";

export type PlayersData = Map<PlayerType, Player>;
