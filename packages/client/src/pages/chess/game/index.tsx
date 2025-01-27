import "./style.css";
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Piece } from "./pieces";
import { Promotion } from "./promotion";
import { GameOver } from "./game-over";
import { PreGame } from "./pre-game";
import { CapturedPieces } from "./captured-pieces";
import { Board, Square, TargetingSquare } from "@react-chess/shared/src/chess/board";
import { SentSuggestion } from "./suggestion-mode/sent-suggestion";
import { RecievedSuggestion } from "./suggestion-mode/recieved-suggestion";
import { IWsContext, WsContext } from "../../../contexts/wsContext";
import { BoardPresets, PotentialPresets } from "./board-presets";

//THINGS TO DO
//Split the drop handler for on / off board and allow the removal of pieces using a double click
//Make a click handler work for placing pieces too

//Try to remove the useRef hook. If I remove it at the moment, the select piece fails as it refences the old board. I think this is because the handler
//is connected as part of setBoardAndHTML, meaning the old board is passed to the function. Putting the SetState before the handlers are connected doesn't
//fix as the board update is async, meaning the new value of board isn't ready before the handlers are assigned

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

    //Storing the board / game state in state
    const [board, setBoard] = useState<Board>(new Board(localBoard));
    const [showPresets, setShowPresets] = useState(false);

    const boardRef = useRef<Board>();

    const { onlineState }  = useContext(WsContext) as IWsContext;

    boardRef.current = board;
    
    //Checking for promotions whenever the board is updated
    useEffect(() => {

        //Removing promotion highlights from all pieces
        const highlightedSquares = document.getElementsByClassName("highlight-promote");
        for (let i = 0; i < highlightedSquares.length; i++) {
            highlightedSquares[i].classList.remove("highlight-promote");
        };

        //Adding promotion highlight to the first square in the array
        if (board.gameState.promotions.nextPromotion !== null) {
            const currentPromotionSquare = document.getElementById(board.gameState.promotions.nextPromotion.id)!;
            currentPromotionSquare.classList.add("highlight-promote");
        };

    }, [board]);

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

    //Setting up the callbacks for online functionality
    useEffect(() => {
        
        const messageListener = (event: MessageEvent<any>) => {
            const data = JSON.parse(event.data);
            if (data.method === 'request-move' || data.method === 'promote-piece') {
                const {_squares, _outcome, _gameState} = data.lobby.board;
                const newBoard = new Board(_squares, _outcome, _gameState);
                setBoardAndHtml(newBoard);
                if (data.method === 'request-move') {
                    const moveAudio = new Audio('audio/' + data.action + '.mp3');
                    moveAudio.play();
                }
            };
        }

        //Moving a piece
        onlineState.wsConn?.addEventListener("message", messageListener);

        //Removing the event handler on unmount
        return () => {
            onlineState.wsConn?.removeEventListener("message", messageListener);
        };

    }, []);

    //Updating the board if joining a game that's in progress
    useEffect(() => {
        if (onlineState.lobby?.board?.gameState.inProgress) { 
            const onlineBoard = onlineState.lobby.board!;
            const newBoard = new Board(onlineBoard.squares, onlineBoard.outcome, onlineBoard.gameState);
            setBoardAndHtml(newBoard);
        };
    },[])

    //General Functions

    //This is used to preview a suggested board
    const SetSquares = (squares: Square[]) => {
        const newBoard = new Board(squares);
        setBoardAndHtml(newBoard);
    };
    
    //This is used to update the HTML whenever the board in state is updated
    const setBoardAndHtml = (newBoard: Board) => {

        //Determining what squares have changed in the state
        const differentSquares: Square[] = newBoard.squares.filter((square) => {
            const prevSquare: Square = boardRef.current!.squares.find(prevSquare => prevSquare.id === square.id)!;
            return square.piece !== prevSquare.piece || square.colour !== prevSquare.colour;
        });
            
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
            if (newBoard.gameState.inProgress) {
                pieceImg.addEventListener("click", (e) => SelectPiece(e));
                pieceImg.addEventListener("dragstart", (e) => SelectPiece(e));
            };
            
            //Appending the new img element to the square div
            squareElement.appendChild(pieceImg);

            return undefined;
        });
           
        //Updating the handlers if starting a game
        if (!boardRef.current!.gameState.inProgress && newBoard.gameState.inProgress) {
            const pieces = document!.querySelectorAll('[id$=Piece]');
            for (let i=0; i < pieces.length; i++) {
                pieces[i].addEventListener("click", (e) => SelectPiece(e));
                pieces[i].addEventListener("dragstart", (e) => SelectPiece(e));
            };
        };

        //Updating the board in state
        setBoard(newBoard);
    };
    
    //Used to promote a piece
    const PromotePiece = (newPiece: Piece) => {

        //Promoting the piece in an online lobby
        if (onlineState.lobby !== undefined) {
            if (onlineState.lobby !== undefined) {
                
                //Online behaviour
                const payload = {
                    method: 'promote-piece',
                    newPiece: newPiece,
                    clientId: onlineState.clientId,
                    lobbyId: onlineState.lobby!.lobbyId
                };
                onlineState.wsConn!.send(JSON.stringify(payload));
            }
        //Promoting the piece in a local lobby
        } else {
            //Grabbing the piece to promote
            const newBoard = board.clone();
    
            //Promoting the piece
            newBoard.promotePiece(newPiece);
    
            //Updating state
            setBoardAndHtml(newBoard);
        }
    };

    //Returning a boolean to specify if the interactivity should be disabled
    const DisableInteractivity = (): boolean => {
        return board.gameState.promotions.black.length > 0 || board.gameState.promotions.white.length > 0 || boardRef.current!.outcome.stalemate || Boolean(boardRef.current!.outcome.checkmate);
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
        if(newBoard.gameState.inProgress) {
            //Returning if trying to grab the other player's piece
            if (colour !== newBoard.gameState.currentPlayer || newBoard.gameState.promotions.nextPromotion) { return; }

            //Returning if trying to move to an invalid square
            const targeting = sourceSquare.targeting;
            const move = targeting.find(targettingSquares => targettingSquares.target === targetSquare!.id && targettingSquares.moveable);
            if (!move) { return; }

            if (onlineState.lobby !== undefined) {
                
                //Online behaviour
                const payload = {
                    method: 'request-move',
                    sourceSquareId: sourceSquare.id,
                    targetSquareId: targetSquare.id,
                    clientId: onlineState.clientId,
                    lobbyId: onlineState.lobby!.lobbyId
                };
        
                onlineState.wsConn!.send(JSON.stringify(payload));

            } else {
                //Local behaviour
                const response = newBoard.requestMove(sourceSquare, targetSquare);
    
                if (response.succeeded && response.action) {
                    const moveAudio = new Audio('audio/' + response.action + '.mp3');
                    moveAudio.play();
                };
            };
            
            RemoveHighlights();

        } else {
            //Adding the piece
            newBoard.addPiece([{squareId: targetSquare.id, pieceId: piece, colour: colour}]);
            const addAudio = new Audio('audio/move-self.mp3');
            addAudio.play();
        };
        
        //Updating the state / HTML
        setBoardAndHtml(newBoard);    

    };

    const BinPiece = (e: DragEvent | React.DragEvent) => {

        //Returning out of the function if a game is in progress
        if (board.gameState.inProgress) { return; }
        
        //Grabbing the parent of the dragged element
        const parentElement = document.getElementById(e.dataTransfer!.getData("squareId"));
        
        //Returning out of the function if the piece is not on the board
        if (!parentElement?.classList.contains("square")) { return; }

        const newBoard = board.clone();
        newBoard.removePiece(parentElement.id);
        
        setBoardAndHtml(newBoard);
    };

    const setBoardPreset = (preset: PotentialPresets) => {
        const newBoard = board.clone();
        newBoard[preset]();
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

        setBoardAndHtml(newBoard);
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
        if ((squareObj.colour !== boardRef.current!.gameState.currentPlayer) || (onlineState.lobby !== undefined && onlineState.colour !== squareObj.colour)) { return; }

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
            {board.gameState.inProgress && <CapturedPieces position='left' capturedPieces={board.gameState.capturedPieces}/>}
            {(board.outcome.checkmate || board.outcome.stalemate) && <GameOver outcome={board.outcome} setBoardAndHtml={setBoardAndHtml} board={board}/>}
            {(!board.gameState.inProgress && !(board.outcome.checkmate || board.outcome.stalemate)) && <PreGame DragPiece={DragPiece} StandardGame={() => setBoardPreset('standardGame')} StartGame={StartGame} setShowPresets={setShowPresets} onlineGame={Boolean(onlineState.lobby)}/>}
            {(!board.gameState.inProgress && onlineState?.lobby?.gameType === 'suggestion') && <SentSuggestion boardToSuggest={board.squares} SetSquares={SetSquares}/>}
            {(showPresets && !board.gameState.inProgress) &&  <BoardPresets hidePresets={() => setShowPresets(false)} setBoardPreset={setBoardPreset}/>}
            {(!board.gameState.inProgress && onlineState?.lobby?.gameType === 'suggestion') && <RecievedSuggestion SetBoard={setBoardAndHtml} SetSquares={SetSquares}/>}
            {((board.gameState.promotions.white.length > 0 && (onlineState?.colour ?? 'white') === 'white') || (board.gameState.promotions.black.length > 0 && (onlineState?.colour ?? 'black') === 'black')) && board.gameState.inProgress && <Promotion PromotePiece={PromotePiece} colour={board.gameState.promotions.white.length > 0 ? 'white' : 'black'}/>}
            
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
                    })}
                </div>
            </div>
            {board.gameState.inProgress && <CapturedPieces position='right' capturedPieces={board.gameState.capturedPieces}/>}
        </div>
    )
}

