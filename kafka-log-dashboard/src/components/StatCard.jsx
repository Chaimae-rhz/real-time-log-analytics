import React from 'react';
import PropTypes from 'prop-types';
import '../styles/main.css';

const StatCard = ({ icon, label, value, color }) => {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${color}`}>
                <i className={`fas ${icon}`}></i>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
};

StatCard.propTypes = {
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    color: PropTypes.oneOf(['green', 'red', 'orange', 'blue']).isRequired
};

export default StatCard;
