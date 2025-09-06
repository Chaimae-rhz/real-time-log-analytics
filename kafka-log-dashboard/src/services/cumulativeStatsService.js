
export async function fetchCumulativeStats() {
    const res = await fetch("http://localhost:8081/statsCumulative");
    if (!res.ok) throw new Error("Échec de récupération des stats cumulées");
    return res.json();
}
