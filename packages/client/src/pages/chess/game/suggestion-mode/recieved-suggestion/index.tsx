import './style.css'
import '../style.css'
import { SmallBoard } from '../small-board';
import { Board, Square } from '@react-chess/shared/src/chess/board';
import { useContext, useEffect } from 'react';
import { IWsContext, WsContext } from '../../../../../contexts/wsContext';

interface Props {
    SetBoard: (board: Board) => void
    SetSquares: (squares: Square[]) => void
};

export const RecievedSuggestion = (props: Props) => {

    const { onlineState }  = useContext(WsContext) as IWsContext;
    const currentSuggestion = onlineState.lobby?.suggestedSquares[onlineState.colour === 'white' ? 'black' : 'white'];

    //Creating a listener for accepting a suggestion
    useEffect(()=>{
    
        const acceptSuggestion = (event: MessageEvent<any>) => {
            const data = JSON.parse(event.data);
            if (data.method === 'accept-suggestion') {
                const { _squares, _outcome, _gameState } = data.lobby.board;
                props.SetBoard(new Board(_squares, _outcome, _gameState));
            };
        }

        onlineState.wsConn?.addEventListener("message", acceptSuggestion);

        //Removing the event listener on unmount
        return () => {
            onlineState.wsConn?.removeEventListener("message", acceptSuggestion);
        }
    },[]);

    const DeclineSuggestion = () => {
        
        const payload = {
            method: 'decline-suggestion',
            clientId: onlineState.clientId,
            lobbyId: onlineState.lobby!.lobbyId
        };

        onlineState.wsConn!.send(JSON.stringify(payload));

    };

    const AcceptSuggestion = () => {

        const payload = {
            method: 'accept-suggestion',
            clientId: onlineState.clientId,
            lobbyId: onlineState.lobby!.lobbyId
        };

        onlineState.wsConn!.send(JSON.stringify(payload));

    };

    return (
        <div className='chess-side-container chess-side-container-right suggestion-main-container'>
            <div className='suggestion-header'>
                <p>Opponent's Suggestion</p>
            </div>
            <SmallBoard squares={currentSuggestion}/>
            <div className='suggestion-buttons'>
                <button className='chess-button' onClick={AcceptSuggestion} disabled={!currentSuggestion || currentSuggestion.length === 0}>Accept</button>
                <button className='chess-button suggestion-button-middle' onClick={DeclineSuggestion} disabled={!currentSuggestion || currentSuggestion.length === 0}>Decline</button>
                <button className='chess-button' onClick={() => props.SetSquares(currentSuggestion!)} disabled={!currentSuggestion || currentSuggestion.length === 0}>Preview</button>
            </div>
        </div>      
    )
};