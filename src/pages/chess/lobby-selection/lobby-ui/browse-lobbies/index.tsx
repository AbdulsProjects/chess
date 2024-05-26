import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import './style.css'
import { IWsContext, WsContext } from '../../../../../contexts/wsContext';
import { Lobbies } from '../../../../../server/socket';

interface Props {
    setShowLobbyUi: Dispatch<SetStateAction<boolean>>,
    setShowBoard: Dispatch<SetStateAction<boolean>>
}

export const BrowseLobbies = (props: Props) => {

    const [lobbies, setLobbies] = useState<Lobbies>({});

    const { onlineState, createCallback }  = useContext(WsContext) as IWsContext;

    //Returning the list of lobbies
    useEffect(() => {
        
        //Creating the callback function to save the lobbies to state
        createCallback('return-lobbies', (response) => {
            setLobbies(response.lobbies);
        })

        //Sending th request to return the lobbies
        const payLoad = {
            method: 'return-lobbies',
            clientId: onlineState.clientId,
        }

        onlineState.wsConn!.send(JSON.stringify(payLoad));
    }, [])

    const JoinLobby = () => {
        
        const payLoad = {
            method: 'join',
            clientId: onlineState.clientId,
            lobbyId: (document.getElementById('lobby-id') as HTMLInputElement)!.value
        }
        
        onlineState.wsConn!.send(JSON.stringify(payLoad));
    }

    return (
        <div>
            {Object.keys(lobbies).map(lobbyId => 
                <div>{lobbies[lobbyId].lobbyName}</div>
            )}
            <button onClick={() => console.log(lobbies)}></button>
        </div>
    )
}