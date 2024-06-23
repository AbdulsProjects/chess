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