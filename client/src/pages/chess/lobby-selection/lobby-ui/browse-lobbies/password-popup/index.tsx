import { useContext } from 'react';
import './style.css'
import { IWsContext, WsContext } from '../../../../../../contexts/wsContext';

interface Props {
    setShowPasswordInput: (value: boolean) => void,
    joiningLobbyId: null | string
}

export const PasswordPopup = (props: Props) => {

    const { onlineState }  = useContext(WsContext) as IWsContext;

    const handleCloseButton = () => {
        const background = document.getElementById('grey-background')!;
        const popup = document.getElementById('password-popup')!;

        background.classList.remove('fade-in');
        popup.classList.remove('pop-up');

        background.classList.add('fade-out');
        popup.classList.add('close-pop-up');

        setTimeout(() => props.setShowPasswordInput(false), 800);
    }

    const JoinLobby = () => {
        
        const lobbyPassword = (document.getElementById('lobby-password')! as HTMLInputElement).value;

        const payLoad = {
            method: 'join',
            clientId: onlineState.clientId,
            lobbyId: props.joiningLobbyId,
            lobbyPassword: lobbyPassword
        };
        
        onlineState.wsConn!.send(JSON.stringify(payLoad));
    }

    return (
        <>
            <div id='grey-background' className='greyed-out fade-in '></div>
            <div id='password-popup' className='password-popup-main-container pop-up'>
                <div className='password-popup-header'>
                    <p>Enter Lobby Password</p>
                    <button className='chess-button' onClick={handleCloseButton}>X</button>
                </div>
                <div className='password-popup-body'>
                    <input id='lobby-password' type='text' />
                    <button className='chess-button' onClick={JoinLobby}>Join</button>
                </div>
            </div>
        </>
    )
}