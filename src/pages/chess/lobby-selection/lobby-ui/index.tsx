import { IWsContext, WsContext } from '../../../../contexts/wsContext';
import { BrowseLobbies } from './browse-lobbies';
import { CreateLobby } from './create-lobby'
import './style.css'
import React, { Dispatch, SetStateAction, useContext, useState } from 'react'

interface Props {
    setShowLobbyUi: Dispatch<SetStateAction<boolean>>,
    setShowBoard: Dispatch<SetStateAction<boolean>>
}

export const LobbyUi = (props: Props) => {

    const [showTab, setShowTab] = useState('Create');

    return (
        <div className='lobby-ui-main-container'>
            <div className='lobby-ui-nav'>
                <button className='chess-button' onClick={() => setShowTab('Create')}>Create</button>
                <button className='chess-button' onClick={() => setShowTab('Browse')}>Browse</button>
                <button className='chess-button' onClick={() => props.setShowLobbyUi(false)}>Exit</button>
            </div>
            <div className='lobby-ui-content'>
                {showTab === 'Create' && <CreateLobby setShowBoard={props.setShowBoard} setShowLobbyUi={props.setShowLobbyUi}/>}
                {showTab === 'Browse' && <BrowseLobbies setShowBoard={props.setShowBoard} setShowLobbyUi={props.setShowLobbyUi}/>}
            </div>
        </div>
    )
}
