//Piece movement is designed like this to allow for custom pieces to be created by the user in the future

export interface Piece {
    id: string,
    name: string,
    points: number,
    canPromote: boolean,
    canCastle: boolean,
    movement: Movement[]
}

export interface Movement {
    firstMoveOnly?: boolean,
    captureOnly?: boolean,
    moveOnly?: boolean,
    path: number[][],
    range: number
}

const definedPieces: Piece[] = [
{
    id: "pawn",
    name: "pawn",
    points: 1,
    canPromote: true,
    canCastle: false,
    movement: [
        {
            moveOnly: true,
            firstMoveOnly: true,
            path: [[0,1],[0,1]],
            range: 1
        },
        {
            moveOnly: true,
            path: [[0,1]],
            range: 1
        },
        {
            captureOnly: true,
            path: [[-1,1]],
            range: 1
        },
        {
            captureOnly: true,
            path: [[1,1]],
            range: 1
        }
        
    ]
},
{
    id: "bishop",
    name: "bishop",
    points: 3,
    canPromote: false,
    canCastle: false,
    movement: [
        {
            path: [[-1,-1]],
            range: 7
        },
        {
            path: [[-1,1]],
            range: 7
        },
        {
            path: [[1,-1]],
            range: 7
        },
        {
            path: [[1,1]],
            range: 7
        }
    ]
},
{
    id: "knight",
    name: "knight",
    points: 3,
    canPromote: false,
    canCastle: false,
    movement: [
        {
            path: [[1,2]],
            range: 1
        },
        {
            path: [[2,1]],
            range: 1
        },
        {
            path: [[2,-1]],
            range: 1
        },
        {
            path: [[1,-2]],
            range: 1
        },
        {
            path: [[-1,2]],
            range: 1
        },
        {
            path: [[-2,1]],
            range: 1
        },
        {
            path: [[-1,-2]],
            range: 1
        },
        {
            path: [[-2,-1]],
            range: 1
        }
    ]},
{
    id: "rook",
    name: "rook",
    points: 5,
    canPromote: false,
    canCastle: true,
    movement: [
        {
            path: [[-1,0]],
            range: 7
        },
        {
            path: [[1,0]],
            range: 7
        },
        {
            path: [[0,-1]],
            range: 7
        },
        {
            path: [[0,1]],
            range: 7
        }
    ]
},
{
    id: "queen",
    name: "queen",
    points: 9,
    canPromote: false,
    canCastle: false,
    movement: [
        {
            path: [[-1,-1]],
            range: 7
        },
        {
            path: [[-1,1]],
            range: 7
        },
        {
            path: [[1,-1]],
            range: 7
        },
        {
            path: [[1,1]],
            range: 7
        },        
        {
            path: [[-1,0]],
            range: 7
        },
        {
            path: [[1,0]],
            range: 7
        },
        {
            path: [[0,-1]],
            range: 7
        },
        {
            path: [[0,1]],
            range: 7
        }
    ]
},
{
    id: "king",
    name: "king",
    points: 0,
    canPromote: false,
    canCastle: false,
    movement: [
        {
            path: [[-1,-1]],
            range: 1
        },
        {
            path: [[-1,1]],
            range: 1
        },
        {
            path: [[1,-1]],
            range: 1
        },
        {
            path: [[1,1]],
            range: 1
        },        
        {
            path: [[-1,0]],
            range: 1
        },
        {
            path: [[1,0]],
            range: 1
        },
        {
            path: [[0,-1]],
            range: 1
        },
        {
            path: [[0,1]],
            range: 1
        }
    ]
}]
    

export default definedPieces;