import { Square } from '../../../board'
import './style.css'
import React, { useEffect } from 'react'

interface Props {
    squares: Square[] | undefined
};


export const SmallBoard = (props: Props) => {

    return (
        <div className='chess-board-small'>
            {props.squares && props.squares!.map((square) => {
                const altSquare = (square.id.charCodeAt(0) + Number(square.id[1])) % 2;
                return (
                    <div key={square.id} id={'suggestion-' + square.id} className={`square ${altSquare ? 'light-square': 'dark-square'}`} >
                        {square.piece && <img className='small-piece' src={'img/' + square.colour + '_' + square.piece + '.png'} alt={square.colour + ' ' + square.piece} />}
                    </div>
                )
            })}
            {(!props.squares || props.squares.length === 0) && [...Array(64)].map((x, i) => {
                const altSquare = ((i + 1) % 2) ^ ((i / 8) % 2);
                return (
                    <div key={`suggestion-square-${i}`} className={`square ${altSquare ? 'light-square': 'dark-square'}`} ></div>
                )
            })}
        </div>    
    )
}
