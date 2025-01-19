import definedPieces, { Piece } from "./pieces"

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

export interface CapturedPiece {
    piece: string,
    points: number,
    number: number
};

interface GameState {
    inProgress: boolean,
    currentPlayer: 'black' | 'white',
    promotions: {
        black: string[],
        white: string[],
        nextPromotion: Square | null
    },
    capturedPieces: {
        black: CapturedPiece[],
        white: CapturedPiece[]
    }
};
            
interface RequestMoveResponse {
    action: 'castle' | 'capture' | 'move-self' | null, 
    succeeded: Boolean
};

export class Board {
    
    private _squares: Square[];
    private _outcome: Outcome;
    private _gameState: GameState;

    constructor(
        squares: Square[], 
        outcome: Outcome = {
            target: null, 
            targettedBy: [], 
            check: false, 
            checkmate: false, 
            stalemate: false
        },
        gameState: GameState = {
            inProgress: false,
            currentPlayer: 'white',
            promotions: {
                black: [],
                white: [],
                nextPromotion: null
            },
            capturedPieces: {
                black: [],
                white: []
            }
        }
    ) {
        this._squares = squares;
        this._outcome = outcome;
        this._gameState = gameState;
    };

    get squares() {
        return this._squares;
    };

    get outcome() {
        return this._outcome;
    };

    get gameState() {
        return this._gameState;
    };
    
    //Cloning the object so state isn't mutated
    clone(): Board {
        return new Board(this._squares, this._outcome, this._gameState);
    };

    //Starting the game
    startGame(): {message: string, succeeded: boolean} {
        
        //Exitting early if there isn't a king of both colours / there are multiple kings of the same colour
        const whiteKings = this.squares.filter(square => square.piece === 'king' && square.colour === 'white');
        const blackKings = this.squares.filter(square => square.piece === 'king' && square.colour === 'black');
        if (blackKings.length !== 1 || whiteKings.length !== 1) {
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
        this.checkForChecks('white');
        this.checkForChecks('black', true);

        //Checking for promotions
        this.checkForPromotions();

        this._gameState = {
            ...this._gameState,
            inProgress: true
        };

        return {
            message: '',
            succeeded: true
        };
    };

    //Adding a piece / pieces
    addPiece(pieces: PiecesToAdd[]) {
        
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
                    firstTurn: !this._gameState.inProgress,
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

        //Early return if a promotion is in progress
        if (this._gameState.promotions.nextPromotion) { return; }

        const oldSquare = this._squares.find(square => square.id === oldSquareId)!;
        const colour = oldSquare.colour!;
        const piece = oldSquare.piece!;

        //Moving the piece
        this.removePiece(oldSquareId);
        this.addPiece([{squareId: newSquareId, pieceId: piece, colour: colour}]);
        
        //Removing the targetted by array for the moved to square (this is recalculated in RecalculateAllMoves)
        this._squares.find(square => square.id === newSquareId)!.targetedBy[colour] = [];

        //Recalculating possible moves 
        this.recalculateAllMoves(colour);

        //Checking for promotions
        this.checkForPromotions();
    };


    //Validating and executing the move
    requestMove(sourceSquare: Square, targetSquare: Square): RequestMoveResponse {
        
        //Setting the default response value
        let response: RequestMoveResponse = {
            action: null,
            succeeded: false
        };

        if(this._gameState.inProgress) {
            //Returning if trying to grab the other player's piece
            const currentPlayer = this._gameState.currentPlayer;

            if (currentPlayer !== this._gameState.currentPlayer) { return response; }

            //Returning if trying to move to an invalid square
            const move = sourceSquare.targeting.find(targettingSquares => targettingSquares.target === targetSquare.id && targettingSquares.moveable);
            if (!move) { return response; }

            //Checking if there is a piece in the target square, and appending/updating captured squares if there is
            if (move.capture) {
                if (!this._gameState.capturedPieces[currentPlayer].find(piece => piece.piece === targetSquare.piece!)) {
                    const piecePoints = definedPieces.find(piece => piece.id === targetSquare.piece!)!.points;
                    this._gameState.capturedPieces[currentPlayer].push({piece: targetSquare.piece!, points: piecePoints, number: 1});
                } else {
                    this._gameState.capturedPieces[currentPlayer].find(piece => piece.piece === targetSquare.piece!)!.number += 1;
                };
            
                response = {
                    action: 'capture',
                    succeeded: true
                };

                this.movePiece(sourceSquare.id, targetSquare.id);

            //Castling
            } else if (move.castling) {
                this.castlePiece(move, currentPlayer);

                response = {
                    action: 'castle',
                    succeeded: true
                };

            //Moving
            } else {
                this.movePiece(sourceSquare.id, targetSquare.id);

                response = {
                    action: 'move-self',
                    succeeded: true
                };
            };

            //Changing the current player and resetting the outcome
            const newPlayer = currentPlayer === 'white' ? 'black' : 'white';
            this._gameState.currentPlayer = newPlayer;
            this._outcome = {
                target: null,
                targettedBy: [],
                check: false,
                checkmate: false,
                stalemate: false
            };

            //Checking if the player has won
            this.checkForChecks(newPlayer);
        };

        return response;
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

    //Completely restarting the state of the board
    reset() {
        this.clearBoard();
        this._outcome = {
            target: null, 
            targettedBy: [], 
            check: false, 
            checkmate: false, 
            stalemate: false
        };
        this._gameState = {
            inProgress: false,
            currentPlayer: 'white',
            promotions: {
                black: [],
                white: [],
                nextPromotion: null
            },
            capturedPieces: {
                black: [],
                white: []
            }
        };
    };

    //Checking for checkmates / stalemates. The firstBlackCheck param is used when starting the game as black can't start in check / stalemate since it's white's turn
    checkForChecks(colour: 'black' | 'white', firstBlackCheck = false) {

        const pieces = this._squares.filter(square => square.colour === colour);
        const validMove = Boolean(pieces.find(square => square.targeting.find(move => move.moveable)));
        const kingSquare = pieces.find(square => square.piece === 'king')!;
        const checkMoves = this.returnCheckMoves(kingSquare);

        //Stalemate
        if (checkMoves.length === 0 && !validMove) { 
            //Black can't start in stale mate as it's white's turn to begin with
            if (!firstBlackCheck) {
                this._outcome = {
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
                this._outcome = {
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
                if (firstBlackCheck) {
                    this._outcome = {
                        target: kingSquare,
                        targettedBy: targettedBy,
                        check: true,
                        checkmate: true,
                        stalemate: false
                    };
                } else {
                    this._outcome = {
                        target: kingSquare,
                        targettedBy: targettedBy,
                        check: true,
                        checkmate: false,
                        stalemate: false
                    };
                };
            };
        };
    };

    //Returning all squares that are due a promotion
    checkForPromotions() {

        //Checking the black promotion squares
        for (let i = 1; i <= 8; i++) {
            const square = this._squares.find(square => square.x === i && square.y === 1 && square.piece && square.colour === 'black');
            if (!square || !definedPieces.find(piece => piece.id === square!.piece)!.canPromote) { continue; }
            this.gameState.promotions.black.push(square.id);
        };

        //Checking the white promotion squares
        for (let i = 1; i <= 8; i++) {
            const square = this._squares.find(square => square.x === i && square.y === 8 && square.piece && square.colour === 'white');
            if (!square || !definedPieces.find(piece => piece.id === square!.piece)!.canPromote) { continue; }
            this.gameState.promotions.white.push(square.id);
        };

        //Setting the next square to promote
        if (this._gameState.promotions.white.length > 0) {
            this._gameState.promotions.nextPromotion = this._squares.find(square => square.id === this._gameState.promotions.white[0])!;
        } else if (this._gameState.promotions.black.length > 0) {
            this._gameState.promotions.nextPromotion = this._squares.find(square => square.id === this._gameState.promotions.black[0])!;
        };
    };

    //Promoting a piece
    promotePiece(newPiece: Piece) {

        if (!this._gameState.promotions.nextPromotion) { return; }

        const promotionSquare = this._gameState.promotions.nextPromotion;

        //Removing the piece
        this.removePiece(promotionSquare.id);

        //Adding in the new piece
        this.addPiece([{squareId: promotionSquare.id, pieceId: newPiece.id, colour: (promotionSquare.colour as 'black' | 'white')}]);
        
        //Updating the possible moves for newly empty square / the targeted squares
        for (let i = 0; i < promotionSquare.targeting.length; i++) {
            const targetSquareIndex = this._squares.findIndex(square => square.id === promotionSquare.targeting[i].target);
            const targetMoveIndex = this._squares[targetSquareIndex].targetedBy[promotionSquare.colour!].findIndex(move => move.source === promotionSquare.id);
            this._squares[targetSquareIndex].targetedBy[promotionSquare.colour!].splice(targetMoveIndex, 1);
        };            
        const promotionSquareIndex = this._squares.findIndex(square => square.id === promotionSquare.id);
        this._squares[promotionSquareIndex].targeting = [];

        //Updating the possible moves for the moved to square
        const moves = this.returnPieceMoves(this._squares[promotionSquareIndex]);
        this.mutateBoardWithMoves(moves, promotionSquare.id);

        
        //Removing the promoted square from the pending promotions
        this._gameState.promotions[promotionSquare.colour as 'black' | 'white'].shift();
        this._gameState.promotions.nextPromotion = null;
        
        //Setting the next square to promote
        if (this._gameState.promotions.white.length > 0) {
            this._gameState.promotions.nextPromotion = this._squares.find(square => square.id === this._gameState.promotions.white[0])!;
        } else if (this._gameState.promotions.black.length > 0) {
            this._gameState.promotions.nextPromotion = this._squares.find(square => square.id === this._gameState.promotions.black[0])!;
        };
    
        //Calculating the possible moves for the next player's next turn and checks for losses if this was the last promotion (may not be the last promotion when the game is started)
        if (this.gameState.promotions.white.length + this.gameState.promotions.black.length === 0) { 
            this.calculatePlayerMoves(promotionSquare.colour === 'white' ? 'black' : 'white');
            
            //First turn variable used as if a promotion happens at the start of the game, black can't be in check / stalemate since it's white's turn
            const firstTurn = promotionSquare.firstTurn;
            this.checkForChecks('white'); 
            this.checkForChecks('black', firstTurn); 
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
            {squareId: 'H2', pieceId: 'pawn', colour: 'white'}
        ]);
    };

    allQueens() {
        this.clearBoard();
        this.addPiece([
            {squareId: 'A8', pieceId: 'queen', colour: 'black'},
            {squareId: 'B8', pieceId: 'queen', colour: 'black'},
            {squareId: 'C8', pieceId: 'queen', colour: 'black'},
            {squareId: 'D8', pieceId: 'queen', colour: 'black'},
            {squareId: 'E8', pieceId: 'king', colour: 'black'},
            {squareId: 'F8', pieceId: 'queen', colour: 'black'},
            {squareId: 'G8', pieceId: 'queen', colour: 'black'},
            {squareId: 'H8', pieceId: 'queen', colour: 'black'},
            {squareId: 'A7', pieceId: 'queen', colour: 'black'},
            {squareId: 'B7', pieceId: 'queen', colour: 'black'},
            {squareId: 'C7', pieceId: 'queen', colour: 'black'},
            {squareId: 'D7', pieceId: 'queen', colour: 'black'},
            {squareId: 'E7', pieceId: 'queen', colour: 'black'},
            {squareId: 'F7', pieceId: 'queen', colour: 'black'},
            {squareId: 'G7', pieceId: 'queen', colour: 'black'},
            {squareId: 'H7', pieceId: 'queen', colour: 'black'},

            {squareId: 'A1', pieceId: 'queen', colour: 'white'},
            {squareId: 'B1', pieceId: 'queen', colour: 'white'},
            {squareId: 'C1', pieceId: 'queen', colour: 'white'},
            {squareId: 'D1', pieceId: 'queen', colour: 'white'},
            {squareId: 'E1', pieceId: 'king', colour: 'white'},
            {squareId: 'F1', pieceId: 'queen', colour: 'white'},
            {squareId: 'G1', pieceId: 'queen', colour: 'white'},
            {squareId: 'H1', pieceId: 'queen', colour: 'white'},
            {squareId: 'A2', pieceId: 'queen', colour: 'white'},
            {squareId: 'B2', pieceId: 'queen', colour: 'white'},
            {squareId: 'C2', pieceId: 'queen', colour: 'white'},
            {squareId: 'D2', pieceId: 'queen', colour: 'white'},
            {squareId: 'E2', pieceId: 'queen', colour: 'white'},
            {squareId: 'F2', pieceId: 'queen', colour: 'white'},
            {squareId: 'G2', pieceId: 'queen', colour: 'white'},
            {squareId: 'H2', pieceId: 'queen', colour: 'white'}
        ]);
    }

    allKnights() {
        this.clearBoard();
        this.addPiece([
            {squareId: 'A8', pieceId: 'knight', colour: 'black'},
            {squareId: 'B8', pieceId: 'knight', colour: 'black'},
            {squareId: 'C8', pieceId: 'knight', colour: 'black'},
            {squareId: 'D8', pieceId: 'knight', colour: 'black'},
            {squareId: 'E8', pieceId: 'king', colour: 'black'},
            {squareId: 'F8', pieceId: 'knight', colour: 'black'},
            {squareId: 'G8', pieceId: 'knight', colour: 'black'},
            {squareId: 'H8', pieceId: 'knight', colour: 'black'},
            {squareId: 'A7', pieceId: 'knight', colour: 'black'},
            {squareId: 'B7', pieceId: 'knight', colour: 'black'},
            {squareId: 'C7', pieceId: 'knight', colour: 'black'},
            {squareId: 'D7', pieceId: 'knight', colour: 'black'},
            {squareId: 'E7', pieceId: 'knight', colour: 'black'},
            {squareId: 'F7', pieceId: 'knight', colour: 'black'},
            {squareId: 'G7', pieceId: 'knight', colour: 'black'},
            {squareId: 'H7', pieceId: 'knight', colour: 'black'},

            {squareId: 'A1', pieceId: 'knight', colour: 'white'},
            {squareId: 'B1', pieceId: 'knight', colour: 'white'},
            {squareId: 'C1', pieceId: 'knight', colour: 'white'},
            {squareId: 'D1', pieceId: 'knight', colour: 'white'},
            {squareId: 'E1', pieceId: 'king', colour: 'white'},
            {squareId: 'F1', pieceId: 'knight', colour: 'white'},
            {squareId: 'G1', pieceId: 'knight', colour: 'white'},
            {squareId: 'H1', pieceId: 'knight', colour: 'white'},
            {squareId: 'A2', pieceId: 'knight', colour: 'white'},
            {squareId: 'B2', pieceId: 'knight', colour: 'white'},
            {squareId: 'C2', pieceId: 'knight', colour: 'white'},
            {squareId: 'D2', pieceId: 'knight', colour: 'white'},
            {squareId: 'E2', pieceId: 'knight', colour: 'white'},
            {squareId: 'F2', pieceId: 'knight', colour: 'white'},
            {squareId: 'G2', pieceId: 'knight', colour: 'white'},
            {squareId: 'H2', pieceId: 'knight', colour: 'white'}
        ]);
    }

    mirror() {
        this.clearBoard();
        this.addPiece([
            {squareId: 'A8', pieceId: 'rook', colour: 'white'},
            {squareId: 'B8', pieceId: 'knight', colour: 'white'},
            {squareId: 'C8', pieceId: 'bishop', colour: 'white'},
            {squareId: 'D8', pieceId: 'queen', colour: 'white'},
            {squareId: 'E8', pieceId: 'king', colour: 'white'},
            {squareId: 'F8', pieceId: 'bishop', colour: 'white'},
            {squareId: 'G8', pieceId: 'knight', colour: 'white'},
            {squareId: 'H8', pieceId: 'rook', colour: 'white'},
            {squareId: 'A7', pieceId: 'pawn', colour: 'white'},
            {squareId: 'B7', pieceId: 'pawn', colour: 'white'},
            {squareId: 'C7', pieceId: 'pawn', colour: 'white'},
            {squareId: 'D7', pieceId: 'pawn', colour: 'white'},
            {squareId: 'E7', pieceId: 'pawn', colour: 'white'},
            {squareId: 'F7', pieceId: 'pawn', colour: 'white'},
            {squareId: 'G7', pieceId: 'pawn', colour: 'white'},
            {squareId: 'H7', pieceId: 'pawn', colour: 'white'},

            {squareId: 'A1', pieceId: 'rook', colour: 'black'},
            {squareId: 'B1', pieceId: 'knight', colour: 'black'},
            {squareId: 'C1', pieceId: 'bishop', colour: 'black'},
            {squareId: 'D1', pieceId: 'queen', colour: 'black'},
            {squareId: 'E1', pieceId: 'king', colour: 'black'},
            {squareId: 'F1', pieceId: 'bishop', colour: 'black'},
            {squareId: 'G1', pieceId: 'knight', colour: 'black'},
            {squareId: 'H1', pieceId: 'rook', colour: 'black'},
            {squareId: 'A2', pieceId: 'pawn', colour: 'black'},
            {squareId: 'B2', pieceId: 'pawn', colour: 'black'},
            {squareId: 'C2', pieceId: 'pawn', colour: 'black'},
            {squareId: 'D2', pieceId: 'pawn', colour: 'black'},
            {squareId: 'E2', pieceId: 'pawn', colour: 'black'},
            {squareId: 'F2', pieceId: 'pawn', colour: 'black'},
            {squareId: 'G2', pieceId: 'pawn', colour: 'black'},
            {squareId: 'H2', pieceId: 'pawn', colour: 'black'}
        ]);
    }

    colourBlind() {
        
        const randomColours = Array.from({ length: 11 },() => Math.round(Math.random()));
        
        this.clearBoard();
        this.addPiece([
            //These pieces are always the same as they can result in an immediate checkmate
            {squareId: 'D8', pieceId: 'queen', colour: 'black'},
            {squareId: 'E8', pieceId: 'king', colour: 'black'},
            {squareId: 'D7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'E7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'F7', pieceId: 'pawn', colour: 'black'},
            
            {squareId: 'D1', pieceId: 'queen', colour: 'white'},
            {squareId: 'E1', pieceId: 'king', colour: 'white'},
            {squareId: 'D2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'E2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'F2', pieceId: 'pawn', colour: 'white'},
            
            //These pieces are randomly asigned a colour symmetrically
            {squareId: 'H8', pieceId: 'rook', colour: randomColours[0] ? 'black' : 'white'},
            {squareId: 'G8', pieceId: 'knight', colour: randomColours[1] ? 'black' : 'white'},
            {squareId: 'F8', pieceId: 'bishop', colour: randomColours[2] ? 'black' : 'white'},
            {squareId: 'C8', pieceId: 'bishop', colour: randomColours[3] ? 'black' : 'white'},
            {squareId: 'B8', pieceId: 'knight', colour: randomColours[4] ? 'black' : 'white'},
            {squareId: 'A8', pieceId: 'rook', colour: randomColours[5] ? 'black' : 'white'},
            {squareId: 'H7', pieceId: 'pawn', colour: randomColours[6] ? 'black' : 'white'},
            {squareId: 'G7', pieceId: 'pawn', colour: randomColours[7] ? 'black' : 'white'},
            {squareId: 'C7', pieceId: 'pawn', colour: randomColours[8] ? 'black' : 'white'},
            {squareId: 'B7', pieceId: 'pawn', colour: randomColours[9] ? 'black' : 'white'},
            {squareId: 'A7', pieceId: 'pawn', colour: randomColours[10] ? 'black' : 'white'},

            {squareId: 'A1', pieceId: 'rook', colour: randomColours[0] ? 'white' : 'black'},
            {squareId: 'B1', pieceId: 'knight', colour: randomColours[1] ? 'white' : 'black'},
            {squareId: 'C1', pieceId: 'bishop', colour: randomColours[2] ? 'white' : 'black'},
            {squareId: 'F1', pieceId: 'bishop', colour: randomColours[3] ? 'white' : 'black'},
            {squareId: 'G1', pieceId: 'knight', colour: randomColours[4] ? 'white' : 'black'},
            {squareId: 'H1', pieceId: 'rook', colour: randomColours[5] ? 'white' : 'black'},
            {squareId: 'A2', pieceId: 'pawn', colour: randomColours[6] ? 'white' : 'black'},
            {squareId: 'B2', pieceId: 'pawn', colour: randomColours[7] ? 'white' : 'black'},
            {squareId: 'C2', pieceId: 'pawn', colour: randomColours[8] ? 'white' : 'black'},
            {squareId: 'G2', pieceId: 'pawn', colour: randomColours[9] ? 'white' : 'black'},
            {squareId: 'H2', pieceId: 'pawn', colour: randomColours[10] ? 'white' : 'black'}
        ]);
    }

    revolutionBlack() {
        this.clearBoard();
        this.addPiece([
            {squareId: 'B1', pieceId: 'knight', colour: 'white'},
            {squareId: 'C1', pieceId: 'bishop', colour: 'white'},
            {squareId: 'D1', pieceId: 'queen', colour: 'white'},
            {squareId: 'E1', pieceId: 'king', colour: 'white'},
            {squareId: 'F1', pieceId: 'bishop', colour: 'white'},
            {squareId: 'G1', pieceId: 'knight', colour: 'white'},

            {squareId: 'A8', pieceId: 'pawn', colour: 'black'},
            {squareId: 'B8', pieceId: 'pawn', colour: 'black'},
            {squareId: 'C8', pieceId: 'pawn', colour: 'black'},
            {squareId: 'D8', pieceId: 'pawn', colour: 'black'},
            {squareId: 'E8', pieceId: 'king', colour: 'black'},
            {squareId: 'F8', pieceId: 'pawn', colour: 'black'},
            {squareId: 'G8', pieceId: 'pawn', colour: 'black'},
            {squareId: 'H8', pieceId: 'pawn', colour: 'black'},
            {squareId: 'A7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'B7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'C7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'D7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'E7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'F7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'G7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'H7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'A6', pieceId: 'pawn', colour: 'black'},
            {squareId: 'B6', pieceId: 'pawn', colour: 'black'},
            {squareId: 'C6', pieceId: 'pawn', colour: 'black'},
            {squareId: 'D6', pieceId: 'pawn', colour: 'black'},
            {squareId: 'E6', pieceId: 'pawn', colour: 'black'},
            {squareId: 'F6', pieceId: 'pawn', colour: 'black'},
            {squareId: 'G6', pieceId: 'pawn', colour: 'black'},
            {squareId: 'H6', pieceId: 'pawn', colour: 'black'}
        ]);
    }

    revolutionWhite() {
        this.clearBoard();
        this.addPiece([
            {squareId: 'B8', pieceId: 'knight', colour: 'black'},
            {squareId: 'C8', pieceId: 'bishop', colour: 'black'},
            {squareId: 'D8', pieceId: 'queen', colour: 'black'},
            {squareId: 'E8', pieceId: 'king', colour: 'black'},
            {squareId: 'F8', pieceId: 'bishop', colour: 'black'},
            {squareId: 'G8', pieceId: 'knight', colour: 'black'},

            {squareId: 'A1', pieceId: 'pawn', colour: 'white'},
            {squareId: 'B1', pieceId: 'pawn', colour: 'white'},
            {squareId: 'C1', pieceId: 'pawn', colour: 'white'},
            {squareId: 'D1', pieceId: 'pawn', colour: 'white'},
            {squareId: 'E1', pieceId: 'king', colour: 'white'},
            {squareId: 'F1', pieceId: 'pawn', colour: 'white'},
            {squareId: 'G1', pieceId: 'pawn', colour: 'white'},
            {squareId: 'H1', pieceId: 'pawn', colour: 'white'},
            {squareId: 'A2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'B2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'C2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'D2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'E2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'F2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'G2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'H2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'A3', pieceId: 'pawn', colour: 'white'},
            {squareId: 'B3', pieceId: 'pawn', colour: 'white'},
            {squareId: 'C3', pieceId: 'pawn', colour: 'white'},
            {squareId: 'D3', pieceId: 'pawn', colour: 'white'},
            {squareId: 'E3', pieceId: 'pawn', colour: 'white'},
            {squareId: 'F3', pieceId: 'pawn', colour: 'white'},
            {squareId: 'G3', pieceId: 'pawn', colour: 'white'},
            {squareId: 'H3', pieceId: 'pawn', colour: 'white'}
        ]);
    }

    sleeperAgent() {

        const flippedPiece = Math.floor(Math.random() * 6);

        this.clearBoard();
        this.addPiece([
            {squareId: 'A8', pieceId: 'rook', colour: flippedPiece === 0 ? 'white' : 'black'},
            {squareId: 'B8', pieceId: 'knight', colour: flippedPiece === 1 ? 'white' : 'black'},
            {squareId: 'C8', pieceId: 'bishop', colour: flippedPiece === 2 ? 'white' : 'black'},
            {squareId: 'D8', pieceId: 'queen', colour: 'black'},
            {squareId: 'E8', pieceId: 'king', colour: 'black'},
            {squareId: 'F8', pieceId: 'bishop', colour: flippedPiece === 3 ? 'white' : 'black'},
            {squareId: 'G8', pieceId: 'knight', colour: flippedPiece === 4 ? 'white' : 'black'},
            {squareId: 'H8', pieceId: 'rook', colour: flippedPiece === 5 ? 'white' : 'black'},
            {squareId: 'A7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'B7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'C7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'D7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'E7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'F7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'G7', pieceId: 'pawn', colour: 'black'},
            {squareId: 'H7', pieceId: 'pawn', colour: 'black'},

            {squareId: 'A1', pieceId: 'rook', colour: flippedPiece === 5 ? 'black' : 'white'},
            {squareId: 'B1', pieceId: 'knight', colour: flippedPiece === 4 ? 'black' : 'white'},
            {squareId: 'C1', pieceId: 'bishop', colour: flippedPiece === 3 ? 'black' : 'white'},
            {squareId: 'D1', pieceId: 'queen', colour: 'white'},
            {squareId: 'E1', pieceId: 'king', colour: 'white'},
            {squareId: 'F1', pieceId: 'bishop', colour: flippedPiece === 2 ? 'black' : 'white'},
            {squareId: 'G1', pieceId: 'knight', colour: flippedPiece === 1 ? 'black' : 'white'},
            {squareId: 'H1', pieceId: 'rook', colour: flippedPiece === 0 ? 'black' : 'white'},
            {squareId: 'A2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'B2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'C2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'D2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'E2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'F2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'G2', pieceId: 'pawn', colour: 'white'},
            {squareId: 'H2', pieceId: 'pawn', colour: 'white'}
        ]);
    };

    balancedChaos() {
        this.clearBoard();

        const pieces = ['pawn', 'rook', 'knight', 'bishop', 'queen'];
        const selectedPieces = [];

        for (let i = 0; i < 15; i++) {
            selectedPieces.push(pieces[Math.floor(Math.random() * 5)]);
        }

        this.addPiece([
            {squareId: 'A8', pieceId: selectedPieces[0], colour: 'black'},
            {squareId: 'B8', pieceId: selectedPieces[1], colour: 'black'},
            {squareId: 'C8', pieceId: selectedPieces[2], colour: 'black'},
            {squareId: 'D8', pieceId: selectedPieces[3], colour: 'black'},
            {squareId: 'E8', pieceId: 'king', colour: 'black'},
            {squareId: 'F8', pieceId: selectedPieces[4], colour: 'black'},
            {squareId: 'G8', pieceId: selectedPieces[5], colour: 'black'},
            {squareId: 'H8', pieceId: selectedPieces[6], colour: 'black'},
            {squareId: 'A7', pieceId: selectedPieces[7], colour: 'black'},
            {squareId: 'B7', pieceId: selectedPieces[8], colour: 'black'},
            {squareId: 'C7', pieceId: selectedPieces[9], colour: 'black'},
            {squareId: 'D7', pieceId: selectedPieces[10], colour: 'black'},
            {squareId: 'E7', pieceId: selectedPieces[11], colour: 'black'},
            {squareId: 'F7', pieceId: selectedPieces[12], colour: 'black'},
            {squareId: 'G7', pieceId: selectedPieces[13], colour: 'black'},
            {squareId: 'H7', pieceId: selectedPieces[14], colour: 'black'},
        ]);

        //Randomising the pieces so they're not in the same order for white
        for (let i = 0; i < selectedPieces.length; i++) {
            const randomIndex = Math.floor((Math.random() * (selectedPieces.length - i)) + i);
            [selectedPieces[i], selectedPieces[randomIndex]] = [selectedPieces[randomIndex], selectedPieces[i]];
        }
        
        this.addPiece([
            {squareId: 'A1', pieceId: selectedPieces[0], colour: 'white'},
            {squareId: 'B1', pieceId: selectedPieces[1], colour: 'white'},
            {squareId: 'C1', pieceId: selectedPieces[2], colour: 'white'},
            {squareId: 'D1', pieceId: selectedPieces[3], colour: 'white'},
            {squareId: 'E1', pieceId: 'king', colour: 'white'},
            {squareId: 'F1', pieceId: selectedPieces[4], colour: 'white'},
            {squareId: 'G1', pieceId: selectedPieces[5], colour: 'white'},
            {squareId: 'H1', pieceId: selectedPieces[6], colour: 'white'},
            {squareId: 'A2', pieceId: selectedPieces[7], colour: 'white'},
            {squareId: 'B2', pieceId: selectedPieces[8], colour: 'white'},
            {squareId: 'C2', pieceId: selectedPieces[9], colour: 'white'},
            {squareId: 'D2', pieceId: selectedPieces[10], colour: 'white'},
            {squareId: 'E2', pieceId: selectedPieces[11], colour: 'white'},
            {squareId: 'F2', pieceId: selectedPieces[12], colour: 'white'},
            {squareId: 'G2', pieceId: selectedPieces[13], colour: 'white'},
            {squareId: 'H2', pieceId: selectedPieces[14], colour: 'white'}
        ]);
    };

    pureChaos() {
        this.clearBoard();

        const pieces = ['pawn', 'rook', 'knight', 'bishop', 'queen'];
        this.addPiece([
            {squareId: 'A8', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'B8', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'C8', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'D8', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'E8', pieceId: 'king', colour: 'black'},
            {squareId: 'F8', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'G8', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'H8', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'A7', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'B7', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'C7', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'D7', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'E7', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'F7', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'G7', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},
            {squareId: 'H7', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'black'},

            {squareId: 'A1', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'B1', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'C1', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'D1', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'E1', pieceId: 'king', colour: 'white'},
            {squareId: 'F1', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'G1', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'H1', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'A2', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'B2', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'C2', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'D2', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'E2', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'F2', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'G2', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'},
            {squareId: 'H2', pieceId: pieces[Math.floor(Math.random() * 5)], colour: 'white'}
        ]);
    };

};