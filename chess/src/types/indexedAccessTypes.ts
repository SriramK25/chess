import { readonlyCoordinates } from "../../data/coordinatesData";

export type Coordinates = typeof readonlyCoordinates;

export type Coordinate = (typeof readonlyCoordinates)[number];

export type Move = `${Coordinate}-${Coordinate}`;
