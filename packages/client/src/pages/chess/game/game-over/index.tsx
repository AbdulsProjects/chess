import { Outcome } from '../../board';
import './style.css'

export const GameOver = (props: {outcome: Outcome}) => {

    const Capitalize = (word: string): string => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    return (
        <div className='chess-game-over-container top-mid-container'>
            <p>{props.outcome.stalemate ? 'Stalemate!' : (Capitalize(props.outcome.target!.colour! === 'white' ? 'black' : 'white') + ' has won!')} <a href=''>Play again?</a></p>
        </div>
    )
}
