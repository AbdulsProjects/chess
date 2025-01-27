import './style.css'
import React from 'react'

interface Props {
    DragPiece: (e: React.DragEvent<HTMLElement>, colour: 'black' | 'white', piece: string) => void,
    StartGame: () => void,
    StandardGame: () => void,
    setShowPresets: React.Dispatch<React.SetStateAction<boolean>>,
    onlineGame: boolean
}

export const PreGame = (props: Props) => {
    
    return (
        <div className='pre-game-container top-mid-container'>
            <div className='pre-game-tray'>
                <div className='pre-game-piece-container'>
                    <img src='img/white_pawn.png' id='white pawn' alt='white pawn' onDragStart={(e) => props.DragPiece(e, 'white', 'pawn')}/>
                    <img src='img/white_rook.png' id='white rook' alt='white rook' onDragStart={(e) => props.DragPiece(e, 'white', 'rook')}/>
                    <img src='img/white_knight.png' id='white knight' alt='white knight' onDragStart={(e) => props.DragPiece(e, 'white', 'knight')}/>
                    <img src='img/white_bishop.png' id='white bishop' alt='white bishop' onDragStart={(e) => props.DragPiece(e, 'white', 'bishop')}/>
                    <img src='img/white_queen.png' id='white queen' alt='white queen' onDragStart={(e) => props.DragPiece(e, 'white', 'queen')}/>
                    <img src='img/white_king.png' id='white king' alt='white king' onDragStart={(e) => props.DragPiece(e, 'white', 'king')}/>
                </div>
                <div className="pre-game-piece-container">
                    <img src='img/black_pawn.png' id='black pawn' alt='black pawn' onDragStart={(e) => props.DragPiece(e, 'black', 'pawn')}/>
                    <img src='img/black_rook.png' id='black rook' alt='black rook' onDragStart={(e) => props.DragPiece(e, 'black', 'rook')}/>
                    <img src='img/black_knight.png' id='black knight' alt='black knight' onDragStart={(e) => props.DragPiece(e, 'black', 'knight')}/>
                    <img src='img/black_bishop.png' id='black bishop' alt='black bishop' onDragStart={(e) => props.DragPiece(e, 'black', 'bishop')}/>
                    <img src='img/black_queen.png' id='black queen' alt='black queen' onDragStart={(e) => props.DragPiece(e, 'black', 'queen')}/>
                    <img src='img/black_king.png' id='black king' alt='black king' onDragStart={(e) => props.DragPiece(e, 'black', 'king')}/>
                </div>
            </div>
            <div className='pre-game-button-container'>
                <button className='chess-button' onClick={() => alert('This feature is currently in development')}>Create Piece</button>
                <button className='chess-button' onClick={() => alert('This feature is currently in development')}>Import Piece</button>
                <button className='chess-button' onClick={() => props.setShowPresets(prevState => !prevState)}>Presets</button>
                {!props.onlineGame && <button className='chess-button' id='chess-start-button' onClick={props.StartGame}>Start Game</button>}
            </div>
        </div>
    )
}