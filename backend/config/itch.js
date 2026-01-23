import { ITCH_TOKEN } from "./env.js";

export const ITCH_BASE = `https://itch.io/api/1/${ITCH_TOKEN}`;
export const ITCH_GAMES = `${ITCH_BASE}/my-games`;
export const ITCH_GAME = (id) => `${ITCH_BASE}/game/${id}`;

