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
    const capturedPieces = props.capturedPieces[colour];

    return (
        <div className={'captured-pieces-main-container captured-pieces-main-container-' + props.position }>
            <div className='captured-pieces-header'>
                <h3>{props.position === 'left' ? 'White\'s' : 'Black\'s'} captured pieces</h3>
            </div>
            <div className='captured-pieces-list-container'>
                {capturedPieces.map(piece => 
                    <>
                        <div className="captured-pieces-piece-container">
                            {[...Array(piece.number)].map(i => 
                                <img className="captured-piece" src={"img/" + oppositeColour + '_' + piece.piece + '.png'} alt={oppositeColour + ' ' + piece.piece} />    
                            )}
                        </div>
                        <div className="captured-piece-count-container">
                            <p className='captured-piece-count'>x{piece.number}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
