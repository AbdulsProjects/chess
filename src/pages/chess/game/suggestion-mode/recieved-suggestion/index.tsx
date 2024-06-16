import './style.css'
import '../style.css'
import { SmallBoard } from '../small-board';
import { Square } from '../../../board';
import { useContext } from 'react';
import { IWsContext, WsContext } from '../../../../../contexts/wsContext';

interface Props {
    PreviewBoard: (squares: Square[]) => void
};

export const RecievedSuggestion = (props: Props) => {

    const { onlineState }  = useContext(WsContext) as IWsContext;
    const currentSuggestion = onlineState.lobby?.suggestedSquares[onlineState.colour === 'white' ? 'black' : 'white'];

    const DeclineSuggestion = () => {
        
        const payLoad = {
            method: 'decline-suggestion',
            clientId: onlineState.clientId,
            lobbyId: onlineState.lobby!.lobbyId
        };

        onlineState.wsConn!.send(JSON.stringify(payLoad));

    };

    return (
        <div className='chess-side-container chess-side-container-right suggestion-main-container'>
            <div className='suggestion-header'>
                <p>Opponent's Suggestion</p>
            </div>
            <SmallBoard squares={currentSuggestion}/>
            <div className='suggestion-buttons'>
                <button className='chess-button' disabled={!currentSuggestion || currentSuggestion.length === 0}>Accept</button>
                <button className='chess-button suggestion-button-middle' onClick={DeclineSuggestion} disabled={!currentSuggestion || currentSuggestion.length === 0}>Decline</button>
                <button className='chess-button' onClick={() => props.PreviewBoard(currentSuggestion!)} disabled={!currentSuggestion || currentSuggestion.length === 0}>Preview</button>
            </div>
        </div>      
    )
};