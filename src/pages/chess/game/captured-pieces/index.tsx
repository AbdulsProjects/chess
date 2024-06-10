import React from 'react'
import { CapturedPiece } from '..'
import './style.css'

interface Props {
    position: 'left' | 'right',
    capturedPieces: {
        black: CapturedPiece[],
        white: CapturedPiece[]
    }
}

export const CapturedPieces = (props: Props) => {

    const colour = props.position === 'left' ? 'white' : 'black';
    const oppositeColour = colour === 'black' ? 'white' : 'black';
    //Sorting the array to have the most valuable pieces sorted to the top
    const capturedPieces = [...props.capturedPieces[colour]].sort((a, b) => b.points - a.points);
    
    return (
        <div className={'chess-side-container chess-side-container-' + props.position }>
            <div className='captured-pieces-header'>
                <h3>{props.position === 'left' ? 'White\'s' : 'Black\'s'} captured pieces</h3>
            </div>
            <div className='captured-pieces-list-container'>
                {capturedPieces.map(piece => 
                    <React.Fragment key={piece.piece + '-fragment'}>
                        <div key={piece.piece + '-piece-container'} className="captured-pieces-piece-container">
                            {[...Array(piece.number)].map((item, index) => 
                                <img key={piece.piece + index} className="captured-piece" src={"img/" + oppositeColour + '_' + piece.piece + '.png'} alt={oppositeColour + ' ' + piece.piece} />    
                            )}
                        </div>
                        <div key={piece.piece + '-count-container'} className="captured-piece-count-container">
                            <p key={piece.piece + '-count'} className='captured-piece-count'>x{piece.number}</p>
                        </div>
                    </React.Fragment>
                )}
            </div>
        </div>
    )
}
