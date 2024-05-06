import definedPieces, { Piece } from "../pieces"
import "./style.css"
import React, { useEffect, useRef, useState } from 'react'

export const Promotion = ({PromotePiece = (newPiece: Piece) => {}}) => {

    const possiblePromotions = definedPieces.filter(piece => piece.id !== 'king' && !piece.canPromote)

    return (
        <div className="promotion-container">
            {possiblePromotions.map(piece => 
                <button onClick={() => PromotePiece(piece)}>Promote to {piece.name}</button>
            )}
        </div>
    )
}