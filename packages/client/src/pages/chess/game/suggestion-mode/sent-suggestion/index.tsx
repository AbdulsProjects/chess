import './style.css'
import '../style.css'
import React, { useContext, useEffect, useState } from 'react'
import { SmallBoard } from '../small-board';
import { Square } from '@react-chess/shared/src/chess/board';
import { IWsContext, WsContext } from '../../../../../contexts/wsContext';

interface Props {
    boardToSuggest: Square[],
    SetSquares: (squares: Square[]) => void
};

export const SentSuggestion = (props: Props) => {

    const { onlineState }  = useContext(WsContext) as IWsContext;
    const currentSuggestion = onlineState.lobby?.suggestedSquares[onlineState.colour!];
    
    //Suggesting the current board
    const SuggestBoard = () => {

        //Returning if attempting to suggest a board without 2 kings
        if (props.boardToSuggest.filter(square => square.piece === 'king' && square.colour === 'white').length !== 1 || props.boardToSuggest.filter(square => square.piece === 'king' && square.colour === 'black').length !== 1) {
            alert('Each player must have exactly 1 king to start a game');
            return;
        };

        //Returning if there are no changed squares
        const differentSquares = props.boardToSuggest.filter((newSquare) => {
            const correspondingSquare = currentSuggestion!.find(oldSquare => oldSquare.id === newSquare.id);
            return (newSquare.piece && !correspondingSquare) || newSquare.piece !== correspondingSquare?.piece || newSquare.colour !== correspondingSquare?.colour;
        });
        if (differentSquares.length === 0) { return; }

        const payload = {
            method: 'suggest-board',
            clientId: onlineState.clientId,
            lobbyId: onlineState.lobby!.lobbyId,
            squares: props.boardToSuggest
        };

        onlineState.wsConn!.send(JSON.stringify(payload));
    };

    //Cancelling the current suggestion
    const CancelSuggestion = () => {
        
        if (currentSuggestion!.length === 0) { return; }

        const payload = {
            method: 'cancel-suggestion',
            clientId: onlineState.clientId,
            lobbyId: onlineState.lobby!.lobbyId
        };

        onlineState.wsConn!.send(JSON.stringify(payload));
    };

    return (
        <div className='chess-side-container chess-side-container-left suggestion-main-container'>
            <div className='suggestion-header'>
                <p>Your Suggestion</p>
            </div>
            <SmallBoard squares={currentSuggestion}/>
            <div className='suggestion-buttons'>
                <button className='chess-button' onClick={CancelSuggestion} disabled={!currentSuggestion || currentSuggestion.length === 0}>Cancel</button>
                <button className='chess-button suggestion-button-middle' onClick={SuggestBoard}>Suggest</button>
                <button className='chess-button' onClick={() => props.SetSquares(currentSuggestion!)} disabled={!currentSuggestion || currentSuggestion.length === 0}>Preview</button>
            </div>
        </div>      
    )
};