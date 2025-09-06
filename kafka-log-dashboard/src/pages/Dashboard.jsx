import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';

import StatusIndicator from '../components/StatusIndicator';

import Navbar from '../components/Navbar';
import { fetchStats } from '../services/statsService';
import '../styles/main.css';
import LogLineChart from '../components/LogLineChart';
import LogBarChart from '../components/LogBarChart';
import HttpCodePieChart from '../components/HttpCodePieChart';
import Footer from '../components/Footer';
import CumulativeStatsView from '../components/CumulativeStatsView';
import {fetchCumulativeStats} from "../services/cumulativeStatsService";
import TopErrorsView from "../components/TopErrorsView";


const Dashboard = () => {
    const [stats, setStats] = useState(() => {
        const saved = localStorage.getItem('dashboardStats');
        return saved ? JSON.parse(saved) : null;
    });


    const [logHistory, setLogHistory] = useState([]);
    const [selectedChart, setSelectedChart] = useState('all');
    const [cumulativeStats, setCumulativeStats] = useState(null);

    const [backgroundStats, setBackgroundStats] = useState(null);
    const [isPaused, setIsPaused] = useState(() => {
        const saved = localStorage.getItem('dashboardIsPaused');
        return saved === 'true';
    });
    const [lastUpdate, setLastUpdate] = useState(() => {
        return localStorage.getItem('dashboardLastUpdate') || null;
    });
    const [pieData, setPieData] = useState(() => {

        const saved = localStorage.getItem('dashboardPieData');
        return saved ? JSON.parse(saved) : { success2xx: 0, errors4xx: 0, errors5xx: 0 };
    });
    const [barData, setBarData] = useState(() => {
        const saved = localStorage.getItem('dashboardBarData');
        return saved ? JSON.parse(saved) : {};
    });
    const getStats = async ({ updateDisplay = true } = {}) => {
        try {
            const data = await fetchStats();

            if (!isPaused) {
                setStats(data);
                localStorage.setItem('dashboardStats', JSON.stringify(data));
            }

            if (updateDisplay) {
                const now = new Date().toLocaleTimeString();
                setLastUpdate(now);
                localStorage.setItem('dashboardLastUpdate', now);

                setLogHistory(prev => [...prev.slice(-9), { timestamp: now, count: data.totalProcessedLogs }]);


                const newPieData = {
                    success2xx: data.success2xx || 0,
                    errors4xx: data.errors4xx || 0,
                    errors5xx: data.errors5xx || 0,
                };
                setPieData(newPieData);
                localStorage.setItem('dashboardPieData', JSON.stringify(newPieData));

                const newBarData = data.urlStats || {};
                setBarData(newBarData);
                localStorage.setItem('dashboardBarData', JSON.stringify(newBarData));
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des stats :", error);
        }
    };




    const getCumulativeStats = async () => {
        try {
            const data = await fetchCumulativeStats();
            setCumulativeStats(data);
        } catch (err) {
            console.error("Erreur lors du chargement des stats cumulées", err);
        }
    };


    useEffect(() => {
        localStorage.setItem('dashboardIsPaused', isPaused);
    }, [isPaused]);

    useEffect(() => {

        getStats({ updateDisplay: !isPaused });

        // Si pas en pause, continuer à récupérer toutes les 10s
        if (!isPaused) {
            const interval = setInterval(getStats, 10000);
            return () => clearInterval(interval);
        }
    }, [isPaused]);


    const [isDarkMode, setIsDarkMode] = useState(false);


    useEffect(() => {
        if (selectedChart === 'cumulative') {
            getCumulativeStats();

            const interval = setInterval(getCumulativeStats, 10000);
            return () => clearInterval(interval);
        }
    }, [selectedChart]);



    useEffect(() => {
        document.body.classList.toggle('dark-mode', isDarkMode);
    }, [isDarkMode]);
    useEffect(() => {
        const interval = setInterval(async () => {
            if (!isPaused) {
                const data = await fetchStats();
                setBackgroundStats(data);
                setStats(data);
            }
        }, 10000);


        if (!isPaused) {
            (async () => {
                const data = await fetchStats();
                setBackgroundStats(data);
                setStats(data);
            })();
        }

        return () => clearInterval(interval);
    }, [isPaused]);


    return (
        <div className="app-layout">
            <div className="main-content">
                <Navbar onChartSelect={setSelectedChart}

                        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
                />
                <button
                    onClick={() => setIsPaused(prev => !prev)}
                    className={`pause-icon-button ${isPaused ? 'paused' : ''}`}
                    title={isPaused ? 'Reprendre' : 'Pause'}
                >
                    <i className={`fas ${isPaused ? 'fa-play' : 'fa-pause'}`}></i>
                </button>
                <div className="dashboard-container">
                    {selectedChart === 'all' && (
                        <>
                            <StatusIndicator
                                isOnline={!!stats}
                                totalLogs={stats?.totalProcessedLogs}
                                timestamp={lastUpdate}
                            />

                            <div className="stats-grid">
                                <StatCard icon="fa-database" label="Logs Traités" value={stats?.totalProcessedLogs ?? 0} color="green" />
                                <StatCard icon="fa-exclamation-triangle" label="Erreurs 5xx" value={stats?.errors5xx ?? 0} color="red" />
                                <StatCard icon="fa-percent" label="Taux d'Erreur" value={`${stats?.errorRatePercent ?? 0}%`} color="orange" />
                                <StatCard icon="fa-clock" label="Dernière Activité" value={lastUpdate ?? '--:--'} color="blue" />
                            </div>
                        </>
                    )}


                    <div className="chart-section">
                        {(selectedChart === 'all' || selectedChart === 'pie') && (
                            <HttpCodePieChart
                                success2xx={pieData.success2xx}
                                clientErrors4xx={pieData.errors4xx}
                                serverErrors5xx={pieData.errors5xx}
                                isDarkMode={isDarkMode}
                            />

                        )}

                        {(selectedChart === 'all' || selectedChart === 'bar') && (
                            <LogBarChart urlStats={barData} isDarkMode={isDarkMode} />

                        )}
                    </div>

                    {(selectedChart === 'all' || selectedChart === 'line') && (
                        <div className="chart-section-line">
                            <LogLineChart dataPoints={logHistory} isDarkMode={isDarkMode} isPaused={isPaused} />

                        </div>
                    )}
                    {selectedChart === 'cumulative' && (
                        <div className="chart-section">
                            <CumulativeStatsView stats={cumulativeStats} isDarkMode={isDarkMode}/>
                        </div>
                    )}
                    {selectedChart === 'errors' && (
                        <div className="chart-section">
                            <TopErrorsView
                                urls4xx={stats?.urls4xx}
                                urls5xx={stats?.urls5xx}
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    )}







                    <button className="refresh-button" onClick={getStats}>
                        <i className="fas fa-sync-alt"></i>
                    </button>
                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
