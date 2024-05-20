import './style.css'

import React from 'react'

export const LobbyUi = () => {

    return (
        <div className='lobby-ui-main-container'>
            <div className='lobby-ui-nav'>
                <button className='chess-button'>Create</button>
                <button className='chess-button'>Browse</button>
                <button className='chess-button'>Exit</button>
            </div>
            <div className="lobby-ui-content">

            </div>
        </div>
    )
}
