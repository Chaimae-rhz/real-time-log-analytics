import React from 'react';
import PropTypes from 'prop-types';
import '../styles/main.css';

const StatusIndicator = ({ isOnline, totalLogs, timestamp, isConnecting = false, hasError = false }) => {

    const getStatusClasses = () => {
        let classes = 'status-indicator';
        if (isConnecting) classes += ' connecting';
        if (hasError) classes += ' error';
        if (!isOnline && !isConnecting) classes += ' offline';
        return classes;
    };


    const getStatusText = () => {
        if (isConnecting) {
            return 'Connexion en cours...';
        }
        if (hasError) {
            return 'Erreur de connexion • Vérification du système...';
        }
        if (isOnline) {
            return `Système opérationnel • ${totalLogs?.toLocaleString() || 0} logs traités`;
        }
        return 'Connexion perdue • Tentative de reconnexion...';
    };

    return (
        <div className="chart-container">
            <div className={getStatusClasses()}>
                <div className={`status-dot ${isOnline ? '' : 'offline'}`}></div>
                <span>{getStatusText()}</span>
                <span className="timestamp">
                    Dernière mise à jour : {timestamp || '--:--'}
                </span>
            </div>
        </div>
    );
};

StatusIndicator.propTypes = {
    isOnline: PropTypes.bool.isRequired,
    totalLogs: PropTypes.number,
    timestamp: PropTypes.string,
    isConnecting: PropTypes.bool,
    hasError: PropTypes.bool,
};

StatusIndicator.defaultProps = {
    totalLogs: 0,
    timestamp: '--:--',
    isConnecting: false,
    hasError: false,
};

export default StatusIndicator;