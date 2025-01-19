import { Dispatch, SetStateAction, createContext, useRef, useState } from 'react';
import { Lobby } from '@react-chess/shared/src/chess/models/server-models';
import { Board } from '@react-chess/shared/src/chess/board'

export interface OnlineState {
    wsConn: WebSocket | null,
    clientId: string | undefined,
    colour: 'white' | 'black' | undefined,
    lobby: Lobby | undefined
}

export interface IWsContext {
    onlineState: OnlineState,
    setOnlineStateCustom: (generateNewState: (prevState: OnlineState) => OnlineState) => void,
    Connect: () => void
};

export const WsContext = createContext<IWsContext | null>(null);

export const WsContextProvider: React.FC<{children: React.ReactNode}> = ({ children }: React.PropsWithChildren) => {
    
    const [onlineState, setOnlineState] = useState<OnlineState>({
        wsConn: null,
        clientId: undefined,
        colour: undefined,
        lobby: undefined
    });

    //Custom set state hook used to initialise the board as an instance of the class if needed
    const setOnlineStateCustom = (generateNewState: (prevState: OnlineState) => OnlineState) => {
        setOnlineState((prevState) => {
            const newState = generateNewState(prevState);

            //This captures scenarios where the board isn't actually initialised as an instance of Board
            if (newState.lobby?.board && newState.lobby.board.squares === undefined) {
                const boardAsAny: any = newState.lobby.board
                const { _squares, _outcome, _gameState } = boardAsAny;
                const newBoard = new Board(_squares, _outcome, _gameState);

                newState.lobby.board = newBoard;
            }

            return{
                ...generateNewState(prevState)
            }
        });
    }

    const Connect = () => {

        //TODO: Create proper prod deployment process. websocket address is: https://free-sour-slug.glitch.me
        const ws = new WebSocket('ws://localhost:8080');
        let isAlive = false;

        //Closing the connection if no ping is recieved in the interval
        const heartbeat = setInterval(() => {
            if (!isAlive) {
                alert('You have been disconnected from the server. Please restart and try again');
                clearInterval(heartbeat);
                setOnlineState({
                    wsConn: null,
                    clientId: undefined,
                    colour: undefined,
                    lobby: undefined
                });
                isAlive = false;
                ws.close();
            }
        }, 20000)

        ws.onmessage = message => {

            const response = JSON.parse(message.data);
            switch(response.method) {
                //Heartbeat
                case 'ping': {
                    isAlive = true;
                    const payload = {
                        method: 'pong',
                        clientId: response.clientId
                    };
            
                    ws.send(JSON.stringify(payload));
                    break;
                }
                
                //Connecting to the server
                case 'connect': {
                    setOnlineStateCustom(prevState => ({
                        ...prevState,
                        wsConn: ws,
                        clientId: response.clientId
                    }));
                    isAlive = true;
                    break;
                }

                //Creating a lobby
                case 'create': {
                    if (response.status === 'failed') {
                        alert(response.message);
                        return;
                    };

                    setOnlineStateCustom(prevState => ({
                        ...prevState,
                        colour: 'white',
                        lobby: response.lobby
                    }));
                    break;
                }

                //Joining a lobby
                case 'join': {
                    if (response.status === 'succeeded') {                        
                        setOnlineStateCustom(prevState => ({
                            ...prevState,
                            colour: response.colour,
                            lobby: response.lobby
                        }));
                    } else {
                        alert(response.message);
                    }
                    break;
                }

                //Suggesting a board in the suggestion game type
                case 'suggest-board': {
                    if (response.status === 'succeeded') {
                        setOnlineStateCustom(prevState => ({
                            ...prevState,
                            lobby: response.lobby
                        }));
                    } else {
                        alert(response.message);
                    }
                    break;
                }

                //Cancelling / accepting your current suggestion
                case 'set-lobby': {
                    setOnlineStateCustom(prevState => ({
                        ...prevState,
                        lobby: response.lobby
                    }));
                    break;
                }

                //Declining a suggestion
                case 'decline-suggestion': {
                    setOnlineStateCustom(prevState => ({
                        ...prevState,
                        lobby: response.lobby
                    }));

                    if (response.opponentDeclined) {
                        alert('Your opponent has declined your suggested board')
                    };

                    break;
                }

                case 'opponent-disconnected': {
                    alert("Your opponent has left the lobby");
                    break;
                }

                case 'request-move': {
                    setOnlineStateCustom(prevState => ({
                        ...prevState,
                        lobby: response.lobby
                    }));
                    break;
                }
                
                case 'promote-piece': {
                    setOnlineStateCustom(prevState => ({
                        ...prevState,
                        lobby: response.lobby
                    }));
                    break;
                }

                case 'restart-game': {
                    setOnlineStateCustom(prevState => ({
                        ...prevState,
                        lobby: response.lobby
                    }));
                    break;
                }
            };
        }
    }

    return (
        <WsContext.Provider value={{onlineState, setOnlineStateCustom, Connect}}>{children}</WsContext.Provider>
    )
}