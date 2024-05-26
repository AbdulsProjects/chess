import { Dispatch, SetStateAction, useContext, useEffect } from 'react';
import './style.css'
import { IWsContext, WsContext } from '../../../../../contexts/wsContext';

interface Props {
    setShowLobbyUi: Dispatch<SetStateAction<boolean>>,
    setShowBoard: Dispatch<SetStateAction<boolean>>
}

export const BrowseLobbies = (props: Props) => {

    const { onlineState }  = useContext(WsContext) as IWsContext;

    //Returning the list of lobbies
    useEffect(() => {
        
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
        <div>This is a test</div>
    )
}