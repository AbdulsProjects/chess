import { Outcome } from '../../board';
import './style.css'

export const GameOver = (props: {outcome: Outcome}) => {

    const Capitalize = (word: string): string => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    return (
        <div className='chess-game-over-container top-mid-container'>
            <p>{props.outcome.staleMate ? 'Stalemate!' : (Capitalize(props.outcome.winner!) + ' has won!')} <a href=''>Play again?</a></p>
        </div>
    )
}
