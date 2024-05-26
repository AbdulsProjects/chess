import { useState } from 'react';
import { LobbySelection } from './lobby-selection'
import './style.css'
import { Chess } from './game';
import { OnlineState } from '../../contexts/wsContext';

export const ChessMain = () => {

    const [showBoard, setShowBoard] = useState(false);

    return (
        <div className='main-container'>
            {showBoard ? <Chess /> : <LobbySelection setShowBoard={setShowBoard}/>}
        </div>
    )
}
