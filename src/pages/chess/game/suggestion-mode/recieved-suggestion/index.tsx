import './style.css'
import '../style.css'
import React from 'react'
import { SmallBoard } from '../small-board';
import { Board, Square } from '../../../board';

interface Props {
    PreviewBoard: (squares: Square[]) => void
};

export const RecievedSuggestion = (props: Props) => {

    const testBoard: Square[] = [];
    for (let i = 8; i > 0; i--) {
        for (let j = 65; j < 73; j++) {
            testBoard.push({
                id: String.fromCharCode(j) + i,
                piece: 'king',
                colour: 'white',
                x: j-64,
                y: i,
                firstTurn: false,
                targeting: [],
                targetedBy: {
                    black: [],
                    white: []
                }
            });
        };
    };

    return (
        <div className='chess-side-container chess-side-container-right suggestion-main-container'>
            <div className='suggestion-header'>
                <p>Opponent's Suggestion</p>
            </div>
            <SmallBoard squares={testBoard}/>
            <div className='suggestion-buttons'>
                <button className='chess-button'>Accept</button>
                <button className='chess-button suggestion-button-middle'>Decline</button>
                <button className='chess-button' onClick={() => props.PreviewBoard(testBoard)}>Preview</button>
            </div>
        </div>      
    )
};
