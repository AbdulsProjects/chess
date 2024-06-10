import { IWsContext, WsContext } from '../../../../../contexts/wsContext'
import './style.css'

import React, { Dispatch, SetStateAction, useContext, useEffect } from 'react'

interface Props {
    setShowLobbyUi: Dispatch<SetStateAction<boolean>>,
    setShowBoard: Dispatch<SetStateAction<boolean>>
}

export const CreateLobby = (props: Props) => {
    
    const { onlineState }  = useContext(WsContext) as IWsContext;

    useEffect(() => {
        //Checking the suggestion radio button by default
        (document.getElementById('suggestion') as HTMLInputElement).checked = true;
    }, [])

    //Displaying the board once the lobby is created
    useEffect(() => {
        if (onlineState.lobbyId) {
            props.setShowBoard(true);
            props.setShowLobbyUi(false);
        }
    }, [onlineState])

    const CreateLobby = (lobbyName: string, lobbyPassword: string | null, gameType: 'sandbox' | 'suggestion' | 'restricted') => {
        
        const payLoad = {
            method: 'create',
            clientId: onlineState.clientId,
            lobbyName: lobbyName,
            lobbyPassword: lobbyPassword === '' ? null : lobbyPassword,
            gameType: gameType
        }

        onlineState.wsConn!.send(JSON.stringify(payLoad));
    }

    const CreateLobbyButton = () => {
        
        const lobbyName: HTMLInputElement = (document.getElementById('lobby-name')! as HTMLInputElement);
        if (!lobbyName.value) {
            alert('You must enter a lobby name to create a lobby');
            return;
        }

        const lobbyPassword: HTMLInputElement = (document.getElementById('lobby-password')! as HTMLInputElement);
        const lobbyMode: HTMLInputElement = (document.querySelector('input[name="game_type"]:checked')! as HTMLInputElement);
        
        CreateLobby(lobbyName.value, lobbyPassword.value, (lobbyMode.value as 'sandbox' | 'suggestion' | 'restricted'));
    }
    
    return (
        <div className='create-lobby-container'>
            <h3>Create Lobby</h3>
            <div className='lobby-ui-row'>
                <label htmlFor=''>Lobby Name</label>
                <input id='lobby-name' type='text' />
            </div>
            <div className='lobby-ui-row'>
                <label htmlFor=''>Lobby Password (optional)</label>
                <input id='lobby-password' type='text' />
            </div>
            <label htmlFor=''>Game type</label>
            <div className="lobby-ui-radio-container">
                <input type='radio' id='sandbox' name='game_type' value='sandbox' checked={true}/>
                <label htmlFor='sandbox' title='Either player can place any piece anywhere'>Sandbox</label>
                <input type='radio' id='suggestion' name='game_type' value='suggestion' disabled/>
                <label htmlFor='suggestion' title='One player decides where all pieces will start'>Suggestion</label>
                <input type='radio' id='restricted' name='game_type' value='restricted' disabled/>
                <label htmlFor='restricted' title='Sandbox but only allow pieces to start on the first 2 rows for each player'>Restricted</label>
            </div>
            <div className='create-lobby-button-container'>
                <button className='chess-button create-lobby-button' onClick={() => CreateLobbyButton()}>Create Lobby</button>
            </div>
        </div>
    )
}
