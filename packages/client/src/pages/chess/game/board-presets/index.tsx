import './style.css'

export type PotentialPresets = 'standardGame' | 'allQueens' | 'allKnights' | 'mirror' | 'colourBlind' | 'revolutionBlack' | 'revolutionWhite' | 'sleeperAgent' | 'balancedChaos' | 'pureChaos';

interface Props {
    hidePresets: () => void,
    setBoardPreset: (preset: PotentialPresets) => void
}


export const BoardPresets = (props: Props) => {

    return (
        <div className='chess-board-presets-main-container chess-side-container-left chess-side-container'>
            <div className='chess-board-presets-header-container'>
                <button className='chess-button' onClick={props.hidePresets}>X</button>
            </div>
            <div className='chess-board-presets-all-presets'>
                <div className='chess-board-presets-preset-container'>
                    <div className='chess-board-presets-preset-header-container'>
                        <p>Standard</p>
                        <button className='chess-button' onClick={() => props.setBoardPreset('standardGame')}>Set Board</button>
                    </div>
                    <div className='chess-board-presets-preset-body-container'>
                        <p>A normal game of chess. If it ain't broke, don't fix it!</p>
                    </div>
                </div>
                <div className='chess-board-presets-preset-container'>
                    <div className='chess-board-presets-preset-header-container'>
                        <p>Oops! All Queens</p>
                        <button className='chess-button' onClick={() => props.setBoardPreset('allQueens')}>Set Board</button>
                    </div>
                    <div className='chess-board-presets-preset-body-container'>
                        <p>King Crunch and his queens CHANGE THIS, THIS IS CRINGE</p>
                    </div>
                </div>
                <div className='chess-board-presets-preset-container'>
                    <div className='chess-board-presets-preset-header-container'>
                        <p>Revolution</p>
                        <button className='chess-button' onClick={() => props.setBoardPreset('revolutionWhite')}>Set Board</button>
                    </div>
                    <div className='chess-board-presets-preset-body-container'>
                        <p>Pawns vs. the upper class</p>
                    </div>
                </div>
                <div className='chess-board-presets-preset-container'>
                    <div className='chess-board-presets-preset-header-container'>
                        <p>Colour Blind</p>
                        <button className='chess-button' onClick={() => props.setBoardPreset('colourBlind')}>Set Board</button>
                    </div>
                    <div className='chess-board-presets-preset-body-container'>
                        <p>All pieces that wouldn't cause an immediate check have their colour randomised</p>
                    </div>
                </div>
                <div className='chess-board-presets-preset-container'>
                    <div className='chess-board-presets-preset-header-container'>
                        <p>Joust / Take on the L but I think this might also be cringe</p>
                        <button className='chess-button' onClick={() => props.setBoardPreset('allKnights')}>Set Board</button>
                    </div>
                    <div className='chess-board-presets-preset-body-container'>
                        <p>Arise, arise, Riders of Théoden!</p>
                    </div>
                </div>
                <div className='chess-board-presets-preset-container'>
                    <div className='chess-board-presets-preset-header-container'>
                        <p>Sleeper Agent</p>
                        <button className='chess-button' onClick={() => props.setBoardPreset('sleeperAgent')}>Set Board</button>
                    </div>
                    <div className='chess-board-presets-preset-body-container'>
                        <p>A random piece has it's colour swapped for both sides. This excludes kings, queens and pawns and is not symmetrical</p>
                    </div>
                </div>
                <div className='chess-board-presets-preset-container'>
                    <div className='chess-board-presets-preset-header-container'>
                        <p>Mirror</p>
                        <button className='chess-button' onClick={() => props.setBoardPreset('mirror')}>Set Board</button>
                    </div>
                    <div className='chess-board-presets-preset-body-container'>
                        <p>White and black swap places</p>
                    </div>
                </div>
                <div className='chess-board-presets-preset-container'>
                    <div className='chess-board-presets-preset-header-container'>
                        <p>Balanced Chaos</p>
                        <button className='chess-button' onClick={() => props.setBoardPreset('balancedChaos')}>Set Board</button>
                    </div>
                    <div className='chess-board-presets-preset-body-container'>
                        <p>All pieces except the king are randomised in both colour and piece. Each player gets the same number of each piece. May result in an instant check</p>
                    </div>
                </div>
                <div className='chess-board-presets-preset-container'>
                    <div className='chess-board-presets-preset-header-container'>
                        <p>Pure Chaos</p>
                        <button className='chess-button' onClick={() => props.setBoardPreset('pureChaos')}>Set Board</button>
                    </div>
                    <div className='chess-board-presets-preset-body-container'>
                        <p>All pieces except the king are randomised in both colour and piece with no symmetry. May result in an instant check, will result in a one-sided game</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
