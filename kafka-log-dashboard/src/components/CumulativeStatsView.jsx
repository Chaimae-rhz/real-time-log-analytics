import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

const CumulativeStatsView = ({ stats, isDarkMode }) => {
    const containerRef = useRef(null);
    const [downloaded, setDownloaded] = useState(false);

    if (!stats) return <div style={{ padding: '1rem' }}>Chargement des données cumulées...</div>;

    const textColor = isDarkMode ? '#e0e0e0' : '#1a1a1a';
    const bgColor = isDarkMode ? '#1f1f1f' : '#ffffff';
    const borderColor = isDarkMode ? '#444' : '#ddd';
    const accentColor = '#0d6efd';

    const downloadChart = async () => {
        if (!containerRef.current) return;
        try {
            const canvas = await html2canvas(containerRef.current);
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = 'stats-cumulées.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 3000);
        } catch (error) {
            console.error('Erreur téléchargement image :', error);
        }
    };

    return (
        <div
            ref={containerRef}
            style={{
                backgroundColor: bgColor,
                color: textColor,
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 0 20px rgba(0,0,0,0.1)',

                maxWidth: '800px',
                margin: '0 auto',
                fontFamily: 'Segoe UI, sans-serif'
            }}
        >
            <h2 style={{ color: '#73bfb8', marginBottom: '1rem', fontWeight: 'bold' }}>
                📊 Statistiques Cumulées
            </h2>

            <div style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                <p><strong>Dernière mise à jour :</strong> {new Date().toLocaleTimeString()}</p>
                <p><strong>Total de logs traités :</strong> {stats.totalProcessedLogs.toLocaleString()}</p>
                <p><strong>Succès 2xx :</strong> <span style={{ color: '#28a745' }}>{stats.success2xx.toLocaleString()}</span></p>
                <p><strong>Erreurs 4xx :</strong> <span style={{ color: '#fd7e14' }}>{stats.errors4xx.toLocaleString()}</span></p>
                <p><strong>Erreurs 5xx :</strong> <span style={{ color: '#dc3545' }}>{stats.errors5xx.toLocaleString()}</span></p>
                <p><strong>Taux d’erreur 5xx :</strong> {stats.errorRatePercent} %</p>
            </div>

            <h3 style={{
                color: '#73bfb8',
                marginTop: '2rem',
                marginBottom: '1rem',
                borderBottom: `2px solid #73bfb8`,
                paddingBottom: '0.5rem'
            }}>
                Top 5 URLs les plus accédées
            </h3>

            <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.95rem' }}>
                {Object.entries(stats.urlStats ?? {}).slice(0, 5).map(([url, data]) => (
                    <li key={url} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0',
                        borderBottom: `1px solid ${borderColor}`
                    }}>
                        <span style={{
                            maxWidth: '65%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }} title={url}>
                            <strong>{url}</strong>
                        </span>
                        <span>{data.count.toLocaleString()} requêtes ({data.percentage}%)</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={downloadChart}
                style={{
                    marginTop: '2rem',
                    backgroundColor: '#73bfb8',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                Télécharger les statistiques
            </button>

            {downloaded && (
                <div style={{
                    marginTop: '1rem',
                    color: 'green',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                }}>
                    ✅ Statistiques enregistrées avec succès !
                </div>
            )}
        </div>
    );
};

export default CumulativeStatsView;
