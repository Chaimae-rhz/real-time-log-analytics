export async function fetchStats() {
    const response = await fetch('http://localhost:8081/stats');
    if (!response.ok) throw new Error("Erreur lors de la récupération des données");
    return await response.json();

}
