import React, { useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import html2canvas from "html2canvas";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const LogBarChart = ({ urlStats, isDarkMode = false }) => {

    const chartRef = useRef();

    const sortedEntries = Object.entries(urlStats || {}).sort((a, b) => b[1].count - a[1].count);
    const labels = sortedEntries.map(([url]) => url);
    const counts = sortedEntries.map(([, stats]) => stats.count);
    const [downloaded, setDownloaded] = useState(false);
    const containerRef = useRef(null);
    const colorMap = {
        "/dashboard": "#01a7c2",
        "/login": "#468faf",
        "/pay":  "#48cae4",
        "/home":  "#007090",
        // URLs non définies recevront une couleur par défaut :
        "default": "#9e9e9e"
    };
    const backgroundColors = labels.map(url => colorMap[url] || colorMap["default"]);

    const data = {
        labels,
        datasets: [{
            label: 'Nombre de Requêtes',
            data: counts,
            backgroundColor: backgroundColors,
        }],
    };
    const textColor = isDarkMode ? '#eee' : '#333';
    const gridColor = isDarkMode ? '#444' : '#ccc';

    const options = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                titleColor: isDarkMode ? '#ffffff' : '#111',
                bodyColor: isDarkMode ? '#d1d5db' : '#333',
                borderColor: isDarkMode ? '#4b5563' : '#ccc',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                    label: context => `${context.parsed.y} requêtes`,
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Pages (URLs)',
                    font: { size: 14, weight: 'bold' },
                    color: textColor,
                },
                ticks: {
                    color: textColor,
                    callback: function (value, index) {
                        const label = labels[index];
                        return label.length > 15 ? label.slice(0, 12) + '…' : label;
                    },
                },
                grid: {
                    color: gridColor,
                },
            },
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                    color: textColor,
                },
                title: {
                    display: true,
                    text: 'Nombre de Requêtes',
                    font: { size: 14, weight: 'bold' },
                    color: textColor,
                },
                grid: {
                    color: gridColor,
                },
            },
        },
    };



    const downloadChart = async () => {
        if (!containerRef.current) return;

        try {
            const canvas = await html2canvas(containerRef.current);
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Bar_chart.png';
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

        <div className="chart-container"
             ref={containerRef}
             style={{
            backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
            color: textColor,
            padding: '1rem',
            borderRadius: '12px',
        }}>
            <h3 className="chart-title"><i className="fas fa-chart-bar"></i> Requêtes par URL</h3>
            <p className="chart-note">
                {labels.length === 0
                    ? "Aucune donnée disponible pour le moment."
                    : `Affichage des URL les plus sollicitées.`}
            </p>
            <Bar ref={(el) => { chartRef.current = el; }} data={data} options={options} style={{ marginTop: '50px'}} />
            <button className="download-button-bar" onClick={downloadChart}>
                 Télécharger le graphique
            </button>
            {downloaded && (
                <div style={{ marginTop: '8px', marginLeft: '30%', color: 'green', fontWeight: 'bold', fontSize: '12px' }}>
                    ✅ Graphique téléchargé avec succès !
                </div>
            )}

        </div>
    );
};

export default LogBarChart;
