import React, { useRef, useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Select from 'react-select';
import html2canvas from 'html2canvas';

import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

const colors = [
    '#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8',
    '#6610f2', '#fd7e14', '#6f42c1', '#20c997', '#e83e8c',
];
const getColor = (index) => colors[index % colors.length];

const LogLineChart = ({ isDarkMode,  isPaused }) => {
    const [dataPoints, setDataPoints] = useState([]);
    const [selectedUrls, setSelectedUrls] = useState([]);
    const [downloaded, setDownloaded] = useState(false);

    const containerRef = useRef(); // ✅ html2canvas target
    const colorMapRef = useRef({});

    useEffect(() => {
        if (isPaused) return;
        const fetchData = () => {
            fetch('http://localhost:8081/statsHistory')
                .then(res => res.json())
                .then(data => {
                    setDataPoints(prev => {
                        const lastTimestamp = prev[prev.length - 1]?.timestamp;
                        const newPoints = data.filter(d => d.timestamp !== lastTimestamp);
                        return [...prev, ...newPoints].slice(-30);
                    });
                })
                .catch(console.error);
        };
        fetchData();
        const intervalId = setInterval(fetchData, 10000);
        return () => clearInterval(intervalId);
    }, [isPaused]);

    const allUrls = new Set();
    dataPoints.forEach(point => {
        if (point.urlStats) {
            Object.keys(point.urlStats).forEach(url => allUrls.add(url));
        }
    });

    Array.from(allUrls).forEach((url) => {
        if (!colorMapRef.current[url]) {
            colorMapRef.current[url] = getColor(Object.keys(colorMapRef.current).length);
        }
    });
    useEffect(() => {

        const saved = localStorage.getItem('logLineDataPoints');
        if (saved) {
            setDataPoints(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {

        if (dataPoints.length > 0) {
            localStorage.setItem('logLineDataPoints', JSON.stringify(dataPoints));
        }
    }, [dataPoints]);

    useEffect(() => {

        if (dataPoints.length > 0 && selectedUrls.length === 0) {
            const uniqueUrls = new Set();
            dataPoints.forEach(p => {
                Object.keys(p.urlStats || {}).forEach(url => uniqueUrls.add(url));
            });
            setSelectedUrls(Array.from(uniqueUrls).slice(0, 5));
        }
    }, [dataPoints, selectedUrls.length]);

    if (dataPoints.length === 0) {
        return <div>Chargement des données...</div>;
    }

    const datasets = Array.from(allUrls)
        .filter(url => selectedUrls.includes(url))
        .map(url => ({
            label: url,
            data: dataPoints.map(p => p.urlStats?.[url]?.count ?? 0),
            fill: false,
            borderColor: colorMapRef.current[url],
            backgroundColor: colorMapRef.current[url],
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.4,
        }));

    const labels = dataPoints.map(p => p.timestamp.substring(11, 19)); // HH:mm:ss

    const chartData = { labels, datasets };

    const textColor = isDarkMode ? '#eee' : '#333';
    const gridColor = isDarkMode ? '#444' : '#ccc';

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    color: textColor,
                    font: { size: 12, weight: 'bold' },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Temps',
                    font: { size: 14, weight: 'bold' },
                    color: textColor,
                },
                ticks: { maxTicksLimit: 10, color: textColor },
                grid: { color: gridColor },
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Nombre de requêtes',
                    font: { size: 14, weight: 'bold' },
                    color: textColor,
                },
                ticks: { precision: 0, color: textColor },
                grid: { color: gridColor },
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
            link.download = 'log-line-chart.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 3000);
        } catch (err) {
            console.error("❌ Erreur lors du téléchargement:", err);
        }
    };

    return (
        <div
            ref={containerRef}
            className="chart-container"
            style={{
                backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                color: textColor,
                padding: '1rem',
                borderRadius: '12px',
            }}
        >
            <h3 className="chart-title">
                <i className="fas fa-chart-line"></i> Évolution des Logs par URL
            </h3>

            <div style={{ marginBottom: '1rem', width: '80%' }}>
                <Select
                    isMulti
                    options={Array.from(allUrls).map(url => ({ label: url, value: url }))}
                    value={selectedUrls.map(url => ({ label: url, value: url }))}
                    onChange={(selected) => setSelectedUrls(selected.map(opt => opt.value))}
                    placeholder="Sélectionnez les URLs à afficher..."
                    styles={{
                        control: (base) => ({
                            ...base,
                            backgroundColor: isDarkMode ? '#2c2c2c' : '#fff',
                            color: textColor,
                            borderColor: isDarkMode ? '#555' : '#ccc',
                        }),
                        menu: (base) => ({
                            ...base,
                            backgroundColor: isDarkMode ? '#2c2c2c' : '#fff',
                            color: textColor,
                        }),
                        option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused
                                ? isDarkMode ? '#444' : '#eee'
                                : isDarkMode ? '#2c2c2c' : '#fff',
                            color: textColor,
                        }),
                        singleValue: (base) => ({ ...base, color: textColor }),
                        multiValue: (base) => ({ ...base, backgroundColor: isDarkMode ? '#444' : '#ddd' }),
                        multiValueLabel: (base) => ({ ...base, color: textColor }),
                        multiValueRemove: (base) => ({
                            ...base,
                            color: textColor,
                            ':hover': {
                                backgroundColor: isDarkMode ? '#666' : '#ccc',
                                color: '#fff',
                            },
                        }),
                    }}
                />
            </div>

            <Line data={chartData} options={options} />

            <button className="download-button-line" onClick={downloadChart} style={{ marginTop: '1rem' }}>
                Télécharger le graphique
            </button>

            {downloaded && (
                <div style={{
                    marginTop: 8,
                    textAlign: 'center',
                    color: 'green',
                    fontWeight: 'bold',
                    fontSize: 12
                }}>
                    ✅ Graphique téléchargé avec succès !
                </div>
            )}
        </div>
    );
};

export default LogLineChart;
