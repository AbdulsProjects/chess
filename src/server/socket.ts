import http from 'http';
import { connection, server } from 'websocket';
import crypto from 'crypto';
import { Square } from '../utils/models';

interface Clients {
    [clientId: string]: {
        connection: connection,
        lobbyId: string | null
    }
}

interface Lobbies {
    [lobbyId: string]: {
        lobbyId: string,
        whitePlayer: string | null,
        blackPlayer: string | null,
        board: Square[]
    }
}

const clients: Clients = {};
const lobbies: Lobbies = {};

const httpServer = http.createServer();
httpServer.listen(8080, () => console.log('Listening'));

const wsServer = new server({
    'httpServer': httpServer
})

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
                        
                    const lobbyId: string = crypto.randomUUID();

                    lobbies[lobbyId] = {
                        lobbyId: lobbyId,
                        whitePlayer: clientId,
                        blackPlayer: null,
                        board: result.board
                    };

                    clients[clientId].lobbyId = lobbyId;

                    const payLoad = {
                        method: 'create',
                        lobby: lobbies[lobbyId]
                    };

                    clients[clientId].connection.send(JSON.stringify(payLoad));
                    break;
                }

                //Joining a game
                case 'join': {
                    const lobbyId: string = result.lobbyId;

                    //Lobby is already full
                    if (lobbies[lobbyId].blackPlayer && lobbies[lobbyId].whitePlayer) {
                        const payLoad = {
                            method: 'join',
                            game: null,
                            status: 'failed',
                            message: 'This lobby is full'
                        };

                        clients[clientId].connection.send(JSON.stringify(payLoad));
                        return;
                    }

                    //Updating the client and game to show that the client has joined
                    clients[clientId].lobbyId = lobbyId;

                    if (lobbies[lobbyId].whitePlayer !== null) {
                        lobbies[lobbyId].blackPlayer = clientId;
                    } else {
                        lobbies[lobbyId].whitePlayer = clientId;
                    }

                    //Sending the payload to the client
                    const payLoad = {
                        method: 'join',
                        lobby: lobbies[lobbyId],
                        status: 'succeeded',
                        message: null
                    };

                    clients[clientId].connection.send(JSON.stringify(payLoad));
                    break;
                }
            }

        }
    });

    //Generate an Id for the client
    const clientId: string = crypto.randomUUID();
    clients[clientId] = {
        connection: connection,
        lobbyId: null
    };

    const payLoad = {
        method: 'connect',
        clientId: clientId
    };

    connection.send(JSON.stringify(payLoad));

})