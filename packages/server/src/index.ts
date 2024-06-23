import http from 'http';
import { connection, server } from 'websocket';
import crypto from 'crypto';
import { Board, Square } from '@react-chess/shared/src/chess/board';

interface Clients {
    [clientId: string]: {
        connection: connection,
        lobbyId: string | null,
        colour: 'black' | 'white' | null
    }
}

export interface Lobby {
    lobbyId: string,
    lobbyName: string,
    lobbyPassword: string | null,
    gameType: string,
    white: string | null,
    black: string | null,
    board: Board | null,
    suggestedSquares: {
        white: Square[],
        black: Square[]
    }
}

export interface Lobbies {
    [lobbyId: string]: Lobby
}
// "start": "concurrently \"npm run start-client\" \"npm run start-server\"",
const clients: Clients = {};
const lobbies: Lobbies = {};

const httpServer = http.createServer();
httpServer.listen(8080, () => console.log('Listening'));

const wsServer = new server({
    'httpServer': httpServer
})

const sendToMultipleClients = (clientIds: string[], payload: any) => {
    for (let i = 0; i < clientIds.length; i++) {
        clients[clientIds[i]].connection.send(JSON.stringify(payload));
    };
};

const obfuscateLobby = (lobby: Lobby): Lobby => {
    const obfuscatedLobby = { 
        ...lobby,
        lobbyPassword: lobby.lobbyPassword === null ? null : 'true',
        white: lobby.white === null ? null : 'true',
        black: lobby.black === null ? null : 'true'
    };
    return obfuscatedLobby;
};

wsServer.on('request', request => {
    const connection = request.accept(null, request.origin);

    connection.on('close', () => {
        delete clients[clientId];
    });
    
    connection.on('message', message => {
        if (message.type === 'utf8') {
            const result = JSON.parse(message.utf8Data);
            const clientId = result.clientId;

            switch(result.method) {
                //Creating a new game
                case 'create': {
                     
                    //Doesn't create a new game if a game with that name already exists
                    for (const lobbyId in lobbies) {
                        if (lobbies[lobbyId].lobbyName === result.lobbyName) {
                            const payload = {
                                method: 'create',
                                lobby: null,
                                status: 'failed',
                                message: 'A lobby with this name already exists'
                            };

                            clients[clientId].connection.send(JSON.stringify(payload));
                            return;
                        }
                    };

                    const lobbyId: string = crypto.randomUUID();
                    const newLobby = {
                        lobbyId: lobbyId,
                        lobbyName: result.lobbyName,
                        lobbyPassword: result.lobbyPassword,
                        gameType: result.gameType,
                        white: clientId,
                        black: null,
                        board: null,
                        suggestedSquares: {
                            white: [],
                            black: []
                        }
                    };

                    lobbies[lobbyId] = newLobby;

                    clients[clientId].lobbyId = lobbyId;
                    clients[clientId].colour = 'white';

                    const payload = {
                        method: 'create',
                        lobby: obfuscateLobby(newLobby),
                        status: 'succeeded',
                        message: null
                    };

                    clients[clientId].connection.send(JSON.stringify(payload));
                    break;
                }

                //Joining a game
                case 'join': {
                    
                    const lobbyId: string = result.lobbyId;

                    //Lobby password doesn't match the passed password
                    if (lobbies[lobbyId].lobbyPassword !== result.lobbyPassword) {
                        const payload = {
                            method: 'join',
                            game: null,
                            status: 'failed',
                            message: 'Incorrect password'
                        };
    
                        clients[clientId].connection.send(JSON.stringify(payload));
                        return;
                    }

                    //Lobby is already full
                    if (lobbies[lobbyId].black && lobbies[lobbyId].white) {
                        const payload = {
                            method: 'join',
                            game: null,
                            status: 'failed',
                            message: 'This lobby is full'
                        };

                        clients[clientId].connection.send(JSON.stringify(payload));
                        return;
                    }

                    //Updating the client and game to show that the client has joined
                    clients[clientId].lobbyId = lobbyId;

                    if (lobbies[lobbyId].white !== null) {
                        lobbies[lobbyId].black = clientId;
                        clients[clientId].colour = 'black';
                        } else {
                        lobbies[lobbyId].white = clientId;
                        clients[clientId].colour = 'white';
                    }

                    //Sending the payload to the client
                    const payload = {
                        method: 'join',
                        lobby: obfuscateLobby(lobbies[lobbyId]),
                        colour: clients[clientId].colour,
                        status: 'succeeded',
                        message: null
                    };

                    clients[clientId].connection.send(JSON.stringify(payload));
                    break;
                }

                //Returning all lobbies with obfuscated passwords and clientIds
                case 'return-lobbies': {
                    
                    const obfuscatedLobbies: Lobbies = structuredClone(lobbies);

                    for (var key of Object.keys(obfuscatedLobbies)) {
                        obfuscatedLobbies[key] = obfuscateLobby(obfuscatedLobbies[key]);
                    };

                    //Sending the payload to the client
                    const payload = {
                        method: 'return-lobbies',
                        lobbies: obfuscatedLobbies,
                    };

                    clients[clientId].connection.send(JSON.stringify(payload));
                    break;
                }

                //*********************** SUGGESTION GAME TYPE ***********************
                //Suggesting a board to the other player
                case 'suggest-board': {

                    const squares = result.squares;

                    if (squares.filter((square: Square) => square.piece === 'king' && square.colour === 'white').length !== 1 || squares.filter((square: Square) => square.piece === 'king' && square.colour === 'black').length !== 1) {
                        
                        const payload = {
                            method: 'suggest-board',
                            status: 'failed',
                            message: 'Each player must have exactly 1 king to start a game'
                        };

                        clients[clientId].connection.send(JSON.stringify(payload));
                        return;

                    };

                    const lobby = lobbies[result.lobbyId]!;
                    const client = clients[clientId];
                    lobby.suggestedSquares[client.colour as 'white' | 'black'] = result.squares;

                    const payload = {
                        method: 'suggest-board',
                        lobby: obfuscateLobby(lobby),
                        suggestingPlayer: result.clientId,
                        status: 'succeeded',
                        message: null
                    };

                    if (lobby.black && lobby.white) {
                        sendToMultipleClients([lobby.black, lobby.white], payload);
                    } else {
                        clients[clientId].connection.send(JSON.stringify(payload));
                    };

                    break;
                }

                //Cancelling a suggestion
                case 'cancel-suggestion': {

                    const lobby = lobbies[result.lobbyId]!;
                    const client = clients[clientId];

                    lobby.suggestedSquares[client.colour!] = [];

                    const payload = {
                        method: 'set-lobby',
                        lobby: obfuscateLobby(lobby),
                        status: 'succeeded',
                        message: null
                    };

                    if (lobby.black && lobby.white) {
                        sendToMultipleClients([lobby.black, lobby.white], payload);
                    } else {
                        clients[clientId].connection.send(JSON.stringify(payload));
                    };

                    break;
                }

                //Declining a suggestion
                case 'decline-suggestion': {
                    
                    const client = clients[clientId];
                    const lobby = lobbies[result.lobbyId]!;
                    lobby.suggestedSquares[client.colour === 'white' ? 'black' : 'white'] = [];

                    //Sending the payload to the player who declined
                    const payload = {
                        method: 'decline-suggestion',
                        lobby: obfuscateLobby(lobby),
                        opponentDeclined: false,
                        status: 'succeeded',
                        message: null
                    };

                    clients[clientId].connection.send(JSON.stringify(payload));

                    //Sending the payload to the player who's suggestion was declined. OpponentDeclined is set for an alert on the front end
                    if (lobby.black && lobby.white) {
                        const opponentId = clientId === lobby.black ? lobby.white : lobby.black;
                        payload.opponentDeclined = true;
                        clients[opponentId].connection.send(JSON.stringify(payload));
                    };

                    break;
                }

                //Accepting a suggestion
                case 'accept-suggestion': {

                    const client = clients[clientId];
                    const lobby = lobbies[result.lobbyId]!;
                    lobby.board = new Board([...lobby.suggestedSquares[client.colour === 'white' ? 'black' : 'white']]);
                    lobby.board.startGame;

                    //Clearing the suggested squares for both colours to reduce future payload sizes
                    lobby.suggestedSquares.white = [];
                    lobby.suggestedSquares.black = [];

                    const payload = {
                        method: 'set-lobby',
                        lobby: obfuscateLobby(lobby),
                        status: 'succeeded',
                        message: null
                    };

                    sendToMultipleClients([lobby.black!, lobby.white!], payload);

                    break;
                }
            }

        }
    });

    //Generate an Id for the client
    const clientId: string = crypto.randomUUID();
    clients[clientId] = {
        connection: connection,
        lobbyId: null,
        colour: null
    };

    const connectPayload = {
        method: 'connect',
        clientId: clientId
    };

    connection.send(JSON.stringify(connectPayload));

})