import { Square } from '../../../board'
import './style.css'
import React from 'react'

interface Props {
    squares: Square[]
};


export const SmallBoard = (props: Props) => {

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
        <div className='chess-board-small'>
            {testBoard.map((square) => {
                const altRow = (square.id.charCodeAt(0) + Number(square.id[1])) % 2;
                return (
                    <div key={square.id} id={'suggestion-' + square.id} className={`square ${altRow ? 'light-square': 'dark-square'}`} >
                        <img className='small-piece' src={'img/' + square.colour + '_' + square.piece + '.png'} alt={square.colour + ' ' + square.piece} />
                    </div>
                )
            })}
        </div>    
    )
}
