import './style.css'
import '../style.css'
import { SmallBoard } from '../small-board';
import { Board, Square } from '../../../board';
import { useContext } from 'react';
import { IWsContext, WsContext } from '../../../../../contexts/wsContext';

interface Props {
    SetBoard: (board: Board) => void
    SetSquares: (squares: Square[]) => void
};

export const RecievedSuggestion = (props: Props) => {

    const { onlineState, createCallback }  = useContext(WsContext) as IWsContext;
    const currentSuggestion = onlineState.lobby?.suggestedSquares[onlineState.colour === 'white' ? 'black' : 'white'];

    const DeclineSuggestion = () => {
        
        const payload = {
            method: 'decline-suggestion',
            clientId: onlineState.clientId,
            lobbyId: onlineState.lobby!.lobbyId
        };

        onlineState.wsConn!.send(JSON.stringify(payload));

    };

    const AcceptSuggestion = () => {

        createCallback('accept-suggestion', (response) => {
            props.SetBoard(response.lobby.board);
        });

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