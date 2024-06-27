import { Board } from "../board"
import { Square } from "./chess-models"

export interface Lobby {
    lobbyId: string,
    lobbyName: string,
    lobbyPassword: string | null,
    gameType: string,
    white: string | null,
    black: string | null,
    board: Board | null
    suggestedSquares: {
        white: Square[],
        black: Square[]
    }
}

export interface Lobbies {
    [lobbyId: string]: Lobby
}