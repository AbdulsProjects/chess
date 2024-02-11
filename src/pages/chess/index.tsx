import "./style.css"
import React, { useEffect, useState } from 'react'
import pieces from "./pieces"

//THINGS TO DO
//Split the drop handler for on / off board
//Make a click handler work for placing pieces too
//Add a bin div element that can be used to remove pieces (add a double-click handler that does the same)

export function Chess() {

    //Setting up the state

    interface Square {
        name: string,
        piece: string | null,
        color: string | null,
        position: number[]
    }

    console.log(pieces);

    //Storing the board / game state in state
    const [board, setBoard] = useState<Square[]>([]);
    const [startGame, setStartGame] = useState(false);

    useEffect(() => {
        //Setting up the board
        let localBoard: Square[] = [];
        for (let i = 8; i > 0; i--) {
            for (let j = 65; j < 73; j++) {
                localBoard.push({
                    name: String.fromCharCode(j) + i,
                    piece: null,
                    color: null,
                    position: [j-64, i]
                });
            }
        }
        setBoard(localBoard);
    }, [])


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
    const DragPiece = (e: React.DragEvent, color: string, piece: string) => {
        e.dataTransfer.setData("Color", color);
        e.dataTransfer.setData("Piece", piece);
        
        //Grabbing the img's Id
        e.dataTransfer.setData("id", (e.target as HTMLElement).id)
    }

    const AddPiece = (e: React.DragEvent) => {
        //Returning out of the function if a game is in progress
        if (startGame) {return};

        //Stopping bubbling to allow for dropping a piece on / off the board to be differentiated
        e.stopPropagation();
        
        const color = e.dataTransfer.getData("Color");
        const piece = e.dataTransfer.getData("Piece");

        //Grabbing the target square, and returning out of the function if the target square is the parent square
        if ((e.target as HTMLElement).nodeName ==='IMG') {
            if (document.getElementById(e.dataTransfer.getData("id"))!.parentNode === (e.target as HTMLElement).parentNode) { return }
            var targetSquare = (e.target as HTMLElement).parentElement!
        } else {
            var targetSquare = (e.target as HTMLElement);
        }

        //Generating the updated board
        const newBoard: Square[] = board.map((square: Square) => {
            if (square.name !== targetSquare.id) {
                return square
            } else {
                return {
                    ...square,
                    color: color,
                    piece: piece
                }
            }
        })

        //Updating state to the new board
        setBoard(newBoard);

        //Visually updating the board
        //Deleting the current image
        if (targetSquare.hasChildNodes()) {targetSquare.removeChild((targetSquare.firstChild as Node))};

        //Appending the new image
        const element = document.getElementById(e.dataTransfer.getData("id"))!.cloneNode();
        targetSquare.appendChild(element);

        //Adding an ID and event listeners to the new element
        const newElement = targetSquare.children[0];
        newElement.id = targetSquare.id + " Piece";
        newElement.addEventListener("dragstart", (e: any) => DragPiece(e, color, piece))
    }

    const RemovePiece = (e: React.DragEvent) => {
        //Returning out of the function if a game is in progress
        if (startGame) {return};
        
        //Grabbing the parent of the dragged element
        const parentElement = document.getElementById(e.dataTransfer.getData("id"))!.parentElement;
        
        //Returning out of the function if the piece is not on the board
        if (!parentElement?.classList.contains("square")) { return }

        //Generating the new board with the removed piece
        const newBoard: Square[] = board.map((square: Square) => {
            if (square.name !== parentElement.id) {
                return square
            } else {
                return {
                    ...square,
                    color: null,
                    piece: null
                }
            }
        })

        //Updating state to the new board
        setBoard(newBoard);

        //Removing the child img element
        parentElement.innerHTML = '';

    }

    //Handlers to start / play the game
    const StartGame = () => {
        //Updating the square drop handlers
        const squares = document.getElementsByClassName("square");
        for(let i=0; i < squares.length; i++) {
            squares[i].addEventListener("drop", () => MovePiece());
        }

        //Updating state
        setStartGame(true);

    }

    const MovePiece = () => {
        console.log("Move");
    }

    return (
        <div className="main-container" onDrop={RemovePiece} onDragOver={DivPreventDefault} onDragStart={DivPreventDefault}>
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
                        const altRow = (square.name.charCodeAt(0) + Number(square.name[1])) % 2;
                        return <div id={square.name} className={`square ${altRow ? "light-square": "dark-square"}`} onDrop={AddPiece} onDragOver={HoverPiece} onDragStart={DivPreventDefault}></div>
                    }
                    )}
                </div>
            </div>
            <div>
                <img src="img/white_pawn.png" id="White Pawn" alt="White Pawn" onDragStart={(e) => DragPiece(e, "White", "Pawn")}/>
            </div>
            <img src="img/white_rook.png" id="White Rook" alt="White Rook" onDragStart={(e) => DragPiece(e, "White", "Rook")}/>
            <img src="img/white_knight.png" id="White Knight" alt="White Knight" onDragStart={(e) => DragPiece(e, "White", "Knight")}/>
            <img src="img/white_bishop.png" id="White Bishop" alt="White Bishop" onDragStart={(e) => DragPiece(e, "White", "Bishop")}/>
            <img src="img/white_queen.png" id="White Queen" alt="White Queen" onDragStart={(e) => DragPiece(e, "White", "Queen")}/>
            <img src="img/white_king.png" id="White King" alt="White King" onDragStart={(e) => DragPiece(e, "White", "King")}/>
            <img src="img/black_pawn.png" id="Black Pawn" alt="Black Pawn" onDragStart={(e) => DragPiece(e, "Black", "Pawn")}/>
            <img src="img/black_rook.png" id="Black Rook" alt="Black Rook" onDragStart={(e) => DragPiece(e, "Black", "Rook")}/>
            <img src="img/black_knight.png" id="Black Knight" alt="Black Knight" onDragStart={(e) => DragPiece(e, "Black", "Knight")}/>
            <img src="img/black_bishop.png" id="Black Bishop" alt="Black Bishop" onDragStart={(e) => DragPiece(e, "Black", "Bishop")}/>
            <img src="img/black_queen.png" id="Black Queen" alt="Black Queen" onDragStart={(e) => DragPiece(e, "Black", "Queen")}/>
            <img src="img/black_king.png" id="Black King" alt="Black King" onDragStart={(e) => DragPiece(e, "Black", "King")}/>
            <button onClick={StartGame}>Start Game</button>
        </div>
    )
}

