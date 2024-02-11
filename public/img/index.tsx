import "./style.css"
import React, { useEffect, useState } from 'react'

export function Chess() {

    //Setting up the state

    interface Square {
        name: string,
        piece: string | null,
        color: string | null,
        position: number[]
    }

    //Storing the board in state
    const [board, setBoard] = useState<Square[]>([]);

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
    
    //This prevents the squares from being dragged
    const PreventDrag = (e: React.DragEvent) => {
        if ((e.target as HTMLElement).nodeName === "DIV") {e.preventDefault()};
    }
    
    const DragPiece = (e: React.DragEvent, color: string, piece: string) => {
        e.dataTransfer.setData("Color", color);
        e.dataTransfer.setData("Piece", piece);
        
        //Grabbing the img's Id
        let target = (e.target as HTMLElement);
        if (target.hasChildNodes()) {target = (target.firstChild as HTMLElement); }
        e.dataTransfer.setData("id", target.id)
    }

    const HoverPiece = (e: React.DragEvent) => {
        e.preventDefault();
    }

    const DropPiece = (e: React.DragEvent) => {
        //Potentially add a guard clause here for color/piece being null? Also need to add a guard clause that prevents multiple pieces from being added to the same square

        const color = e.dataTransfer.getData("Color");
        const piece = e.dataTransfer.getData("Piece");
        const targetSquare : HTMLElement = (e.target as HTMLElement).nodeName ==='IMG' ? (e.target as HTMLElement).parentElement! : (e.target as HTMLDivElement)!;
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

    return (
        <div className="main-container">
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
                        return <div id={square.name} className={`square ${altRow ? "light-square": "dark-square"}`} onDrop={DropPiece} onDragOver={HoverPiece} onDragStart={PreventDrag}></div>
                    }
                    )}
                </div>
            </div>
            <img src="img/white_pawn.png" id="White Pawn" alt="White Pawn" onDragStart={(e) => DragPiece(e, "White", "Pawn")}/>
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
        </div>
    )
}

