import "./style.css"
import React, { useEffect, useRef, useState } from 'react'
import definedPieces, { Piece } from "./pieces"
import { Promotion } from "./promotion"

//THINGS TO DO
//Split the drop handler for on / off board
//Make a click handler work for placing pieces too
//Add a bin div element that can be used to remove pieces (add a double-click handler that does the same)
//Potentially change the pieces model to allow for all pieces along the path to be captured
//See if you can tidy up the function that finds the targettable squares, and change the knight object to move clockwise
//Check if boardRef.current needs to replace all references to board
//Drag a piece ontop of itself during start game state and check for an error

//Create a checkmate checker
//Prevent moves that would put you in check, and highlight the check tiles fully red when selecting the king

//An error is thrown if trying to start a game without 2 kings. prevent game from starting in this case
//Only allow 1 king to be added or allow for multiple kings (need to change how we find the king's index in that case, as this only works with 1 king)

//Look at communalising the function used to remove old moves (currently used when promoting a piece / moving a piece)

//Look at preventing the double-calculating that's done when moving a promotable piece to the end of the board (at the moment it calculates after moving the piece, then again after promoting)

export function Chess() {

    //Setting up the state

    interface Square {
        id: string,
        piece: string | null,
        colour: 'black' | 'white' | null,
        x: number,
        y: number,
        firstTurn: boolean,
        targeting: TargetingSquare[],
        targetedBy: Target
    } 

    interface Target { 
        black: TargetingSquare[],
        white: TargetingSquare[]
    }

    interface TargetingSquare {
        target: string,
        source: string,
        moveable: boolean,
        capture: boolean,
        moveOnly: boolean,
        path: string[],
        blockedBy: {
            black: string[],
            white: string[]
        }
    }

    interface PiecesToAdd {
        squareId: string,
        pieceId: string,
        colour: 'black' | 'white'
    }

    interface GameState {
        inProgress: boolean,
        currentPlayer: 'black' | 'white',
        promotions: {
            black: string[];
            white: string[]
        }
    }

    interface TargettableSquareReducer {
        currentIteration: {
            x: number,
            y: number,
            outOfBounds: boolean,
            blocked: boolean,
            capture: boolean,
            moveOnly: boolean,
            blockedBy: {
                black: string[],
                white: string[]
            }
            path: string[]
        }
        squares: TargetingSquare[]
    }

    //Storing the board / game state in state
    const [board, setBoard] = useState<Square[]>([]);
    const [gameState, setGameState] = useState<GameState>({
        inProgress: false,
        currentPlayer: 'white',
        promotions: {
            black: [],
            white: []
        }
    })

    const boardRef = useRef<Square[]>([]);
    const gameStateRef = useRef<GameState>(gameState);

    boardRef.current = board;
    gameStateRef.current = gameState;

    useEffect(() => {
        //Setting up the board
        let localBoard: Square[] = [];
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
            }
        }
        setBoard(localBoard);
    }, [])

    //Checking for promotions whenever the board is updated
    useEffect(() => {
    
        const promotions: {black: string[], white: string[]} = {
            black: [],
            white: []
        }
        
        //Checking the black promotion squares
        for (let i = 1; i <= 8; i++) {
            const square = board.find(square => square.x === i && square.y === 1 && square.piece && square.colour === 'black');
            if (!square || !definedPieces.find(piece => piece.id === square!.piece)!.canPromote) { continue; }
            promotions.black.push(square.id);
        }

        //Checking the white promotion squares
        for (let i = 1; i <= 8; i++) {
            const square = board.find(square => square.x === i && square.y === 8 && square.piece && square.colour === 'white');
            if (!square || !definedPieces.find(piece => piece.id === square!.piece)!.canPromote) { continue; }
            promotions.white.push(square.id);
        }

        setGameState(prevState => ({
            ...prevState,
            promotions: promotions
        }));

        //Removing promotion highlights from all pieces
        const highlightedSquares = document.getElementsByClassName("highlight-promote");
        for (let i = 0; i < highlightedSquares.length; i++) {
            highlightedSquares[i].classList.remove("highlight-promote");
        }

        //Adding promotion highlight to the first square in the array
        if ((promotions.white.length > 0 || promotions.black.length > 0) && gameState.inProgress) {
            const currentPromotionSquare = document.getElementById(promotions.white.length > 0 ? promotions.white[0] : promotions.black[0])!;
            currentPromotionSquare.classList.add("highlight-promote")
        }

    }, [board])

    //Used to promote a piece
    const PromotePiece = (newPiece: Piece) => {
        
        //Grabbing the piece to promote
        const promotionSquareId = gameState.promotions.white.length > 0 ? gameState.promotions.white[0] : gameState.promotions.black[0];
        const promotionSquare = boardRef.current.find(square => square.id === promotionSquareId)!;

        //Removing the piece
        let newBoard = RemovePiece(boardRef.current, promotionSquareId);

        //Adding in the new piece
        newBoard = AddPiece(newBoard, [{squareId: promotionSquareId, pieceId: newPiece.id, colour: (promotionSquare.colour as 'black' | 'white')}]);
        
        //Updating the possible moves for newly empty square / the targeted squares
        for (let i = 0; i < promotionSquare.targeting.length; i++) {
            const targetSquareIndex = newBoard.findIndex(square => square.id === promotionSquare.targeting[i].target);
            const targetMoveIndex = newBoard[targetSquareIndex].targetedBy[promotionSquare.colour!].findIndex(move => move.source === promotionSquare.id);
            newBoard[targetSquareIndex].targetedBy[promotionSquare.colour!].splice(targetMoveIndex, 1);
        }            
        const promotionSquareIndex = newBoard.findIndex(square => square.id === promotionSquareId);
        newBoard[promotionSquareIndex].targeting = [];

        //Updating the possible moves for the moved to square
        const moves = ReturnPieceMoves(newBoard, newBoard[promotionSquareIndex]);
        MutateBoardWithMoves(newBoard, moves, promotionSquareId);

        //Calculating the possible moves for the next player's next turn if this was the last promotion (may not be the last promotion when the game is started)
        if (gameState.promotions.white.length + gameState.promotions.black.length <= 1) { newBoard = CalculateMoves(newBoard, promotionSquare.colour === 'white' ? 'black' : 'white'); }

        //Updating state
        setBoardAndHtml(newBoard);
    }

    //General Functions

    //This is used to update the HTML whenever the board in state is updated
    const setBoardAndHtml = (newBoard: Square[]) => {
        
        //Determining what squares have changed in the state
        const differentSquares: Square[] = newBoard.filter((square) => {
            const prevSquare: Square = boardRef.current.find(prevSquare => prevSquare.id === square.id)!;
            return square.piece !== prevSquare.piece || square.colour !== prevSquare.colour;
        })

        //Updating the HTML of the changed squares
        differentSquares.map((square: Square) => {
            
            const squareElement = document.getElementById(square.id)!;
            
            squareElement!.innerHTML = '';
            //Exitting if a piece was removed instead of replaced
            if (!square.piece) {return}

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

       })

        //Updating the board in state
        setBoard(newBoard);
    }

    const AddPiece = (prevBoard: Square[], pieces: PiecesToAdd[]): Square[] => {
        //Updating state with the new piece
        
        //Generating the updated board
        const newBoard: Square[] = prevBoard.map((square: Square) => {
            const piece = pieces.find((piece) => piece.squareId === square.id);
            if (piece === undefined) {
                return {
                    ...square
                }
            } else {
                return {
                    ...square,
                    colour: piece.colour,
                    piece: piece.pieceId,
                    firstTurn: !gameState.inProgress,
                }
            }
        })

        return newBoard
    }

    const RemovePiece = (prevBoard: Square[], squareId: string): Square[] => {

        //Generating the new board with the removed piece
        const newBoard: Square[] = prevBoard.map((square: Square) => {
            if (square.id !== squareId) {
                return square
            } else {
                return {
                    ...square,
                    colour: null,
                    piece: null,
                    firstTurn: false
                }
            }
        })

        return newBoard;
    }

    const ClearBoard = (): Square[] => {

        let newBoard: Square[] = [...boardRef.current];
        board.map((square: Square) => {
            newBoard = RemovePiece(newBoard, square.id);
        })
        
        return(newBoard);
    }

    //Returning a boolean to specify if the interactivity should be disabled
    const DisableInteractivity = (): boolean => {
        return gameStateRef.current.promotions.black.length > 0 || gameStateRef.current.promotions.white.length > 0;
    }

    //Event Handlers

    //Generic handlers
    //This prevents the squares from being dragged
    const DivPreventDefault = (e: React.DragEvent) => {
        if ((e.target as HTMLElement).nodeName === "DIV") {e.preventDefault()};
    }
    
    const HoverPiece = (e: React.DragEvent) => {
        e.preventDefault();
    }

    //Handlers for setting up a game
    const DragPiece = (e: React.DragEvent, colour: string, piece: string) => {
        e.dataTransfer.setData("Colour", colour);
        e.dataTransfer.setData("Piece", piece);
        
        //Grabbing the Ids
        e.dataTransfer.setData("pieceId", (e.target as HTMLElement).id)
        e.dataTransfer.setData("squareId", (e.target as HTMLElement).parentElement!.id)
    }

    const MovePiece = (e: React.DragEvent) => {

        //Stopping bubbling to allow for dropping a piece on / off the board to be differentiated
        e.stopPropagation();

        const colour = e.dataTransfer.getData("Colour");
        if (colour !== 'black' && colour !== 'white') { return }
        const piece = e.dataTransfer.getData("Piece");
        const sourceSquareId = e.dataTransfer.getData('squareId');
        const currentSquare = board.find(square => square.id === sourceSquareId)!;

        //Grabbing the target square, and returning out of the function if the target square is the parent square
        if ((e.target as HTMLElement).nodeName ==='IMG') {
            if (document.getElementById(e.dataTransfer.getData("pieceId"))!.parentNode === (e.target as HTMLElement).parentNode) { return }
            var targetSquare = board.find(square => square.id === (e.target as HTMLElement).parentElement!.id)!;
        } else {
            var targetSquare = board.find(square => square.id === (e.target as HTMLElement).id)!;
        }

        //Moving the piece if a game is in progress, duplicating the piece if not
        if(gameState.inProgress) {
            //Returning if trying to grab the other player's piece
            if (colour !== gameState.currentPlayer) {return}

            //Returning if trying to move to an invalid square
            const targeting = currentSquare.targeting;
            const moveable = targeting.find(targettingSquares => targettingSquares.target === targetSquare.id)?.moveable;
            if (!moveable) {return}

            //Moving the piece
            let newBoard = RemovePiece(boardRef.current, sourceSquareId);
            newBoard = AddPiece(newBoard, [{squareId: targetSquare.id, pieceId: piece, colour: colour}]);
            
            //Updating the possible moves for newly empty square / the targeted squares
            for (let i = 0; i < currentSquare.targeting.length; i++) {
                const targetSquareIndex = newBoard.findIndex(square => square.id === currentSquare.targeting[i].target);
                const targetMoveIndex = newBoard[targetSquareIndex].targetedBy[currentSquare.colour!].findIndex(move => move.source === currentSquare.id);
                newBoard[targetSquareIndex].targetedBy[currentSquare.colour!].splice(targetMoveIndex, 1);
            }            
            const sourceSquareIndex = newBoard.findIndex(square => square.id === sourceSquareId);
            newBoard[sourceSquareIndex].targeting = [];

            //Updating the possible moves for the moved to square
            const moves = ReturnPieceMoves(newBoard, newBoard.find(square => square.id === targetSquare.id)!);
            MutateBoardWithMoves(newBoard, moves, targetSquare.id);

            //Calculating the possible moves for the next player's next turn
            newBoard = CalculateMoves(newBoard, colour === 'white' ? 'black' : 'white');
            
            //Updating the state / HTML
            setBoardAndHtml(newBoard);    
            RemoveHighlights();
            setGameState(prevState => ({
                ...prevState,
                currentPlayer: prevState.currentPlayer === 'white' ? 'black' : 'white'
            }));
        } else {
            //Adding the piece
            setBoardAndHtml(AddPiece(boardRef.current, [{squareId: targetSquare.id, pieceId: piece, colour: colour}]));
        }
    }

    const BinPiece = (e: React.DragEvent) => {
        //Returning out of the function if a game is in progress
        if (gameState.inProgress) {return};
        
        //Grabbing the parent of the dragged element
        const parentElement = document.getElementById(e.dataTransfer.getData("squareId"));
        
        //Returning out of the function if the piece is not on the board
        if (!parentElement?.classList.contains("square")) { return }

        const newBoard = RemovePiece(boardRef.current, parentElement.id);
        
        setBoardAndHtml(newBoard);

    }

    //Functions to set up different board types
    const StandardGame = () => {
        const newBoard: Square[] = ClearBoard();
        setBoardAndHtml(AddPiece(newBoard, [
            {squareId: 'A8', pieceId: 'rook', colour: 'black'},
            {squareId: 'B8', pieceId: 'knight', colour: 'black'},
            {squareId: 'C8', pieceId: 'bishop', colour: 'black'},
            {squareId: 'D8', pieceId: 'king', colour: 'black'},
            {squareId: 'E8', pieceId: 'queen', colour: 'black'},
            {squareId: 'F8', pieceId: 'bishop', colour: 'black'},
            {squareId: 'G8', pieceId: 'knight', colour: 'black'},
            {squareId: 'H8', pieceId: 'rook', colour: 'black'},
            {squareId: 'A7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'B7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'C7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'D7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'E7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'F7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'G7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'H7', pieceId: 'pawn', colour: 'black'},

            {squareId: 'A1', pieceId: 'rook', colour: 'white'},
            {squareId: 'B1', pieceId: 'knight', colour: 'white'},
            {squareId: 'C1', pieceId: 'bishop', colour: 'white'},
            {squareId: 'D1', pieceId: 'king', colour: 'white'},
            {squareId: 'E1', pieceId: 'queen', colour: 'white'},
            {squareId: 'F1', pieceId: 'bishop', colour: 'white'},
            {squareId: 'G1', pieceId: 'knight', colour: 'white'},
            {squareId: 'H1', pieceId: 'rook', colour: 'white'},
            {squareId: 'A2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'B2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'C2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'D2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'E2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'F2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'G2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'H2', pieceId: 'pawn', colour: 'white'},
        ]))
    }


    //Functions  to start / play the game
    const StartGame = () => {

        //Updating the handlers of all pieces
        const pieces = document!.querySelectorAll('[id$=Piece]');//getElementsByClassName("piece");
        for(let i=0; i < pieces.length; i++) {
            pieces[i].addEventListener("click", (e) => SelectPiece(e));
            pieces[i].addEventListener("dragstart", (e) => SelectPiece(e));
        }

        //Calculating possible moves. Black is calculated to account for boards where black pieces are immediately targetting the white king, thus changing white's possible moves
        const newBoard = CalculateMoves(boardRef.current, 'black');
        setBoard(CalculateMoves(newBoard, 'white'));

        //Updating state
        setGameState(prevState => ({
            ...prevState,
            inProgress: true
        }));

    }

    const SelectPiece = (e: Event) => {

        if (DisableInteractivity()) { return; }
        //Removing highlights from currently highlighted piece
        RemoveHighlights();

        //Selecting the piece / square
        const piece = (e.target as HTMLElement);
        if (!piece || !piece.parentElement) { return }
        const squareName = piece.parentElement.id;
        const squareObj = boardRef.current.find(square => square.id === squareName);
        if (!squareObj) { return }

        //Returning if trying to grab the other player's piece
        if (squareObj.colour !== gameStateRef.current.currentPlayer) {return}

        // //Adding a highlight to all possible moves
        piece.parentElement.classList.add("highlight-select");

        if (!squareObj.targeting) { return }

        //Updating the HTML to indicate targettable squares
        squareObj.targeting.map((move: TargetingSquare) => {
                const targetElement = document.getElementById(move.target);
                move!.capture && move!.moveable && targetElement!.classList.add("highlight-capture");
                !move!.capture && move!.moveable && targetElement!.classList.add("highlight-move");
        });

    }

    //Removing the highlights from all squares
    const RemoveHighlights = () => {
        const squares = document.querySelectorAll('div[class*="highlight"]');
        for(let i=0; i < squares.length; i++) {
            squares[i].classList.remove("highlight-select");
            squares[i].classList.remove("highlight-move");
            squares[i].classList.remove("highlight-capture");
        }
    }

    //Returning all possible moves
    const CalculateMoves = (board: Square[], colour: keyof Target) => {
        
        //Removing the last set of calculations for the passed colour
        const newBoard: Square[] = board.map((square) => {
            if (square.colour === colour) {
                return {
                    ...square,
                    targeting: []
                }
            } else {
                return {
                    ...square,
                    targetedBy: {
                        ...square.targetedBy,
                        [colour]: []
                    }
                }
            }
        });

        //Calculating the moves of the passed colour
        const squaresToCalculate: Square[] = newBoard.filter((square) => square.piece && square.colour === colour);
        squaresToCalculate.map((square) => {

            //Exitting if no square found
            if (!square) { return newBoard }

            //Calculating moves for the current square
            const moves = ReturnPieceMoves(newBoard, square);
            MutateBoardWithMoves(newBoard, moves, square.id);
        })

        return newBoard;
    };

    //This function takes a square and board to return an array of all possible moves. Returns a targetingSquare array instead of a new board to reduce memory/performance cost of initialising new boards
    const ReturnPieceMoves = (board: Square[], square: Square):  TargetingSquare[] => {
        
        //Returning a blank array if the square doesn't have a piece
        if (!square.piece) { return [] } 

        //Returning the corresponding piece object
        const pieceObj = definedPieces.find(piece => {
            return piece.id === square.piece;
        })!;

        //Retrieving the opposing king's square for later use
        const opposingKingSquare = board.find(currSquare => currSquare.piece === 'king' && currSquare.colour !== square.colour)!;

        //Returning all squares that prevent check / don't open up a new check
        const nonCheckSquares = ReturnSquaresThatPreventCheck(board, square);

        const moves = pieceObj.movement.reduce((result: TargettableSquareReducer, direction) => {

            //Resetting the variables for the current iteration
            result.currentIteration = {
                x: square.x,
                y: square.y,
                outOfBounds: false,
                blocked: false,
                capture: false,
                moveOnly: false,
                blockedBy: {
                    black: [],
                    white: []
                },
                path: [square.id]
            };

            if (direction.firstMoveOnly && !square.firstTurn) { return result }

            //Repeating the movement for repeatable patterns
            for (let i = 0; i < direction.range; i++) {
                if (direction.firstMoveOnly && !square.firstTurn) { continue; }

                result.currentIteration.moveOnly = direction.moveOnly ? true : false;

                //Following the specified path. This allows for pieces that can only capture at the end of a specified path to be created. forEach is used instead of reduce to allow for short circuits
                direction.path.forEach((step, index, path) => {
                    //Calculating the next square
                    result.currentIteration.x += step[0] * (square.colour === 'black' ? -1 : 1);
                    result.currentIteration.y += step[1] * (square.colour === 'black' ? -1 : 1);

                    //Retrieving the square from state
                    const stepTargetSquare = board.find((square) => {
                        return square.x === result.currentIteration.x && square.y === result.currentIteration.y;
                    })

                    if (!stepTargetSquare) {
                        result.currentIteration.outOfBounds = true;
                        return;                        
                    }

                    //Adding the current step's square to the path array if the path doesn't already include the opposing king's square. This is to calculate what squares block check
                    //THIS IS MUTATING THE PATH. THINK IT'S BECAUSE IT'S A POINTER NOT A PRIMATIVE TYPE
                    if (!result.currentIteration.path.find(squareId => squareId === opposingKingSquare.id)) { result.currentIteration.path.push(stepTargetSquare.id) };

                    //Setting blocked = true if there is a piece on a square that isn't a capture square or if the piece is the same colour
                    if (stepTargetSquare!.piece !== null) {
                        //Appending the blocker to the blockedBy array
                        //REVIEW THIS LINE, THE QUEEN MOVES SAY THEY@RE BLOCKED BY PIECES THAT ARE AFTER THE MOVE
                        if ((stepTargetSquare.piece !== 'king' || stepTargetSquare.colour === square.colour) && !result.currentIteration.blockedBy[stepTargetSquare.colour!].find(squareId => squareId === stepTargetSquare.id)) { result.currentIteration.blockedBy[stepTargetSquare.colour!].push(stepTargetSquare.id) }
                        if (index !== path.length - 1 || direction.moveOnly || stepTargetSquare!.colour === square.colour) {
                            result.currentIteration.blocked = true;
                        } else {
                            if (!result.currentIteration.blocked) { result.currentIteration.capture = true; }
                        }
                    }
                });

                //Early return if the path goes out of bounds
                if (result.currentIteration.outOfBounds) { return result; }
            
                const destTargetSquare = board.find((square) => square.x === result.currentIteration.x && square.y === result.currentIteration.y)!;

                const currentTargettableSquare: TargetingSquare = {
                    target: destTargetSquare!.id,
                    source: square.id,
                    //Can move to the square if under the following conditions:
                    //1) The piece isn't blocked at any point in its path
                    //2) The direction isn't capture only, or it's capture only but there's a capturable piece on the target square
                    //3) The direction doesn't leave the current player open to a check
                    moveable: !result.currentIteration.blocked && (!direction.captureOnly || direction.captureOnly && result.currentIteration.capture) && (nonCheckSquares.length === 0 || Boolean(nonCheckSquares.find(squareId => squareId === destTargetSquare.id))),
                    capture: result.currentIteration.capture,
                    moveOnly: result.currentIteration.moveOnly,
                    path: [...result.currentIteration.path],
                    blockedBy: {
                        black: [...result.currentIteration.blockedBy.black],
                        white: [...result.currentIteration.blockedBy.white]
                    }
                }

                //Setting blocked for next iterations if the destination tile contains a piece
                if (result.currentIteration.capture) { result.currentIteration.blocked=true; }
                
                result.squares.push(currentTargettableSquare);

                //Setting capture for next iterations if the path was blocked in a previous iteration
                if (result.currentIteration.blocked) { result.currentIteration.capture=false; }
            };

                return result;

        }, { currentIteration: { x: 0, y: 0, outOfBounds: false, blocked: false, capture: false, moveOnly: false, blockedBy: {black:[], white:[]}, path: [] }, squares: [] });

        return moves.squares;

    }

    //This function returns all valid squares that don't open a check & prevent all current checks
    const ReturnSquaresThatPreventCheck = (board: Square[], square: Square): string[] => {
        return square.piece === 'king' ? KingCheckBlocks(board, square) : NonKingCheckBlocks(board, square);
    }

    //Returns moves that block current checks for pieces that aren't the king
    const NonKingCheckBlocks = (board: Square[], square: Square) => {

        const allyKingSquare = board.find(currSquare => currSquare.piece === 'king' && currSquare.colour === square.colour)!;

        //Returning the path of all possible check moves that the current piece is blocking
        const blockingPaths: string[][] | undefined = allyKingSquare.targetedBy[square.colour === 'black' ? 'white' : 'black']
            ?.filter(move => move.blockedBy[square.colour!]
            .includes(square.id) && move.blockedBy[square.colour!].length === 1)
            .map(move => move.path);
        
        //Flattening the array and removing duplicates to leave a list of all squares that are in a potential check's path (only checks blocked soley by the current piece being calculated)
        const blockingSquares = ([new Set(blockingPaths?.flat())])[0];

        //Returning all squares that would block all potential checks that the current piece is already blocking
        const blocksCurrentBlocked = (Array.from(blockingSquares)
            .filter(squareId => blockingPaths?.every(path => path.includes(squareId)))
        );

        //Returning the current checks
        const currChecks = allyKingSquare.targetedBy[square.colour === 'black' ? 'white' : 'black']
            ?.filter(move => move.capture)
            .map(move => move.path);

        //Flattening the array and removing duplicates to leave a list of all squares that are in a check's path
        const currChecksSquares = ([new Set(currChecks?.flat())])[0];

        //Returning all intercepts in the check paths
        const currCheckIntercepts = (Array.from(currChecksSquares)
            .filter(squareId => currChecks?.every(path => path.includes(squareId)))
        );

        //Returning moves that block all current checks and don't open a new check
        if (currCheckIntercepts.length === 0) { return blocksCurrentBlocked; }
        if (blocksCurrentBlocked.length === 0) { return currCheckIntercepts; }

        return blocksCurrentBlocked.filter(squareId => currCheckIntercepts.includes(squareId));
    }

    //Returns moves for the king that don't result in a check
    const KingCheckBlocks = (board: Square[], square: Square) => {
        
        const surroundingSquares = board.filter(currSquare => 
            ((currSquare.x === square.x || currSquare.x === square.x - 1 || currSquare.x === square.x + 1) 
            && (currSquare.y === square.y || currSquare.y === square.y - 1 || currSquare.y === square.y + 1))
            && !(currSquare.x === square.x && currSquare.y === square.y)
        );

        return surroundingSquares
            .filter(currSquare => 
                currSquare.targetedBy[square.colour === 'black' ? 'white' : 'black'].length === 0 
                //Checking if there's a move targetting the surrounding square
                || !currSquare.targetedBy[square.colour === 'black' ? 'white' : 'black']
                    .find(move => !move.moveOnly && [...move.blockedBy.black, ...move.blockedBy.white].filter(blocker => blocker !== currSquare.id).length === 0)
            )
            .map(square => square.id);
    }

    //This is a function used to mutate the board passed, adding the moves to the correct squares
    const MutateBoardWithMoves = (board: Square[], moves: TargetingSquare[], sourceSquareId: string) => {

        const colour = board.find(square => square.id === sourceSquareId)!.colour;
        
        //Updating the current square with the moves
        const index = board.findIndex(currSquare => currSquare.id === sourceSquareId);
        board[index].targeting = moves;

        //Updating the targetted squares with the moves
        for (let i = 0; i < moves.length; i++) {
            const targetIndex = board.findIndex(currSquare => currSquare.id === moves[i].target);
            board[targetIndex].targetedBy[colour as keyof Target].push(moves[i]);
        };
    }

    return (
        <div className="main-container" onDrop={BinPiece} onDragOver={DivPreventDefault} onDragStart={DivPreventDefault}>
            {(gameState.promotions.white.length > 0 || gameState.promotions.black.length > 0) && gameState.inProgress && <Promotion PromotePiece={PromotePiece}/>}
            <div className="chess-container">
                <div className="y-labels">
                    {[...Array(8)].map((item, index) => 
                        <p>{8 - index}</p>
                    )}
                </div>
                <div className="x-labels">
                    {[...Array(8)].map((item, index) => 
                        <p>{String.fromCharCode(index + 65)}</p>
                    )}
                </div>
                <div className='chess-board'>
                    {board.map((square) => {
                        const altRow = (square.id.charCodeAt(0) + Number(square.id[1])) % 2;
                        return <div id={square.id} className={`square ${altRow ? "light-square": "dark-square"}`} onDrop={(e) => MovePiece(e)} onDragOver={HoverPiece} onDragStart={DivPreventDefault}></div>
                    }
                    )}
                </div>
            </div>
            <img src="img/white_pawn.png" id="white pawn" alt="white pawn" onDragStart={(e) => DragPiece(e, "white", "pawn")}/>
            <img src="img/white_rook.png" id="white rook" alt="white rook" onDragStart={(e) => DragPiece(e, "white", "rook")}/>
            <img src="img/white_knight.png" id="white knight" alt="white knight" onDragStart={(e) => DragPiece(e, "white", "knight")}/>
            <img src="img/white_bishop.png" id="white bishop" alt="white bishop" onDragStart={(e) => DragPiece(e, "white", "bishop")}/>
            <img src="img/white_queen.png" id="white queen" alt="white queen" onDragStart={(e) => DragPiece(e, "white", "queen")}/>
            <img src="img/white_king.png" id="white king" alt="white king" onDragStart={(e) => DragPiece(e, "white", "king")}/>
            <img src="img/black_pawn.png" id="black pawn" alt="black pawn" onDragStart={(e) => DragPiece(e, "black", "pawn")}/>
            <img src="img/black_rook.png" id="black rook" alt="black rook" onDragStart={(e) => DragPiece(e, "black", "rook")}/>
            <img src="img/black_knight.png" id="black knight" alt="black knight" onDragStart={(e) => DragPiece(e, "black", "knight")}/>
            <img src="img/black_bishop.png" id="black bishop" alt="black bishop" onDragStart={(e) => DragPiece(e, "black", "bishop")}/>
            <img src="img/black_queen.png" id="black queen" alt="black queen" onDragStart={(e) => DragPiece(e, "black", "queen")}/>
            <img src="img/black_king.png" id="black king" alt="black king" onDragStart={(e) => DragPiece(e, "black", "king")}/>
            <button onClick={StartGame}>Start Game</button>
            <button onClick={StandardGame}>Standard Game</button>
        </div>
    )
}

