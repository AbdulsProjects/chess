import './style.css'
import React from 'react'

interface Props {
    setShowPasswordInput: (value: boolean) => void
}

export const PasswordPopup = (props: Props) => {

    return (
        <>
            <div className='greyed-out'></div>
            <div className='password-popup-main-container'>
                <div className='password-popup-header'>
                    <p>Enter Lobby Password</p>
                    <button className='chess-button' onClick={() => props.setShowPasswordInput(false)}>X</button>
                </div>
                <div className='password-popup-body'>
                    <input type='text' />
                    <button className='chess-button'>Join</button>
                </div>
            </div>
        </>
    )
}