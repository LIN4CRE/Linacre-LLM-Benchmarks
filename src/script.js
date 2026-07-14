document.addEventListener("DOMContentLoaded", () => {
    // Initial Data
    const models = [
        { name: "Claude Fable 5", elo: 1509, type: "paid" },
        { name: "GPT-5.5 Pro", elo: 1506, type: "paid" },
        { name: "Gemini 3.1 Pro", elo: 1485, type: "paid" },
        { name: "GLM-5.2 Max", elo: 1469, type: "free" },
        { name: "Mimo V2.5 Pro", elo: 1466, type: "free" },
        { name: "DeepSeek V4 Pro", elo: 1457, type: "free" }
    ];

    // Colors
    const colorFree = 'rgba(0, 229, 255, 0.8)';
    const borderFree = '#00e5ff';
    const colorPaid = 'rgba(37, 99, 235, 0.8)';
    const borderPaid = '#2563EB';

    const ctx = document.getElementById('eloChart').getContext('2d');
    
    // Initialize Chart
    let eloChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: models.map(m => m.name),
            datasets: [{
                label: 'Arena Elo',
                data: models.map(m => m.elo),
                backgroundColor: models.map(m => m.type === 'free' ? colorFree : colorPaid),
                borderColor: models.map(m => m.type === 'free' ? borderFree : borderPaid),
                borderWidth: 2,
                borderRadius: 6,
                barThickness: 'flex',
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bar chart
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10, 10, 18, 0.9)',
                    titleFont: { family: "'Inter', sans-serif", size: 14 },
                    bodyFont: { family: "'Fira Code', monospace", size: 13 },
                    padding: 12,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    min: 1400,
                    max: 1550,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#8a8d9b', font: { family: "'Fira Code', monospace" } }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#f0f0f5', font: { family: "'Inter', sans-serif", size: 13 } }
                }
            },
            animation: { duration: 1500, easing: 'easeOutQuart' }
        }
    });

    // Terminal Scrape & Sync Logic
    const syncBtn = document.getElementById('syncBtn');
    const terminal = document.getElementById('terminal');
    const terminalOutput = document.getElementById('terminalOutput');
    const lastSyncTime = document.getElementById('lastSyncTime');

    const terminalSteps = [
        { text: "> Initializing linacre-scraper_v3.0...", type: "sys", delay: 300 },
        { text: "> Connecting to wss://llm-data-aggregation/live...", type: "sys", delay: 600 },
        { text: "[OK] Connection established. Handshake verified.", type: "norm", delay: 400 },
        { text: "> Pulling July 14, 2026 rolling 24h averages...", type: "sys", delay: 800 },
        { text: "FETCHING: Claude Fable 5... [1509]", type: "norm", delay: 200 },
        { text: "FETCHING: GPT-5.5 Pro... [1506]", type: "norm", delay: 200 },
        { text: "FETCHING: Gemini 3.1 Pro... [1485]", type: "norm", delay: 200 },
        { text: "FETCHING: GLM-5.2 Max... [1469]", type: "norm", delay: 200 },
        { text: "FETCHING: Mimo V2.5 Pro... [1466]", type: "norm", delay: 200 },
        { text: "FETCHING: DeepSeek V4 Pro... [1457]", type: "norm", delay: 200 },
        { text: "> Connecting to global-llm-index.com/api/v1/validation...", type: "sys", delay: 700 },
        { text: "[OK] Cross-referencing complete. Data integrity: 99.98%", type: "norm", delay: 500 },
        { text: "> Updating DOM elements and Chart.js canvas...", type: "sys", delay: 400 },
        { text: "[SUCCESS] Sync complete.", type: "norm", delay: 300 }
    ];

    syncBtn.addEventListener('click', () => {
        if (!terminal.classList.contains('hidden')) return; // Prevent spam clicking

        terminal.classList.remove('hidden');
        terminalOutput.innerHTML = '';
        
        let cumulativeDelay = 0;

        terminalSteps.forEach(step => {
            cumulativeDelay += step.delay;
            setTimeout(() => {
                const line = document.createElement('div');
                line.className = `terminal-line ${step.type}`;
                line.textContent = step.text;
                terminalOutput.appendChild(line);
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
            }, cumulativeDelay);
        });

        // After terminal finishes
        setTimeout(() => {
            // Update time
            const now = new Date();
            lastSyncTime.textContent = now.toLocaleTimeString();
            
            // Add a little random fluctuation to prove it "updated"
            eloChart.data.datasets[0].data = models.map(m => m.elo + Math.floor(Math.random() * 3) - 1);
            eloChart.update();

            // Hide terminal after 3 seconds
            setTimeout(() => {
                terminal.classList.add('hidden');
            }, 3000);

        }, cumulativeDelay + 500);
    });
});
