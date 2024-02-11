interface Piece {
    id: string,
    name: string,
    points: number,
    movement: PieceMovement[]
}

interface PieceMovement {
    directions: Direction[]
}

interface Direction {
    firstMoveOnly?: boolean,
    noCollision?: boolean,
    captureOnly?: boolean,
    moveOnly?: boolean,
    path: number[][],
    range: number
}

const pieces: Piece[] = [
{
    id: "pawn",
    name: "pawn",
    points: 1,
    movement: [
        {
        directions: [
        {
            moveOnly: true,
            firstMoveOnly: true,
            path: [[0,2]],
            range: 1
        },
        {
            moveOnly: true,
            path: [[0,2]],
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
        }],
        }
    ]
},
{
    id: "bishop",
    name: "bishop",
    points: 3,
    movement: [
        {
        directions: [
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
        }],
        }
    ]
},
{
    id: "knight",
    name: "knight",
    points: 3,
    movement: [
        {
        directions: [
        {
            noCollision: true,
            path: [[1,2]],
            range: 1
        },
        {
            noCollision: true,
            path: [[2,1]],
            range: 1
        },
        {
            noCollision: true,
            path: [[2,-1]],
            range: 1
        },
        {
            noCollision: true,
            path: [[1,-2]],
            range: 1
        },
        {
            noCollision: true,
            path: [[-1,2]],
            range: 1
        },
        {
            noCollision: true,
            path: [[-2,1]],
            range: 1
        },
        {
            noCollision: true,
            path: [[-1,-2]],
            range: 1
        },
        {
            noCollision: true,
            path: [[-2,1]],
            range: 1
        },        ],
        }
    ]},
{
    id: "rook",
    name: "rook",
    points: 5,
    movement: [
        {
        directions: [
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
        }],
        }
    ]
},
{
    id: "queen",
    name: "queen",
    points: 9,
    movement: [
        {
        directions: [
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
        }],
        }
    ]
},
{
    id: "king",
    name: "king",
    points: 0,
    movement: [
        {
        directions: [
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
            }],
        }
    ]
}]
    

export default pieces;