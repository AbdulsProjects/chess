import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import './style.css'
import { IWsContext, WsContext } from '../../../../../contexts/wsContext';
import { Lobbies } from '@react-chess/shared/src/chess/models/server-models';
import { PasswordPopup } from './password-popup';

interface Props {
    setShowLobbyUi: Dispatch<SetStateAction<boolean>>,
    setShowBoard: Dispatch<SetStateAction<boolean>>
}

export const BrowseLobbies = (props: Props) => {

    const [lobbies, setLobbies] = useState<Lobbies>({});

    const { onlineState }  = useContext(WsContext) as IWsContext;

    const [showPasswordInput, setShowPasswordInput] = useState(false);

    const [joiningLobbyId, setJoiningLobbyId] = useState<string | null>(null);

    //Returning the list of lobbies
    useEffect(() => {
        
        //Creating the callback function to save the lobbies to state
        onlineState.wsConn?.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            if (data.method === 'return-lobbies') {
                setLobbies(data.lobbies);
            };
        });

        //Sending the request to return the lobbies
        const payLoad = {
            method: 'return-lobbies',
            clientId: onlineState.clientId,
        };

        onlineState.wsConn!.send(JSON.stringify(payLoad));
    }, [])

    //Displaying the board once a lobby has been joined
    useEffect(() => {
        if (onlineState.lobby?.lobbyId) {
            props.setShowBoard(true);
            props.setShowLobbyUi(false);
        }
    }, [onlineState])

    //Clearing the joining LobbyId if the password popup isnt visible
    useEffect(() => {
        if (!showPasswordInput) {
            setJoiningLobbyId(null);
        }
    }, [showPasswordInput]);

    const JoinLobby = (lobbyId: string) => {
        
        const payLoad = {
            method: 'join',
            clientId: onlineState.clientId,
            lobbyId: lobbyId,
            lobbyPassword: null
        };
        
        onlineState.wsConn!.send(JSON.stringify(payLoad));
    }

    const JoinlobbyButton = (lobbyId: string) => {
        
        const lobby = lobbies[lobbyId];
        
        if (lobby.lobbyPassword) {
            setJoiningLobbyId(lobbyId);
            setShowPasswordInput(true);
        } else {
            JoinLobby(lobbyId);
        }
    }

    const RefreshLobbies = () => {
            //Sending the request to return the lobbies
            const payLoad = {
                method: 'return-lobbies',
                clientId: onlineState.clientId,
            }
    
            onlineState.wsConn!.send(JSON.stringify(payLoad));
    }

    const gameTypeAbbr = {
        sandbox: 'Either player can place any piece anywhere',
        suggestion: 'One player decides where all pieces will start',
        restricted: 'Sandbox but only allow pieces to start on the first 2 rows for each player'
    }

    return (
        <div className='browse-lobbies-main-container'>
            {showPasswordInput && <PasswordPopup setShowPasswordInput={setShowPasswordInput} joiningLobbyId={joiningLobbyId}/>}
            <div className='browse-lobbies-header'>
                <button className='refresh-button chess-button' onClick={() => RefreshLobbies()}><img src="img/icon-refresh.webp" alt="Refresh" /></button>
            </div>
            <div className='all-lobbies-container'>
                {Object.keys(lobbies).map(lobbyId => 
                    <>
                        <div className='lobby-container'>
                            <div>
                                <div className='lobby-container-row'>
                                    <p>Lobby Name: {lobbies[lobbyId].lobbyName}</p>
                                </div>
                                <div className='lobby-container-row'>
                                    <p>Game Type: <p className='browse-lobbies-game-type' title={gameTypeAbbr[lobbies[lobbyId].gameType as 'sandbox' | 'suggestion' | 'restricted']}>{lobbies[lobbyId].gameType}</p></p>
                                </div>
                                <div className='lobby-container-row'>
                                    <p>Password: <input type='checkbox' checked={lobbies[lobbyId].lobbyPassword === 'true'}/></p>
                                </div>
                            </div>
                            <button className='chess-button' onClick={() => JoinlobbyButton(lobbyId)}>Join</button>
                        </div>
                        <hr className='browse-lobbies-divider' />
                    </>
                )}
            </div>
        </div>
    )
}