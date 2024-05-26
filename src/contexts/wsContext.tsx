import { Dispatch, SetStateAction, createContext, useState } from 'react';

export interface OnlineState {
    wsConn: WebSocket | null,
    clientId: string | undefined,
    lobbyId: string | undefined
}

export interface IWsContext {
    onlineState: OnlineState,
    setOnlineState: Dispatch<SetStateAction<OnlineState>>,
    Connect: () => void
}

export const WsContext = createContext<IWsContext | null>(null);

export const WsContextProvider: React.FC<{children: React.ReactNode}> = ({ children }: React.PropsWithChildren) => {

    const [onlineState, setOnlineState] = useState<OnlineState>({
        wsConn: null,
        clientId: undefined,
        lobbyId: undefined
    });

    const Connect = () => {

        const ws = new WebSocket('ws://localhost:8080');

        ws.onmessage = message => {
            
            const response = JSON.parse(message.data);
            
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
                        lobbyId: response.lobby.lobbyId
                    }));
                    break;
                }

                //Joining a lobby
                case 'join': {
                    break;
                }

                //Returning the list of lobbies
                case 'return-lobbies': {
                    console.log(response);
                    break;
                }
            };

        }

        ws.addEventListener("open", () => {
            
        })

    }

    return (
        <WsContext.Provider value={{onlineState, setOnlineState, Connect}}>{children}</WsContext.Provider>
    )
}