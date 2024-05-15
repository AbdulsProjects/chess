import definedPieces, { Piece } from "../pieces"
import "./style.css"

interface Props {
    PromotePiece: (newPiece: Piece) => void,
    colour: 'black' | 'white'
}


export const Promotion = (prop: Props) => {

    const possiblePromotions = definedPieces.filter(piece => piece.id !== 'king' && !piece.canPromote)

    return (
        <div className="promotion-container top-mid-container">
            {possiblePromotions.map(piece => 
                <img key={piece.id} src={'img/' + prop.colour + '_' + piece.id +'.png'} alt={piece.name} onClick={() => prop.PromotePiece(piece)}/>
            )}
        </div>
    )
}