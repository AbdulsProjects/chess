import { Board, Outcome } from '@react-chess/shared/src/chess/board';
import './style.css'
import { useContext, useEffect } from 'react';
import { IWsContext, WsContext } from '../../../../contexts/wsContext';

interface Props {
    outcome: Outcome,
    setBoardAndHtml: (board: Board) => void,
    board: Board
}

export const GameOver = (props: Props) => {

    const { onlineState }  = useContext(WsContext) as IWsContext;

    //Setting up the event listener for the websocket response
    useEffect(() => {

        const restart = (event: MessageEvent<any>) => {
            const data = JSON.parse(event.data);
            if (data.method === 'restart-game') {
                const {_squares, _outcome, _gameState} = data.lobby.board;
                const newBoard = new Board(_squares, _outcome, _gameState);
                props.setBoardAndHtml(newBoard);
            };
        }

        //Creating the callback function to save the lobbies to state
        onlineState.wsConn?.addEventListener("message", restart);

        //Removing the event handler on unmount
        return () => {
            onlineState.wsConn?.removeEventListener("message", restart);
        };
    }, [])

    const Capitalize = (word: string): string => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    const restartGame = () => {

        if (onlineState.clientId !== undefined) {
            //Sending the request to restart the game
            const payLoad = {
                method: 'restart-game',
                clientId: onlineState.clientId,
                lobbyId: onlineState.lobby?.lobbyId
            };
    
            onlineState.wsConn!.send(JSON.stringify(payLoad));
        } else {
            const newBoard = props.board.clone();
            newBoard.reset()
            props.setBoardAndHtml(newBoard);
        }
    }

    return (
        <div className='chess-game-over-container top-mid-container'>
            <p>{props.outcome.stalemate ? 'Stalemate!' : (Capitalize(props.outcome.target!.colour! === 'white' ? 'black' : 'white') + ' has won!')} <a className='play-again' onClick={restartGame}>Play again?</a></p>
        </div>
    )
}
