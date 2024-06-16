import { Dispatch, SetStateAction, createContext, useRef, useState } from 'react';
import { Lobby } from '../server/socket';

export interface OnlineState {
    wsConn: WebSocket | null,
    clientId: string | undefined,
    colour: 'white' | 'black' | undefined,
    lobby: Lobby | undefined
}

export interface IWsContext {
    onlineState: OnlineState,
    setOnlineState: Dispatch<SetStateAction<OnlineState>>,
    Connect: () => void,
    createCallback: (method: string, callback: (response: any) => void) => void
};

export const WsContext = createContext<IWsContext | null>(null);

export const WsContextProvider: React.FC<{children: React.ReactNode}> = ({ children }: React.PropsWithChildren) => {
    
    const [onlineState, setOnlineState] = useState<OnlineState>({
        wsConn: null,
        clientId: undefined,
        colour: undefined,
        lobby: undefined
    });
    
    //Creating a hash map of callback functions to allow the response to be easily accessed within consuming components
    const callbacks = useRef<{[method: string]: (response: any) => void}>({});
    
    //Creating a function that can be used to append to the callBacks hash map
    const createCallback = (method: string, callback: (response: any) => void) => {
        callbacks.current[method] = callback;
    };

    const Connect = () => {

        const ws = new WebSocket('ws://localhost:8080');

        ws.onmessage = message => {
            
            const response = JSON.parse(message.data);
            
            //Executing the callback function if one is specified for the current method, allowing easier access to the response from consuming components
            if (callbacks.current[response.method]) {
                callbacks.current[response.method](response);
            };

            switch(response.method) {
                //Connecting to the server
                case 'connect': {
                    setOnlineState(prevState => ({
                        ...prevState,
                        wsConn: ws,
                        clientId: response.clientId
                    }));
                    break;
                }

                //Creating a lobby
                case 'create': {
                    if (response.status === 'failed') {
                        alert(response.message);
                        return;
                    };

                    setOnlineState(prevState => ({
                        ...prevState,
                        colour: 'white',
                        lobby: response.lobby
                    }));
                    break;
                }

                //Joining a lobby
                case 'join': {
                    if (response.status === 'succeeded') {
                        setOnlineState(prevState => ({
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
                        setOnlineState(prevState => ({
                            ...prevState,
                            lobby: response.lobby
                        }));
                    } else {
                        alert(response.message);
                    }
                    break;
                }

                //Cancelling your current suggestion
                case 'cancel-suggestion': {
                    setOnlineState(prevState => ({
                        ...prevState,
                        lobby: response.lobby
                    }));
                    break;
                }

                //Declining a suggestion
                case 'decline-suggestion': {
                    setOnlineState(prevState => ({
                        ...prevState,
                        lobby: response.lobby
                    }));

                    if (response.opponentDeclined) {
                        alert('Your opponent has declined your suggested board')
                    };

                    break;
                }
            };
        }

        ws.addEventListener("open", () => {
            
        })
    }

    return (
        <WsContext.Provider value={{onlineState, setOnlineState, Connect, createCallback}}>{children}</WsContext.Provider>
    )
}