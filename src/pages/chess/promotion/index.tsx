import definedPieces, { Piece } from "../pieces"
import "./style.css"
import React, { useEffect, useRef, useState } from 'react'

export const Promotion = ({PromotePiece = (newPiece: Piece) => {}}) => {

    const handlePromotion = () => {
        PromotePiece(definedPieces.find(piece => piece.id === 'queen')!);
    }

    return (
        <div className="promotion-container">
            <button onClick={handlePromotion}>Promote To Queen</button>
        </div>
    )
}