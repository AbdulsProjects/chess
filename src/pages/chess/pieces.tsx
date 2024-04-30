//Piece movement is designed like this to allow for custom pieces to be created by the user in the future

interface Piece {
    id: string,
    name: string,
    points: number,
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
        //THIS IS A TESTING PATH, NEEDS TO BE REMOVED ONCE TESTING IS FINISHED
        {
            path: [[1,0], [0,1], [0,1]],
            range: 1
        }
    ]
},
{
    id: "knight",
    name: "knight",
    points: 3,
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