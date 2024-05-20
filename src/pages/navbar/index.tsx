import { Link } from 'react-router-dom'
import './style.css'

export const NavBar = () => {

    return (
        <div className="nav-bar-container">
            <h3 className='nav-bar-title'>Abdul's Projects</h3>
            <Link to="/">Chess</Link>
        </div>
    )
}
