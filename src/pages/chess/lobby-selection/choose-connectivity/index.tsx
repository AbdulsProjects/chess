import { IWsContext, WsContext } from '../../../../contexts/wsContext';
import './style.css'
import React, { Dispatch, SetStateAction, useContext } from 'react'

interface Props {
    setShowBoard: Dispatch<SetStateAction<boolean>>,
    setShowLobbyUi: Dispatch<SetStateAction<boolean>>
}

export const ChooseConnectivity = (props: Props) => {

    const { onlineState, Connect }  = useContext(WsContext) as IWsContext;

    return (
        <div className='lobby-selection-choose-connectivity'>
            <button className='chess-button' onClick={() => props.setShowBoard(true)}>Play Locally</button>
            <button className='chess-button' onClick={() => {
                props.setShowLobbyUi(true);
                if (!onlineState.wsConn) {Connect()}
                }}>Play Online</button>    
        </div>
    )
}
