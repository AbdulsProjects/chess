import { useState } from 'react';
import { LobbySelection } from './lobby-selection'
import './style.css'
import { Chess } from './game';

export const ChessMain = () => {

    const [showBoard, setShowBoard] = useState(false);

    return (
        <div id='main-container'>
            {showBoard ? <Chess /> : <LobbySelection setShowBoard={setShowBoard}/>}
        </div>
    )
}
