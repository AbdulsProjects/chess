import { useState } from 'react';
import { LobbySelection } from './lobby-selection'
import './style.css'
import { Chess } from './game';
import { WsContextProvider } from '../../contexts/wsContext';

export const ChessMain = () => {

    const [showBoard, setShowBoard] = useState(false);

    return (
        <WsContextProvider>
            <div id='main-container'>
                {showBoard ? <Chess /> : <LobbySelection setShowBoard={setShowBoard}/>}
            </div>
        </WsContextProvider>
    )
}
