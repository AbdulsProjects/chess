import "./style.css"
import React, { useEffect, useRef, useState } from 'react'
import pieces from "./pieces"

//THINGS TO DO
//Split the drop handler for on / off board
//Make a click handler work for placing pieces too
//Add a bin div element that can be used to remove pieces (add a double-click handler that does the same)
//Potentially change the pieces model to allow for all pieces along the path to be captured
//See if you can tidy up the function that finds the targettable squares, and change the knight object to move clockwise
//Update the squares in state after the targettable squares are found in state for calculating check / highlighting the correct squares

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
    const AddPiece = (squareId: string, pieceId: string, colour: string) => {
        //Updating state with the new piece

        //Generating the updated board
        const newBoard: Square[] = board.map((square: Square) => {
            if (square.id !== squareId) {
                return square
            } else {
                return {
                    ...square,
                    colour: colour,
                    piece: pieceId,
                    firstTurn: true
                }
            }
        })

        //Updating state to the new board
        setBoard(newBoard);

        //Removing any current images
        const targetSquare = document.getElementById(squareId)!
        if (targetSquare.hasChildNodes()) {targetSquare.removeChild((targetSquare.firstChild as Node))};

        //Appending the new image
        const element = document.getElementById(colour + ' ' + pieceId)!.cloneNode();
        targetSquare.appendChild(element);

        //Adding an ID and event listeners to the new element
        const newElement = targetSquare.children[0];
        newElement.id = targetSquare.id + " Piece";
        newElement.addEventListener("dragstart", (e: any) => DragPiece(e, colour, pieceId))
    }

    const RemovePiece = (squareId: string) => {

        //Generating the new board with the removed piece
        const newBoard: Square[] = board.map((square: Square) => {
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

        //Updating state to the new board
        setBoard(newBoard);

        //Removing the child img element
        document.getElementById(squareId)!.innerHTML = '';
    }

    const ClearBoard = () => {

        board.map((square: Square) => {
            RemovePiece(square.id)
        })

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
        
        //Grabbing the img's Id
        e.dataTransfer.setData("id", (e.target as HTMLElement).id)
    }

    const DuplicatePiece = (e: React.DragEvent) => {
        //Returning out of the function if a game is in progress
        if (startGame) {return};

        //Stopping bubbling to allow for dropping a piece on / off the board to be differentiated
        e.stopPropagation();
        
        const colour = e.dataTransfer.getData("Colour");
        const piece = e.dataTransfer.getData("Piece");

        //Grabbing the target square, and returning out of the function if the target square is the parent square
        if ((e.target as HTMLElement).nodeName ==='IMG') {
            if (document.getElementById(e.dataTransfer.getData("id"))!.parentNode === (e.target as HTMLElement).parentNode) { return }
            var targetSquare = (e.target as HTMLElement).parentElement!
        } else {
            var targetSquare = (e.target as HTMLElement);
        }

        AddPiece(targetSquare.id, piece, colour);

    }

    const BinPiece = (e: React.DragEvent) => {
        //Returning out of the function if a game is in progress
        if (startGame) {return};
        
        //Grabbing the parent of the dragged element
        const parentElement = document.getElementById(e.dataTransfer.getData("id"))!.parentElement;
        
        //Returning out of the function if the piece is not on the board
        if (!parentElement?.classList.contains("square")) { return }

        RemovePiece(parentElement.id);

    }

    //Functions to set up different board types
    const StandardGame = () => {
        
        ClearBoard();

        AddPiece('A8', 'rook', 'black');
        AddPiece('H8', 'rook', 'black');
        AddPiece('B8', 'knight', 'black');
        AddPiece('G8', 'knight', 'black');
        AddPiece('C8', 'bishop', 'black');
        AddPiece('F8', 'bishop', 'black');
        AddPiece('D8', 'king', 'black');
        AddPiece('E8', 'queen', 'black');
        AddPiece('A7', 'pawn', 'black');
        AddPiece('B7', 'pawn', 'black');
        AddPiece('C7', 'pawn', 'black');
        AddPiece('D7', 'pawn', 'black');
        AddPiece('E7', 'pawn', 'black');
        AddPiece('F7', 'pawn', 'black');
        AddPiece('G7', 'pawn', 'black');
        AddPiece('H7', 'pawn', 'black');

        AddPiece('A1', 'rook', 'white');
        AddPiece('H1', 'rook', 'white');
        AddPiece('B1', 'knight', 'white');
        AddPiece('G1', 'knight', 'white');
        AddPiece('C1', 'bishop', 'white');
        AddPiece('F1', 'bishop', 'white');
        AddPiece('D1', 'king', 'white');
        AddPiece('E1', 'queen', 'white');
        AddPiece('A2', 'pawn', 'white');
        AddPiece('B2', 'pawn', 'white');
        AddPiece('C2', 'pawn', 'white');
        AddPiece('D2', 'pawn', 'white');
        AddPiece('E2', 'pawn', 'white');
        AddPiece('F2', 'pawn', 'white');
        AddPiece('G2', 'pawn', 'white');
        AddPiece('H2', 'pawn', 'white');

    }


    //Functions  to start / play the game
    const StartGame = () => {
        //Updating the square drop handlers
        const squares = document.getElementsByClassName("square");
        for(let i=0; i < squares.length; i++) {
            squares[i].addEventListener("drop", () => MovePiece());
        }

        //Updating the handlers of all pieces
        const pieces = document!.querySelectorAll('[id$=Piece]');//getElementsByClassName("piece");
        for(let i=0; i < pieces.length; i++) {
            pieces[i].addEventListener("click", (e) => SelectPiece(e));
            pieces[i].addEventListener("dragstart", (e) => SelectPiece(e));
        }

        //Updating state
        setStartGame(true);

    }

    const MovePiece = () => {
        //Steps
        //1) 
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
        const squareObj = board.find(square => square.id === squareName);
        if (!squareObj) { return }

        //Calculating possible moves
        const viableMoves = CalculateMoves(board, squareName);
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
        const pieceObj = pieces.find(piece => {
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
                    result.currentIteration.x += step[0];
                    result.currentIteration.y += step[1];

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
                        return <div id={square.id} className={`square ${altRow ? "light-square": "dark-square"}`} onDrop={DuplicatePiece} onDragOver={HoverPiece} onDragStart={DivPreventDefault}></div>
                    }
                    )}
                </div>
            </div>
            <img src="img/white_pawn.png" id="white pawn" alt="White Pawn" onDragStart={(e) => DragPiece(e, "white", "pawn")}/>
            <img src="img/white_rook.png" id="white rook" alt="White Rook" onDragStart={(e) => DragPiece(e, "white", "rook")}/>
            <img src="img/white_knight.png" id="white knight" alt="White Knight" onDragStart={(e) => DragPiece(e, "white", "knight")}/>
            <img src="img/white_bishop.png" id="white bishop" alt="White Bishop" onDragStart={(e) => DragPiece(e, "white", "bishop")}/>
            <img src="img/white_queen.png" id="white queen" alt="White Queen" onDragStart={(e) => DragPiece(e, "white", "queen")}/>
            <img src="img/white_king.png" id="white king" alt="White King" onDragStart={(e) => DragPiece(e, "white", "king")}/>
            <img src="img/black_pawn.png" id="black pawn" alt="Black Pawn" onDragStart={(e) => DragPiece(e, "black", "pawn")}/>
            <img src="img/black_rook.png" id="black rook" alt="Black Rook" onDragStart={(e) => DragPiece(e, "black", "rook")}/>
            <img src="img/black_knight.png" id="black knight" alt="Black Knight" onDragStart={(e) => DragPiece(e, "black", "knight")}/>
            <img src="img/black_bishop.png" id="black bishop" alt="Black Bishop" onDragStart={(e) => DragPiece(e, "black", "bishop")}/>
            <img src="img/black_queen.png" id="black queen" alt="Black Queen" onDragStart={(e) => DragPiece(e, "black", "queen")}/>
            <img src="img/black_king.png" id="black king" alt="Black King" onDragStart={(e) => DragPiece(e, "black", "king")}/>
            <button onClick={StartGame}>Start Game</button>
            <button onClick={StandardGame}>Standard Game</button>
        </div>
    )
}

