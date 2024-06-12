import './style.css'
import '../style.css'
import React, { useContext, useEffect, useState } from 'react'
import { SmallBoard } from '../small-board';
import { Square } from '../../../board';
import { IWsContext, WsContext } from '../../../../../contexts/wsContext';

interface Props {
    boardToSuggest: Square[],
    PreviewBoard: (squares: Square[]) => void
};

export const SentSuggestion = (props: Props) => {

    const { onlineState }  = useContext(WsContext) as IWsContext;

    const [suggestedBoard, setSuggestedBoard] = useState<Square[]>([]);

    useEffect(() => {
        const testBoard: Square[] = [];
        for (let i = 8; i > 0; i--) {
            for (let j = 65; j < 73; j++) {
                testBoard.push({
                    id: String.fromCharCode(j) + i,
                    piece: 'king',
                    colour: 'white',
                    x: j-64,
                    y: i,
                    firstTurn: false,
                    targeting: [],
                    targetedBy: {
                        black: [],
                        white: []
                    }
                });
            };
        };

        setSuggestedBoard(testBoard);
    }, []);


    const SuggestBoard = () => {
        
        setSuggestedBoard(props.boardToSuggest);

        const payLoad = {
            method: 'suggest-board',
            clientId: onlineState.clientId,
            lobbyId: onlineState.lobbyId,
            squares: props.boardToSuggest
        };

        onlineState.wsConn!.send(JSON.stringify(payLoad));
    };

    return (
        <div className='chess-side-container chess-side-container-left suggestion-main-container'>
            <div className='suggestion-header'>
                <p>Your Suggestion</p>
            </div>
            <SmallBoard squares={suggestedBoard}/>
            <div className='suggestion-buttons'>
                <button className='chess-button'>Cancel</button>
                <button className='chess-button suggestion-button-middle' onClick={SuggestBoard}>Suggest</button>
                <button className='chess-button' onClick={() => props.PreviewBoard(suggestedBoard)}>Preview</button>
            </div>
        </div>      
    )
};
