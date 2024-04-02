import "./style.css"
import React, { useEffect, useRef, useState } from 'react'
import definedPieces from "./pieces"

//THINGS TO DO
//Split the drop handler for on / off board
//Make a click handler work for placing pieces too
//Add a bin div element that can be used to remove pieces (add a double-click handler that does the same)
//Potentially change the pieces model to allow for all pieces along the path to be captured
//See if you can tidy up the function that finds the targettable squares, and change the knight object to move clockwise
//Update the squares in state after the targettable squares are found in state for calculating check / highlighting the correct squares
//Check if boardRef.current needs to replace all references to board
//Drag a piece ontop of itself during start game state and check for an error
//Calculate moves seems to break on squares that have already been moved to

//Turn the add / remove functions into pure functions that just return a new board, then set the board outside of the function

export function Chess() {

    //Setting up the state

    interface Square {
        id: string,
        piece: string | null,
        colour: string | null,
        x: number,
        y: number,
        firstTurn: boolean,
        movesCalculated: boolean,
        targetedBy: TargetedBy
    } 

    interface TargetedBy { 
        black: TargetingSquare[],
        white: TargetingSquare[]
    }

    interface TargetingSquare {
        target: string,
        source: string,
        moveable: boolean,
        capture: boolean
    }

    interface PiecesToAdd {
        squareId: string,
        pieceId: string,
        colour: string
    }

    //Storing the board / game state in state
    const [board, setBoard] = useState<Square[]>([]);
    const [startGame, setStartGame] = useState(false);
    const boardRef = useRef<Square[]>([]);

    boardRef.current = board;

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
                    movesCalculated: false,
                    targetedBy: {
                        black: [],
                        white: []
                    }
                });
            }
        }
        setBoard(localBoard);
    }, [])

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
            
            //Handling squares where a piece was removed
            if (!square.piece) {
                squareElement!.innerHTML = '';
                return
            }

            //Handling squares where a piece was added
            //Generating the new img element
            let pieceImg = document.createElement('img');
            pieceImg.id = square.id + ' Piece';
            pieceImg.alt = square.colour + ' ' + square.piece
            pieceImg.src = 'img/' + square.colour + '_' + square.piece + '.png'
            pieceImg.addEventListener("dragstart", (e: any) => DragPiece(e, square.colour!, square.piece!));
            if (startGame) {
                pieceImg.addEventListener("click", (e) => SelectPiece(e));
                pieceImg.addEventListener("dragstart", (e) => SelectPiece(e));
            }

            //Appending the new img element to the square div
            squareElement.appendChild(pieceImg);

            //Updating the board in state
            setBoard(newBoard);
       })
    }

    const AddPiece = (prevBoard: Square[], pieces: PiecesToAdd[]): Square[] => {
        //Updating state with the new piece
        
        //Generating the updated board
        const newBoard: Square[] = prevBoard.map((square: Square) => {
            const piece = pieces.find((piece) => piece.squareId === square.id);
            if (piece === undefined) {
                return square
            } else {
                return {
                    ...square,
                    colour: piece.colour,
                    piece: piece.pieceId,
                    firstTurn: !startGame
                }
            }
        })

        return newBoard
    }

    const RemovePiece = (prevBoard: Square[], squareId: string): Square[] => {

        //Generating the new board with the removed piece
        const newBoard: Square[] = prevBoard.map((square: Square) => {
            if (square.id !== squareId) {
                // console.log("default", square.id)
                return square
            } else {
                // console.log("change", square.id)
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
        
        setBoardAndHtml(newBoard);
        
        return(newBoard);
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
        
        const colour = e.dataTransfer.getData("Colour");
        const piece = e.dataTransfer.getData("Piece");
        const sourceSquareId = e.dataTransfer.getData('squareId');

        //Returning out of the function if a game is in progress
        if (startGame) {
            const targetSquare = board.find(square => square.id === (e.target as HTMLElement).id)!;
            const targetedBy = targetSquare.targetedBy['black'];
            const moveable = targetedBy.find(targettingSquares => targettingSquares.source === sourceSquareId)?.moveable;
            if (!moveable) {return}
        };

        //Stopping bubbling to allow for dropping a piece on / off the board to be differentiated
        e.stopPropagation();

        //Grabbing the target square, and returning out of the function if the target square is the parent square
        if ((e.target as HTMLElement).nodeName ==='IMG') {
            if (document.getElementById(e.dataTransfer.getData("pieceId"))!.parentNode === (e.target as HTMLElement).parentNode) { return }
            var targetSquare = (e.target as HTMLElement).parentElement!
        } else {
            var targetSquare = (e.target as HTMLElement);
        }

        if(startGame) {
            let newBoard = RemovePiece(boardRef.current, sourceSquareId);
            newBoard = AddPiece(newBoard, [{squareId: targetSquare.id, pieceId: piece, colour: colour}]);
            setBoardAndHtml(newBoard);    
            RemoveHighlights();
        } else {
            setBoardAndHtml(AddPiece(boardRef.current, [{squareId: targetSquare.id, pieceId: piece, colour: colour}]));
        }
    }

    const BinPiece = (e: React.DragEvent) => {
        //Returning out of the function if a game is in progress
        if (startGame) {return};
        
        //Grabbing the parent of the dragged element
        const parentElement = document.getElementById(e.dataTransfer.getData("squareId"));
        
        //Returning out of the function if the piece is not on the board
        if (!parentElement?.classList.contains("square")) { return }

        setBoardAndHtml(RemovePiece(boardRef.current, parentElement.id));

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

        //Updating state
        setStartGame(true);

    }

    const SelectPiece = (e: Event) => {
        //Steps
        //1) Identify the square targetted
        //2) Identify which squares can be moved to (use a reusable function call)
        //3) CURRENT STEP Highlight tiles returned by the CalculateMoves function
        //4) Update state to reflect targettable / moveable squares / calculated this turn

        //Removing highlights from currently highlighted piece
        RemoveHighlights();

        //Selecting the piece / square
        const piece = (e.target as HTMLElement);
        if (!piece || !piece.parentElement) { return }
        const squareName = piece.parentElement.id;
        const squareObj = boardRef.current.find(square => square.id === squareName);
        if (!squareObj) { return }

        //Calculating possible moves
        const viableMoves = CalculateMoves(boardRef.current, squareName);
        if (!viableMoves) { return }

        //TODO: MAKE THIS ONLY RUN IF NOT ALREADY RAN THIS TURN
        //Updating board to reflect what squares the piece can target / move to
        const newBoard: Square[] = boardRef.current.map((square: Square) => {

            if (viableMoves!.some(move => move.target === square.id)) {
                const viableMove = viableMoves.find(move => move.target === square.id);
                const targetElement = document.getElementById(square.id);
                viableMove!.capture && targetElement!.classList.add("highlight-capture");
                viableMove!.moveable && targetElement!.classList.add("highlight-move");
                return {
                    ...square,
                    targetedBy: {
                        ...square.targetedBy,
                        [squareObj.colour!]: [
                            ...square.targetedBy[squareObj.colour! as keyof typeof square.targetedBy],
                            viableMove
                        ]
                    },
                    movesCalculated: square.id === squareName || square.movesCalculated
                };
            } else if (square.id === squareName) {
                return {
                    ...square,
                    movesCalculated: true
                }
            } else {
                return square;
            }
        });
        
        setBoard(newBoard);

        //Adding a highlight to all possible moves
        piece.parentElement.classList.add("highlight-select");
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
    const CalculateMoves = (board: Square[], selectedSquare: string) => {

        //Assigning the selected square
        const square = board.find(square => {
            return square.id === selectedSquare;
        });
        if (!square) { return }

        //Returning the corresponding piece object
        const pieceObj = definedPieces.find(piece => {
            return piece.id === square.piece;
        });
        if (!pieceObj) { return }

        //Interfaces used in the reduce call
        interface TargettableSquareReducer {
            currentIteration: {
                x: number,
                y: number,
                outOfBounds: boolean,
                blocked: boolean,
                capture: boolean
            }
            squares: TargetingSquare[]
        }

        const moves = pieceObj.movement.reduce((result: TargettableSquareReducer, direction) => {

            //Resetting the variables for the current iteration
            result.currentIteration = {
                x: square.x,
                y: square.y,
                outOfBounds: false,
                blocked: false,
                capture: false
            };

            //Repeating the movement for repeatable patterns
            for (let i = 0; i < direction.range; i++) {
                //Following the specified path. This allows for pieces that can only capture at the end of a specified path to be created. forEach is used instead of reduce to allow for short circuits
                direction.path.forEach((step, index, path) => {
                    //Calculating the next square
                    result.currentIteration.x += step[0] * (square.colour === 'black' ? -1 : 1);
                    result.currentIteration.y += step[1] * (square.colour === 'black' ? -1 : 1);

                    //Retrieving the square from state
                    const targetSquare = board.find((square) => {
                        return square.x === result.currentIteration.x && square.y === result.currentIteration.y;
                    })

                    if (!targetSquare) {
                        result.currentIteration.outOfBounds = true;
                        return;                        
                    }

                    //Setting blocked = true if there is a piece on a square that isn't a capture square or if the piece is the same colour
                    if (targetSquare!.piece !== null) {
                        if (index !== path.length - 1 || direction.moveOnly || targetSquare!.colour === square.colour) {
                            result.currentIteration.blocked = true;
                        } else {
                            if (!result.currentIteration.blocked) { result.currentIteration.capture = true; }
                        }
                    }
                });

                if (result.currentIteration.outOfBounds) { return result; }
            
                const targetSquare = board.find((square) => square.x === result.currentIteration.x && square.y === result.currentIteration.y)

                const currentTargettableSquare: TargetingSquare = {
                    target: targetSquare!.id,
                    source: square.id,
                    //Can move to the square if under the following conditions:
                    //1) The piece isn't blocked at any point in its path
                    //2) The direction isn't capture only, or it's capture only but there's a capturable piece on the target square
                    //3) The direction isn't only allowed on the piece's first move, or it's the piece's first move
                    moveable: !result.currentIteration.blocked && (!direction.captureOnly || direction.captureOnly && result.currentIteration.capture) && (!direction.firstMoveOnly || square.firstTurn),
                    capture: result.currentIteration.capture
                }

                //Setting blocked for next iterations if the destination tile contains a piece
                if (result.currentIteration.capture) { result.currentIteration.blocked=true; }
                
                result.squares.push(currentTargettableSquare);

                //Setting capture for next iterations if the path was blocked in a previous iteration
                if (result.currentIteration.blocked) { result.currentIteration.capture=false; }
            };

            return result;

        }, { currentIteration: { x: 0, y: 0, outOfBounds: false, blocked: false, capture: false }, squares: [] });

        return moves.squares;
    };


    return (
        <div className="main-container" onDrop={BinPiece} onDragOver={DivPreventDefault} onDragStart={DivPreventDefault}>
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

