import './style.css'
import '../style.css'
import React from 'react'
import { SmallBoard } from '../small-board';

export const SentSuggestion = () => {

    return (
        <div className='chess-side-container chess-side-container-left suggestion-main-container'>
            <div className='suggestion-header'>
                <p>Your Suggestion</p>
            </div>
            <SmallBoard squares={[]}/>
            <div className='suggestion-buttons'>
                <button className='chess-button suggestion-button-margin-right'>Cancel</button>
                <button className='chess-button suggestion-button-margin-left'>Suggest</button>
            </div>
        </div>      
    )
};
