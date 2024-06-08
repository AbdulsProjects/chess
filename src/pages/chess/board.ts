import definedPieces, { Piece } from "./game/pieces"

export interface Square {
    id: string,
    piece: string | null,
    colour: 'black' | 'white' | null,
    x: number,
    y: number,
    firstTurn: boolean,
    targeting: TargetingSquare[],
    targetedBy: Target
};

export interface Target { 
    black: TargetingSquare[],
    white: TargetingSquare[]
};

export interface TargetingSquare {
    target: string,
    source: string,
    moveable: boolean,
    capture: boolean,
    moveOnly: boolean,
    castling: boolean,
    path: string[],
    blockedBy: {
        black: string[],
        white: string[]
    }
};

interface PiecesToAdd {
    squareId: string,
    pieceId: string,
    colour: 'black' | 'white'
};

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
};

export interface Outcome {
    target: Square | null,
    targettedBy: string[],
    check: boolean,
    checkmate: boolean, 
    stalemate: boolean
};

export class Board {
    
    private _squares: Square[];
    private _outcome: Outcome;

    constructor(squares: Square[], outcome: Outcome = {target: null, targettedBy: [], check: false, checkmate: false, stalemate: false}) {
        this._squares = squares;
        this._outcome = outcome;
    };

    get squares() {
        return this._squares;
    };

    get outcome() {
        return this._outcome;
    };

    //Cloning the object so state isn't mutated
    clone(): Board {
        return new Board(this._squares, this.outcome);
    };

    //Starting the game
    startGame(): {message: string, succeeded: boolean} {
        
        //Exitting early if there isn't a king of both colours / there are multiple kings of the same colour
        const whiteKings = this.squares.filter(square => square.piece === 'king' && square.colour === 'white');
        const blackKings = this.squares.filter(square => square.piece === 'king' && square.colour === 'black');
        if (blackKings.length + whiteKings.length !== 2 || !blackKings.length || !whiteKings.length) {
            return {
                message: 'Each player must have exactly 1 king to start a game',
                succeeded: false
            };
        };

        //Calculating possible moves. Needs to be ran 3 times as one colour's moves can affect the others due to checks
        this.calculatePlayerMoves('black');
        this.calculatePlayerMoves('white');
        this.calculatePlayerMoves('black');

        //Checking for immediate checks / check mates
        this.checkForChecks('white', false);
        this.checkForChecks('black', false);

        return {
            message: '',
            succeeded: true
        };
    };

    //Adding a piece / pieces
    addPiece(pieces: PiecesToAdd[], gameInProgress: boolean) {
        
        //Generating the updated board
        this._squares = this._squares.map((square: Square) => {
            const piece = pieces.find((piece) => piece.squareId === square.id);
            if (piece === undefined) {
                return {
                    ...square
                };
            } else {
                return {
                    ...square,
                    colour: piece.colour,
                    piece: piece.pieceId,
                    firstTurn: !gameInProgress,
                }
            }
        })
    };

    //Removing a piece
    removePiece(squareId: string) {

        //Generating the new board with the removed piece
        this._squares = this._squares.map((square: Square) => {
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

    };

    //Moving a piece
    movePiece(oldSquareId: string, newSquareId: string) {

        const oldSquare = this._squares.find(square => square.id === oldSquareId)!;
        const colour = oldSquare.colour!;
        const piece = oldSquare.piece!;

        //Moving the piece
        this.removePiece(oldSquareId);
        this.addPiece([{squareId: newSquareId, pieceId: piece, colour: colour}], true);
        
        //Removing the targetted by array for the moved to square (this is recalculated in RecalculateAllMoves)
        this._squares.find(square => square.id === newSquareId)!.targetedBy[colour] = [];

        //Recalculating possible moves 
        this.recalculateAllMoves(colour);

        //Checking if the player has won
        this.checkForChecks(colour === 'white' ? 'black' : 'white', true);
    };

    //Performing a castling move
    castlePiece(move: TargetingSquare, colour: 'black' | 'white') {
        
        //Grabbing and assigning the piece Ids
        const rank = colour === 'black' ? 8 : 1;
        const kingSquareId = 'E' + rank;
        const castlingPieceId = move.target === kingSquareId ? move.source : move.target;

        const kingSquareDest: string = (castlingPieceId[0] === 'A' ? 'C' : 'G') + rank;
        const castlingingPieceDest: string = (castlingPieceId[0] === 'A' ? 'D' : 'F') + rank;

        this.movePiece(kingSquareId, kingSquareDest);
        this.movePiece(castlingPieceId, castlingingPieceDest);
    };

    //Updating the squares array with the specified moves
    mutateBoardWithMoves(moves: TargetingSquare[], sourceSquareId: string, appendMove = false) {

        const colour = this._squares.find(square => square.id === sourceSquareId)!.colour;
        
        //Updating the current square with the moves
        const index = this._squares.findIndex(currSquare => currSquare.id === sourceSquareId);
        if (appendMove) {
            this._squares[index].targeting = [...this._squares[index].targeting, ...moves];
        } else {
            this._squares[index].targeting = moves;
        }

        //Updating the targetted squares with the moves
        for (let i = 0; i < moves.length; i++) {
            const targetIndex = this._squares.findIndex(currSquare => currSquare.id === moves[i].target);
            this._squares[targetIndex].targetedBy[colour as keyof Target].push(moves[i]);
        };
    };

    //Removing all pieces from the board
    clearBoard() {
        this.squares.map((square: Square): void => {
            this.removePiece(square.id);
        });
    };

    //Checking for checkmates / stalemates
    checkForChecks(colour: 'black' | 'white', gameInProgress: boolean) {

        //Setting the default outcome
        let outcome: Outcome = {
            target: null,
            targettedBy: [],
            check: false,
            checkmate: false,
            stalemate: false
        };

        const pieces = this._squares.filter(square => square.colour === colour);
        const validMove = Boolean(pieces.find(square => square.targeting.find(move => move.moveable)));
        const kingSquare = pieces.find(square => square.piece === 'king')!;
        const checkMoves = this.returnCheckMoves(kingSquare);

        //Stalemate
        if (checkMoves.length === 0 && !validMove) { 
            //Black can't start in stale mate as it's white's turn to begin with
            if (gameInProgress || colour === 'white') {
                outcome = {
                    target: kingSquare,
                    targettedBy: [],
                    check: false,
                    checkmate: false,
                    stalemate: true
                };
            };
        };

        //The king is currently in check
        if (checkMoves.length !== 0) {

            const targettedBy = checkMoves.map(move => move.source);

            //Checkmate
            if (!validMove) { 
                outcome = {
                    target: kingSquare,
                    targettedBy: targettedBy,
                    check: true,
                    checkmate: true,
                    stalemate: false
                };
            };
            
            //Check
            if (validMove) { 
                //White wins if black starts in check
                if (!gameInProgress && colour === 'black') {
                    outcome = {
                        target: kingSquare,
                        targettedBy: targettedBy,
                        check: true,
                        checkmate: true,
                        stalemate: false
                    };
                } else {
                    outcome = {
                        target: kingSquare,
                        targettedBy: targettedBy,
                        check: true,
                        checkmate: false,
                        stalemate: false
                    };
                };
            };
        };

        this._outcome = outcome;
    };

    //Returning all squares that are due a promotion
    checkForPromotions(): {black: string[], white: string[]} {

        const promotions: {black: string[], white: string[]} = {
            black: [],
            white: []
        }

        //Checking the black promotion squares
        for (let i = 1; i <= 8; i++) {
            const square = this._squares.find(square => square.x === i && square.y === 1 && square.piece && square.colour === 'black');
            if (!square || !definedPieces.find(piece => piece.id === square!.piece)!.canPromote) { continue; }
            promotions.black.push(square.id);
        };

        //Checking the white promotion squares
        for (let i = 1; i <= 8; i++) {
            const square = this._squares.find(square => square.x === i && square.y === 8 && square.piece && square.colour === 'white');
            if (!square || !definedPieces.find(piece => piece.id === square!.piece)!.canPromote) { continue; }
            promotions.white.push(square.id);
        };

        return promotions;
    };

    //Promoting a piece
    promotePiece(newPiece: Piece, promotionSquareId: string, lastPromotion: boolean) {
        
        const promotionSquare = this.squares.find(square => square.id === promotionSquareId)!;

        //Removing the piece
        this.removePiece(promotionSquareId);

        //Adding in the new piece
        this.addPiece([{squareId: promotionSquareId, pieceId: newPiece.id, colour: (promotionSquare.colour as 'black' | 'white')}], true);
        
        //Updating the possible moves for newly empty square / the targeted squares
        for (let i = 0; i < promotionSquare.targeting.length; i++) {
            const targetSquareIndex = this._squares.findIndex(square => square.id === promotionSquare.targeting[i].target);
            const targetMoveIndex = this._squares[targetSquareIndex].targetedBy[promotionSquare.colour!].findIndex(move => move.source === promotionSquare.id);
            this._squares[targetSquareIndex].targetedBy[promotionSquare.colour!].splice(targetMoveIndex, 1);
        };            
        const promotionSquareIndex = this._squares.findIndex(square => square.id === promotionSquareId);
        this._squares[promotionSquareIndex].targeting = [];

        //Updating the possible moves for the moved to square
        const moves = this.returnPieceMoves(this._squares[promotionSquareIndex]);
        this.mutateBoardWithMoves(moves, promotionSquareId);

        //Calculating the possible moves for the next player's next turn and checks for losses if this was the last promotion (may not be the last promotion when the game is started)
        if (!lastPromotion) { 
            this.calculatePlayerMoves(promotionSquare.colour === 'white' ? 'black' : 'white');
            const firstTurn = promotionSquare.firstTurn;
            this.checkForChecks('white', !firstTurn); 
            this.checkForChecks('black', !firstTurn); 
        };
    };

    //Returning all moves that currently put the specified king in check
    returnCheckMoves(king: Square): TargetingSquare[] {
        return king.targetedBy[king.colour === 'black' ? 'white' : 'black'].filter(move => move.capture);
    };

    //Returns all valid squares that don't open a check & prevent all current checks
    returnSquaresThatPreventCheck(square: Square): string[] {
        return square.piece === 'king' ? this.kingCheckBlocks(square) : this.nonKingCheckBlocks(square);
    };

    //Returns moves that block current checks for pieces that aren't the king
    nonKingCheckBlocks(square: Square) {

        const allyKingSquare = this._squares.find(currSquare => currSquare.piece === 'king' && currSquare.colour === square.colour)!;

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
    };

    //Returns moves for the king that don't result in a check
    kingCheckBlocks(square: Square): string[] {
        
        const surroundingSquares = this._squares.filter(currSquare => 
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
    };

    //Returns all valid castling moves
    returnCastlingMoves(colour: keyof Target): {[key: string]: TargetingSquare[]} | [] {
        //Castling is only allowed if:
        //1) The king / castling piece start in the correct places
        //2) The king / castling piece haven't moved yet
        //3) The squares between the king and castling piece are empty
        //4) The king doesn't pass over a targetted square
        //5) The king isn't currently in check
        
        const kingSquare = this._squares.find(square => square.id === (colour === 'black' ? 'E8' : 'E1'))!;

        //Return if the king isn't on the starting square or the king has moved
        if (kingSquare.piece !== 'king' || kingSquare.colour !== colour || !kingSquare.firstTurn) { return [] } 

        const leftCastlingSquare = this._squares.find(square => square.x === kingSquare.x - 4 && square.y === kingSquare.y)!;
        const leftCastlingPiece = definedPieces.find(piece => piece.id === leftCastlingSquare.piece);
        const rightCastlingSquare = this._squares.find(square => square.x === kingSquare.x + 3 && square.y === kingSquare.y)!;
        const rightCastlingPiece = definedPieces.find(piece => piece.id === rightCastlingSquare.piece);

        //Return if the king is currently in check
        if (this.returnCheckMoves(kingSquare).length !== 0) { return [] }

        //Checking if the left castle is a valid move
        let leftCastleBlocked: Boolean = !leftCastlingPiece || !leftCastlingPiece.canCastle || !leftCastlingSquare.firstTurn;
        //Checking if the 2 squares to the left of the king are targetted / occupied by another piece
        for (let i = 1; i < 3 && !leftCastleBlocked; i++) {
            const currSquare = this._squares.find(square => square.x === kingSquare.x - i && square.y === kingSquare.y)!;
            leftCastleBlocked = Boolean(currSquare.piece) || Boolean(currSquare.targetedBy[colour === 'black' ? 'white' : 'black'].find(move => !move.moveOnly && [...move.blockedBy.black, ...move.blockedBy.white].length === 0));
        }
        //Checking if the 3rd square to the left of the king is occupied
        leftCastleBlocked = leftCastleBlocked || Boolean(this._squares.find(square => square.x === kingSquare.x - 3 && square.y === kingSquare.y)!.piece);

        //Checking if the right castle is a valid move
        let rightCastleBlocked: Boolean = !rightCastlingPiece || !rightCastlingPiece.canCastle || !rightCastlingSquare.firstTurn;
        //Checking if the 2 squares to the right of the king are targetted / occupied by another piece
        for (let i = 1; i < 3 && !rightCastleBlocked; i++) {
            const currSquare = this._squares.find(square => square.x === kingSquare.x + i && square.y === kingSquare.y)!;
            rightCastleBlocked = Boolean(currSquare.piece) || Boolean(currSquare.targetedBy[colour === 'black' ? 'white' : 'black'].find(move => !move.moveOnly && [...move.blockedBy.black, ...move.blockedBy.white].length === 0));
        }
        
        //Return if neither castle is valid
        if (leftCastleBlocked && rightCastleBlocked) {return [] }

        const moves: {[key: string]: TargetingSquare[]} = {};
        if (!leftCastleBlocked) {
            moves[leftCastlingSquare.id] = [{
                target: kingSquare.id,
                source: leftCastlingSquare.id,
                moveable: true,
                capture: false,
                moveOnly: true,
                castling: true,
                path: [colour === 'white' ? 'D1' : 'D8'],
                blockedBy: {
                    black: [],
                    white: []
                }
            }];
            moves[kingSquare.id] = [{
                target: leftCastlingSquare.id,
                source: kingSquare.id,
                moveable: true,
                capture: false,
                moveOnly: true,
                castling: true,
                path: [colour === 'white' ? 'C1' : 'C8'],
                blockedBy: {
                    black: [],
                    white: []
                }
            }]
        }

        if (!rightCastleBlocked) {
            moves[rightCastlingSquare.id] = [{
                target: kingSquare.id,
                source: rightCastlingSquare.id,
                moveable: true,
                capture: false,
                moveOnly: true,
                castling: true,
                path: [colour === 'white' ? 'F1' : 'F8'],
                blockedBy: {
                    black: [],
                    white: []
                }
            }];

            //The king key may already be populated, so may have to push instead of assigning directly
            const kingRightCastleMove = {
                target: rightCastlingSquare.id,
                source: kingSquare.id,
                moveable: true,
                capture: false,
                moveOnly: true,
                castling: true,
                path: [colour === 'white' ? 'G1' : 'G8'],
                blockedBy: {
                    black: [],
                    white: []
                }
            }
            if (kingSquare.id in moves) {
                moves[kingSquare.id].push(kingRightCastleMove)
            } else {
                moves[kingSquare.id] = [kingRightCastleMove];
            }
            
        };

        return moves;
    };

    //Returns all piece moves for the specified square
    returnPieceMoves(square: Square):  TargetingSquare[] {
        
        //Returning a blank array if the square doesn't have a piece
        if (!square.piece) { return [] } 

        //Returning the corresponding piece object
        const pieceObj = definedPieces.find(piece => {
            return piece.id === square.piece;
        })!;

        //Retrieving the opposing king's square for later use
        const opposingKingSquare = this._squares.find(currSquare => currSquare.piece === 'king' && currSquare.colour !== square.colour)!;
        const allyKingSquare = this._squares.find(currSquare => currSquare.piece === 'king' && currSquare.colour === square.colour)!;

        //Returning all squares that prevent check / don't open up a new check
        const nonCheckSquares = this.returnSquaresThatPreventCheck(square);

        //Early return if no moves block check and the king is currently in check / the player is attempting to move the king
        if (nonCheckSquares.length === 0 && (this.returnCheckMoves(allyKingSquare).length !== 0 || square === allyKingSquare)) { return[] }

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
                    const stepTargetSquare = this._squares.find((square) => {
                        return square.x === result.currentIteration.x && square.y === result.currentIteration.y;
                    })

                    if (!stepTargetSquare) {
                        result.currentIteration.outOfBounds = true;
                        return;                        
                    }

                    //Adding the current step's square to the path array if the path doesn't already include the opposing king's square. This is to calculate what squares block check
                    if (!result.currentIteration.path.find(squareId => squareId === opposingKingSquare.id)) { result.currentIteration.path.push(stepTargetSquare.id) };

                    //Setting blocked = true if there is a piece on a square that isn't a capture square or if the piece is the same colour
                    if (stepTargetSquare!.piece !== null) {
                        //Appending the blocker to the blockedBy array
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
            
                const destTargetSquare = this._squares.find((square) => square.x === result.currentIteration.x && square.y === result.currentIteration.y)!;

                const currentTargettableSquare: TargetingSquare = {
                    target: destTargetSquare!.id,
                    source: square.id,
                    //Can move to the square if under the following conditions:
                    //1) The piece isn't blocked at any point in its path
                    //2) The direction isn't capture only, or it's capture only but there's a capturable piece on the target square
                    //3) The direction doesn't leave the current player open to a check
                    moveable: !result.currentIteration.blocked && (!direction.captureOnly || (direction.captureOnly && result.currentIteration.capture)) && (nonCheckSquares.length === 0 || Boolean(nonCheckSquares.find(squareId => squareId === destTargetSquare.id))),
                    capture: result.currentIteration.capture,
                    moveOnly: result.currentIteration.moveOnly,
                    castling: false,
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

    };

    //Calculates and sets all moves for the specified player
    calculatePlayerMoves(colour: 'black' | 'white') {
        
        //Removing the last set of calculations for the passed colour. Or clause catches squares that have just had a piece move off
        this._squares = this._squares.map((square) => {
            if (square.colour === colour || square.colour === null) {
                return {
                    ...square,
                    targeting: [],
                    targetedBy: {
                        ...square.targetedBy,
                        [colour]: []
                    }
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
        const squaresToCalculate: Square[] = this._squares.filter((square) => square.piece && square.colour === colour);
        squaresToCalculate.map((square): void => {

            //Exitting if no square found
            if (!square) { return undefined; }

            //Calculating moves for the current square
            const moves = this.returnPieceMoves(square);
            this.mutateBoardWithMoves(moves, square.id);

            return undefined;
        })

        //Calculating castling moves and updating the board with the returned moves
        const castleMoves = this.returnCastlingMoves(colour);
        for (const [key, value] of Object.entries(castleMoves)) {
            this.mutateBoardWithMoves(value, key, true);
        }
    };

    //Calculates and sets all moves for both players
    recalculateAllMoves(prevColour: 'black' | 'white') {
        this.calculatePlayerMoves(prevColour);
        this.calculatePlayerMoves(prevColour === 'black' ? 'white' : 'black');
    };


    //********************* BOARD PRESETS *********************

    //Standard game
    standardGame() {
        this.clearBoard();
        this.addPiece([
            {squareId: 'A8', pieceId: 'rook', colour: 'black'},
            {squareId: 'B8', pieceId: 'knight', colour: 'black'},
            {squareId: 'C8', pieceId: 'bishop', colour: 'black'},
            {squareId: 'D8', pieceId: 'queen', colour: 'black'},
            {squareId: 'E8', pieceId: 'king', colour: 'black'},
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
            {squareId: 'D1', pieceId: 'queen', colour: 'white'},
            {squareId: 'E1', pieceId: 'king', colour: 'white'},
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
        ], false);
    };
};