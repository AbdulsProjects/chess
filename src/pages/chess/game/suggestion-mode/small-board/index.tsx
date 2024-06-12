import { Square } from '../../../board'
import './style.css'
import React from 'react'

interface Props {
    squares: Square[]
};


export const SmallBoard = (props: Props) => {

    return (
        <div className='chess-board-small'>
            {props.squares.map((square) => {
                const altRow = (square.id.charCodeAt(0) + Number(square.id[1])) % 2;
                return (
                    <div key={square.id} id={'suggestion-' + square.id} className={`square ${altRow ? 'light-square': 'dark-square'}`} >
                        {square.piece && <img className='small-piece' src={'img/' + square.colour + '_' + square.piece + '.png'} alt={square.colour + ' ' + square.piece} />}
                    </div>
                )
            })}
        </div>    
    )
}
