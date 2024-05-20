import { Dispatch, SetStateAction, useState } from 'react'
import './style.css'
import { ChooseConnectivity } from './choose-connectivity'
import { LobbyUi } from './lobby-ui'

interface Props {
    setShowBoard: Dispatch<SetStateAction<boolean>>
}

export const LobbySelection = (props: Props) => {

    const [showLobbyUi, setShowLobbyUi] = useState(false);

    return (
        <div className='lobby-selection-main-container'>
            <div className='lobby-selection-current-tab'>
                {showLobbyUi ? <LobbyUi /> : <ChooseConnectivity setShowBoard={props.setShowBoard} setShowLobbyUi={setShowLobbyUi} />}
            </div>
        </div>
    )
}
