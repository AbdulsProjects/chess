import './style.css'
import '../style.css'
import React from 'react'
import { SmallBoard } from '../small-board';
import { Board } from '../../../board';

interface Props {
    PreviewBoard: (board: Board) => void
};

export const RecievedSuggestion = (props: Props) => {

    const callPreviewBoard = () => {
        //props.PreviewBoard
        console.log("test");
    }

    return (
        <div className='chess-side-container chess-side-container-right suggestion-main-container'>
            <div className='suggestion-header'>
                <p>Opponent's Suggestion</p>
            </div>
            <SmallBoard squares={[]}/>
            <div className='suggestion-buttons'>
                <button className='chess-button'>Accept</button>
                <button className='chess-button suggestion-button-margin-right suggestion-button-margin-left'>Decline</button>
                <button className='chess-button' onClick={callPreviewBoard}>Preview</button>
            </div>
        </div>      
    )
};
