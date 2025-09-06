
import React from 'react';
import '../styles/main.css';

const ErrorBar = ({ url, count, total, type }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const colorClass = type === '5xx' ? 'bar-red' : 'bar-orange';

    return (
        <div className="error-bar-container">
            <span className="error-label">{url}</span>
            <div className="error-bar-wrapper">
                <div className={`error-bar ${colorClass}`} style={{ width: `${percentage}%` }}></div>
            </div>
            <span className="error-count">{count} erreurs</span>
        </div>
    );
};

const TopErrorsView = ({ urls4xx = {}, urls5xx = {}, isDarkMode }) => {
    const total4xx = Object.values(urls4xx).reduce((acc, v) => acc + v, 0);
    const total5xx = Object.values(urls5xx).reduce((acc, v) => acc + v, 0);

    return (
        <div className={`top-errors-view ${isDarkMode ? 'dark' : ''}`}>
            <h2>🚨 URLs avec erreurs HTTP</h2>

            <h3>Erreurs Serveur (5xx)</h3>
            {Object.entries(urls5xx).length === 0 ? (
                <p>Aucune erreur serveur détectée.</p>
            ) : (
                Object.entries(urls5xx).map(([url, count]) => (
                    <ErrorBar key={url} url={url} count={count} total={total5xx} type="5xx" />
                ))
            )}

            <h3>Erreurs Client (4xx)</h3>
            {Object.entries(urls4xx).length === 0 ? (
                <p>Aucune erreur client détectée.</p>
            ) : (
                Object.entries(urls4xx).map(([url, count]) => (
                    <ErrorBar key={url} url={url} count={count} total={total4xx} type="4xx" />
                ))
            )}
        </div>
    );
};

export default TopErrorsView;
