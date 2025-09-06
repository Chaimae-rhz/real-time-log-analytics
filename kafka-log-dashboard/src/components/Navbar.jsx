import React from 'react';
import '../styles/main.css';

const Navbar = ({ onChartSelect, onToggleDarkMode }) => {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="logo">
                    <img src="/logo.png" alt="Logo" className="logo-img" />
                    <div className="logo-text">
                        <h1>LogStream Analytics</h1>
                        <p>Real-Time Log Intelligence</p>
                    </div>
                </div>
                <ul className="nav-links">
                    <li><a href="#" onClick={() => onChartSelect('all')}>Dashboard</a></li>
                    <li><a href="#" onClick={() => onChartSelect('bar')}>Bar Chart</a></li>
                    <li><a href="#" onClick={() => onChartSelect('pie')}>Pie Chart</a></li>
                    <li><a href="#" onClick={() => onChartSelect('line')}>Line Chart</a></li>
                    <li><a href="#" onClick={() => onChartSelect('cumulative')}>Stats Cumulées</a></li>
                    <li><a href="#" onClick={() => onChartSelect('errors')}>Top Erreurs</a></li>

                </ul>
                <button className="dark-mode-toggle" onClick={onToggleDarkMode} title="Basculer le thème">
                    <i className="fas fa-moon"></i>
                </button>



            </div>
        </nav>
    );
};

export default Navbar;
