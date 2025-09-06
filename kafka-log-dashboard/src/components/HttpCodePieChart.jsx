import React, { useRef, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import html2canvas from 'html2canvas';

ChartJS.register(ArcElement, Tooltip, Legend);

const HttpCodePieChart = ({
                              success2xx = 0,
                              clientErrors4xx = 0,
                              serverErrors5xx = 0,
                              isDarkMode = false
                          }) => {
    const containerRef = useRef(null); // ✅ Pour html2canvas
    const [downloaded, setDownloaded] = useState(false);

    const data = {
        labels: ['Succès (2xx)', 'Erreurs Client (4xx)', 'Erreurs (5xx)'],
        datasets: [
            {
                data: [success2xx, clientErrors4xx, serverErrors5xx],
                backgroundColor: ['#8ecae6', '#219ebc', '#023047'],
                borderColor: 'transparent',
                borderWidth: 2,
                hoverOffset: 12,
                hoverBorderColor: '#000000',
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: isDarkMode ? '#f5f5f5' : '#374151',
                    font: {
                        size: 14,
                        weight: 'bold',
                    },
                    padding: 20,
                },
            },
            tooltip: {
                backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                titleColor: isDarkMode ? '#ffffff' : '#111',
                bodyColor: isDarkMode ? '#d1d5db' : '#333',
                borderColor: isDarkMode ? '#4b5563' : '#ccc',
                borderWidth: 1,
                cornerRadius: 8,
            },
        },
        cutout: '70%',
    };

    const downloadChart = async () => {
        if (!containerRef.current) return;

        try {
            const canvas = await html2canvas(containerRef.current);
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = 'http-codes-pie-chart.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 3000);
        } catch (error) {
            console.error("❌ Erreur lors du téléchargement:", error);
        }
    };

    return (
        <div
            ref={containerRef} // ✅ ref utilisée par html2canvas
            className="chart-container"
            style={{
                backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                color: isDarkMode ? '#eee' : '#111',
                padding: '1rem',
                borderRadius: '12px',

            }}
        >
            <h3 className="chart-title" style={{ marginBottom: '1rem' }}>
                <i className="fas fa-chart-pie"></i> Codes HTTP
            </h3>

            <Pie data={data} options={options} />

            <button className="download-button-pie" onClick={downloadChart} style={{ marginTop: '1rem' }}>
                Télécharger le graphique
            </button>

            {downloaded && (
                <div
                    style={{
                        marginTop: '8px',
                        textAlign: 'center',
                        color: 'green',
                        fontWeight: 'bold',
                        fontSize: '12px',
                    }}
                >
                    ✅ Graphique téléchargé avec succès !
                </div>
            )}
        </div>
    );
};

export default HttpCodePieChart;
