import './style.css'

import React from 'react'

export const CreateLobby = () => {
    return (
        <>
            <h3>Create Lobby</h3>
            <div className='lobby-ui-row'>
                <label htmlFor=''>Lobby Name</label>
                <input type='text' />
            </div>
            <div className='lobby-ui-row'>
                <label htmlFor=''>Lobby Password (optional)</label>
                <input type='text' />
            </div>
            <label htmlFor=''>Game type</label>
            <div className="lobby-ui-radio-container">
                <input type='radio' id='sandbox' name='game_type' value='Sandbox' />
                <label htmlFor='sandbox' title='Either player can place any piece anywhere'>Sandbox</label>
                <input type='radio' id='suggestion' name='game_type' value='Suggestion' />
                <label htmlFor='suggestion' title='One player decides where all pieces will start'>Suggestion</label>
                <input type='radio' id='restricted' name='game_type' value='Restricted' />
                <label htmlFor='restricted' title='Only allow pieces to start on the first 2 rows for each player'>Restricted</label>
            </div>
            <div className='create-lobby-button-container'>
                <button className='chess-button create-lobby-button'>Create Lobby</button>
            </div>
        </>
    )
}
