import './style.css'
import React, { Dispatch, SetStateAction } from 'react'

interface Props {
    setShowBoard: Dispatch<SetStateAction<boolean>>,
    setShowLobbyUi: Dispatch<SetStateAction<boolean>>
}

export const ChooseConnectivity = (props: Props) => {

    return (
        <div className='lobby-selection-choose-connectivity'>
            <button className='chess-button' onClick={() => props.setShowBoard(true)}>Play Locally</button>
            <button className='chess-button' onClick={() => props.setShowLobbyUi(true)}>Play Online</button>    
        </div>
    )
}
