import "./style.css"
import React, { useEffect, useRef, useState } from 'react'
import definedPieces, { Piece } from "./pieces"
import { Promotion } from "./promotion"
import { GameOver } from "./game-over"
import { PreGame } from "./pre-game"
import { CapturedPieces } from "./captured-pieces"
import { Board, Square, TargetingSquare } from "../board"

//THINGS TO DO
//Split the drop handler for on / off board
//Make a click handler work for placing pieces too
//Add a bin div element that can be used to remove pieces (add a double-click handler that does the same)

//LOOK INTO WHY THE PROMOTION WORKED WITH IMMEDIATE CHECKMATES IN THE CURRENT PROD VERSION AND NOT THIS ONE WITHOUT THE OVERRIDE

export interface CapturedPiece {
    piece: string,
    points: number,
    number: number
}

//Setting up the board
const localBoard: Square[] = [];
for (let i = 8; i > 0; i--) {
    for (let j = 65; j < 73; j++) {
        localBoard.push({
            id: String.fromCharCode(j) + i,
            piece: null,
            colour: null,
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

export function Chess() {

    //Setting up the state
    interface GameState {
        inProgress: boolean,
        currentPlayer: 'black' | 'white',
        promotions: {
            black: string[];
            white: string[]
        },
        capturedPieces: {
            black: CapturedPiece[],
            white: CapturedPiece[]
        }
    };

    interface UiVisibility {
        lobby: boolean
    };

    //Storing the board / game state in state
    const [board, setBoard] = useState<Board>(new Board(localBoard));
    const [gameState, setGameState] = useState<GameState>({
        inProgress: false,
        currentPlayer: 'white',
        promotions: {
            black: [],
            white: []
        },
        capturedPieces: {
            white: [],
            black: []
        }
    });

    const boardRef = useRef<Board>();
    const gameStateRef = useRef<GameState>(gameState);

    boardRef.current = board;
    gameStateRef.current = gameState;

    //Checking for promotions whenever the board is updated
    useEffect(() => {
    
        const promotions = boardRef.current!.checkForPromotions();

        //Removing promotion highlights from all pieces
        const highlightedSquares = document.getElementsByClassName("highlight-promote");
        for (let i = 0; i < highlightedSquares.length; i++) {
            highlightedSquares[i].classList.remove("highlight-promote");
        };

        //Adding promotion highlight to the first square in the array
        if ((promotions.white.length > 0 || promotions.black.length > 0) && gameState.inProgress) {
            const currentPromotionSquare = document.getElementById(promotions.white.length > 0 ? promotions.white[0] : promotions.black[0])!;
            currentPromotionSquare.classList.add("highlight-promote");
        };

        setGameState(prevState => ({
            ...prevState,
            promotions: promotions
        }));

    }, [board, gameState.inProgress]);

    //Checking if a player has won when the board is updated
    useEffect(() => {

        //Removing the previous check / check mate styling
        Array.from(document.querySelectorAll('.highlight-check')).forEach(
            square => square.classList.remove('highlight-check')
        );

        Array.from(document.querySelectorAll('.highlight-check-mate')).forEach(
            square => square.classList.remove('highlight-check-mate')
        );

        //Adding the check / checkmate styling if there's a check / checkmate
        if (board.outcome.checkmate || board.outcome.check) {
            
            const className = board.outcome.checkmate ? 'highlight-check-mate' : 'highlight-check';

            document.getElementById(board.outcome.target!.id)!.classList.add(className);
            
            for (let i = 0; i < board.outcome.targettedBy.length; i++) {
                document.getElementById(board.outcome.targettedBy[i])!.classList.add(className);
            };
        };
    }, [board]);

    //General Functions
    
    //This is used to update the HTML whenever the board in state is updated
    const setBoardAndHtml = (newBoard: Board) => {
        
        //Determining what squares have changed in the state
        const differentSquares: Square[] = newBoard.squares.filter((square) => {
            const prevSquare: Square = boardRef.current!.squares.find(prevSquare => prevSquare.id === square.id)!;
            return square.piece !== prevSquare.piece || square.colour !== prevSquare.colour;
            })
            
            //Updating the HTML of the changed squares
            differentSquares.map((square: Square): void => {
                
                const squareElement = document.getElementById(square.id)!;
                
                squareElement!.innerHTML = '';
                //Exitting if a piece was removed instead of replaced
                if (!square.piece) { return undefined; }
                
                //Handling squares where a piece was added
                //Generating the new img element
                let pieceImg = document.createElement('img');
                pieceImg.id = square.id + ' Piece';
                pieceImg.alt = square.colour + ' ' + square.piece
                pieceImg.src = 'img/' + square.colour + '_' + square.piece + '.png'
                pieceImg.addEventListener("dragstart", (e: any) => DragPiece(e, square.colour!, square.piece!));
                if (gameState.inProgress) {
                    pieceImg.addEventListener("click", (e) => SelectPiece(e));
                    pieceImg.addEventListener("dragstart", (e) => SelectPiece(e));
                    }
                    
                    //Appending the new img element to the square div
                    squareElement.appendChild(pieceImg);
                    
                    return undefined;
                    })
                    
                    //Updating the board in state
                    setBoard(newBoard);
    };
    
    //Used to promote a piece
    const PromotePiece = (newPiece: Piece) => {

        //Grabbing the piece to promote
        const newBoard = board.clone();
        const promotionSquareId = gameState.promotions.white.length > 0 ? gameState.promotions.white[0] : gameState.promotions.black[0];

        //Promoting the piece
        newBoard.promotePiece(newPiece, promotionSquareId, gameState.promotions.white.length + gameState.promotions.black.length <= 1);

        //Updating state
        setBoardAndHtml(newBoard);
    };

    //Returning a boolean to specify if the interactivity should be disabled
    const DisableInteractivity = (): boolean => {
        return gameStateRef.current.promotions.black.length > 0 || gameStateRef.current.promotions.white.length > 0 || boardRef.current!.outcome.stalemate || Boolean(boardRef.current!.outcome.checkmate);
    };

    //Event Handlers

    //Generic handlers
    //This prevents the squares from being dragged
    const DivPreventDefault = (e: DragEvent | React.DragEvent) => {
        if ((e.target as HTMLElement).nodeName === "DIV") {e.preventDefault()};
    };
    
    const HoverPiece = (e: React.DragEvent) => {
        e.preventDefault();
    };

    //Handlers for setting up a game
    const DragPiece = (e: React.DragEvent, colour: string, piece: string) => {
        e.dataTransfer.setData("Colour", colour);
        e.dataTransfer.setData("Piece", piece);
        
        //Grabbing the Ids
        e.dataTransfer.setData("pieceId", (e.target as HTMLElement).id)
        e.dataTransfer.setData("squareId", (e.target as HTMLElement).parentElement!.id)
    };

    const DropPiece = (e: React.DragEvent) => {

        //Stopping bubbling to allow for dropping a piece on / off the board to be differentiated
        e.stopPropagation();
        e.preventDefault();

        const colour = e.dataTransfer.getData("Colour");
        if (colour !== 'black' && colour !== 'white') { return; }
        const piece = e.dataTransfer.getData("Piece");
        const sourceSquareId = e.dataTransfer.getData('squareId');
        const sourceSquare = board.squares.find(square => square.id === sourceSquareId)!;

        //Grabbing the target square, and returning out of the function if the target square is the parent square
        let targetSquare: Square | undefined = undefined;
        if ((e.target as HTMLElement).nodeName ==='IMG') {
            if (document.getElementById(e.dataTransfer.getData("pieceId"))!.parentNode === (e.target as HTMLElement).parentNode) { return }
            targetSquare = board.squares.find(square => square.id === (e.target as HTMLElement).parentElement!.id)!;
        } else {
            targetSquare = board.squares.find(square => square.id === (e.target as HTMLElement).id)!;
        };

        //Moving the piece if a game is in progress, duplicating the piece if not
        const newBoard = board.clone();
        if(gameState.inProgress) {
            //Returning if trying to grab the other player's piece
            if (colour !== newBoard.gameState.currentPlayer) { return; }

            //Returning if trying to move to an invalid square
            const targeting = sourceSquare.targeting;
            const move = targeting.find(targettingSquares => targettingSquares.target === targetSquare!.id && targettingSquares.moveable);
            if (!move) { return; }

            //Checking if there is a piece in the target square, and appending/updating captured squares if there is

            const response = newBoard.requestMove(sourceSquare, targetSquare);

            if (response.succeeded && response.action) {
                const moveAudio = new Audio('audio/' + response.action + '.mp3');
                moveAudio.play();
            };
            
            //Updating the state / HTML
            setBoardAndHtml(newBoard);    
            RemoveHighlights();
        } else {
            //Adding the piece
            newBoard.addPiece([{squareId: targetSquare.id, pieceId: piece, colour: colour}], gameState.inProgress);
            setBoardAndHtml(newBoard);
            const addAudio = new Audio('audio/move-self.mp3');
            addAudio.play();
        };
    };

    const BinPiece = (e: DragEvent | React.DragEvent) => {

        //Returning out of the function if a game is in progress
        if (gameState.inProgress) { return; }
        
        //Grabbing the parent of the dragged element
        const parentElement = document.getElementById(e.dataTransfer!.getData("squareId"));
        
        //Returning out of the function if the piece is not on the board
        if (!parentElement?.classList.contains("square")) { return; }

        const newBoard = board.clone();
        newBoard.removePiece(parentElement.id);
        
        setBoardAndHtml(newBoard);
    };

    //Functions to set up different board types
    const StandardGame = () => {
        const newBoard = board.clone();
        newBoard.standardGame();
        setBoardAndHtml(newBoard);
    };

    //Functions  to start / play the game
    const StartGame = () => {

        const newBoard = board.clone();
        const response = newBoard.startGame();
        if (!response.succeeded) {
            alert(response.message);
            return;
        };

        //Updating the handlers of all pieces
        const pieces = document!.querySelectorAll('[id$=Piece]');//getElementsByClassName("piece");
        for (let i=0; i < pieces.length; i++) {
            pieces[i].addEventListener("click", (e) => SelectPiece(e));
            pieces[i].addEventListener("dragstart", (e) => SelectPiece(e));
        };

        setBoard(newBoard);

        //Updating state
        setGameState(prevState => ({
            ...prevState,
            inProgress: true
        }));
    };

    const SelectPiece = (e: Event) => {

        if (DisableInteractivity()) { return; }
        //Removing highlights from currently highlighted piece
        RemoveHighlights();

        //Selecting the piece / square
        const piece = (e.target as HTMLElement);
        if (!piece || !piece.parentElement) { return; }
        const squareName = piece.parentElement.id;
        const squareObj = boardRef.current!.squares.find(square => square.id === squareName);
        if (!squareObj) { return; }

        //Returning if trying to grab the other player's piece
        if (squareObj.colour !== gameStateRef.current.currentPlayer) { ;return }

        // //Adding a highlight to all possible moves
        piece.parentElement.classList.add("highlight-select");

        if (!squareObj.targeting) { return; }

        //Updating the HTML to indicate targettable squares
        squareObj.targeting.map((move: TargetingSquare): void => {
                const targetElement = document.getElementById(move.target)!;
                move.capture && move.moveable && targetElement.classList.add("highlight-capture");
                move.castling && targetElement.classList.add("highlight-castling");
                !move.capture && !move.castling && move.moveable && targetElement.classList.add("highlight-move");
                return undefined;
        });

    };

    //Removing the highlights from all squares
    const RemoveHighlights = () => {
        const squares = document.querySelectorAll('div[class*="highlight"]');
        for (let i=0; i < squares.length; i++) {
            squares[i].classList.remove("highlight-select");
            squares[i].classList.remove("highlight-move");
            squares[i].classList.remove("highlight-capture");
            squares[i].classList.remove("highlight-castling");
        }
    };

    return (
        <div className='chess-main-container' onDrop={BinPiece} onDragOver={DivPreventDefault} onDragStart={DivPreventDefault}>
            {gameState.inProgress && <CapturedPieces position='left' capturedPieces={gameState.capturedPieces}/>}
            {(board.outcome.checkmate || board.outcome.stalemate) && <GameOver outcome={board.outcome}/>}
            {(!gameState.inProgress && !(board.outcome.checkmate || board.outcome.stalemate)) && <PreGame DragPiece={DragPiece} StandardGame={StandardGame} StartGame={StartGame} />}
            {(gameState.promotions.white.length > 0 || gameState.promotions.black.length > 0) && gameState.inProgress && <Promotion PromotePiece={PromotePiece} colour={gameState.promotions.white.length > 0 ? 'white' : 'black'}/>}
            <div className="chess-container">
                <div className="y-labels">
                    {[...Array(8)].map((item, index) => 
                        <p key={'y-label-' + index}>{8 - index}</p>
                    )}
                </div>
                <div className="x-labels">
                    {[...Array(8)].map((item, index) => 
                        <p key={'x-label-' + index}>{String.fromCharCode(index + 65)}</p>
                    )}
                </div>
                <div className='chess-board'>
                    {board.squares.map((square) => {
                        const altRow = (square.id.charCodeAt(0) + Number(square.id[1])) % 2;
                        return <div key={square.id} id={square.id} className={`square ${altRow ? 'light-square': 'dark-square'}`} onDrop={(e) => DropPiece(e)} onDragOver={HoverPiece} onDragStart={DivPreventDefault}></div>
                    }
                    )}
                </div>
            </div>
            {gameState.inProgress && <CapturedPieces position='right' capturedPieces={gameState.capturedPieces}/>}
        </div>
    )
}

