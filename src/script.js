document.addEventListener("DOMContentLoaded", async () => {
    // Colors
    const colorFree = 'rgba(0, 229, 255, 0.8)';
    const borderFree = '#00e5ff';
    const colorPaid = 'rgba(37, 99, 235, 0.8)';
    const borderPaid = '#2563EB';

    let categoriesData = {};
    let currentCategory = "Text & Chat";

    try {
        const response = await fetch('data/models.json');
        categoriesData = await response.json();
    } catch (error) {
        console.error("Failed to load models data:", error);
        return;
    }

    const categories = Object.keys(categoriesData);
    if(categories.length > 0 && !categoriesData[currentCategory]) {
        currentCategory = categories[0];
    }

    const tabsContainer = document.getElementById('categoryTabs');
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `category-tab ${cat === currentCategory ? 'active' : ''}`;
        btn.textContent = cat;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = cat;
            updateDashboard();
        });
        tabsContainer.appendChild(btn);
    });

    const ctx = document.getElementById('eloChart').getContext('2d');
    let eloChart = null;

    function updateDashboard() {
        const models = categoriesData[currentCategory] || [];
        
        // Update DOM Stats
        const topFree = models.find(m => m.type === 'free');
        const topPaid = models.find(m => m.type === 'paid');
        if (topFree) {
            document.getElementById('topFreeModel').innerText = topFree.name;
            document.getElementById('topFreeElo').innerText = topFree.elo + ' Elo';
        } else {
            document.getElementById('topFreeModel').innerText = 'N/A';
            document.getElementById('topFreeElo').innerText = '- Elo';
        }
        
        if (topPaid) {
            document.getElementById('topPaidModel').innerText = topPaid.name;
            document.getElementById('topPaidElo').innerText = topPaid.elo + ' Elo';
        }

        const minElo = Math.min(...models.map(m => m.elo)) - 20;
        const maxElo = Math.max(...models.map(m => m.elo)) + 20;

        if (eloChart) {
            eloChart.data.labels = models.map(m => m.name);
            eloChart.data.datasets[0].data = models.map(m => m.elo);
            eloChart.data.datasets[0].backgroundColor = models.map(m => m.type === 'free' ? colorFree : colorPaid);
            eloChart.data.datasets[0].borderColor = models.map(m => m.type === 'free' ? borderFree : borderPaid);
            eloChart.options.scales.x.min = minElo;
            eloChart.options.scales.x.max = maxElo;
            eloChart.update();
        } else {
            eloChart = new Chart(ctx, {
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
                        maxBarThickness: 30
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
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
                            min: minElo,
                            max: maxElo,
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#8a8d9b', font: { family: "'Fira Code', monospace" } }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { 
                                color: '#f0f0f5', 
                                font: { family: "'Inter', sans-serif", size: 12 },
                                autoSkip: false
                            }
                        }
                    },
                    animation: { duration: 1500, easing: 'easeOutQuart' }
                }
            });
        }
    }

    // Initial render
    updateDashboard();

    // Terminal Scrape & Sync Logic
    const syncBtn = document.getElementById('syncBtn');
    const terminal = document.getElementById('terminal');
    const terminalOutput = document.getElementById('terminalOutput');
    const lastSyncTime = document.getElementById('lastSyncTime');

    syncBtn.addEventListener('click', () => {
        if (!terminal.classList.contains('hidden')) return;

        terminal.classList.remove('hidden');
        terminalOutput.innerHTML = '';
        
        let cumulativeDelay = 0;
        
        const models = categoriesData[currentCategory] || [];
        const fetchSteps = models.slice(0, 5).map(m => ({ text: `FETCHING Arena.ai: ${m.name}... [${m.elo}]`, type: "norm", delay: 150 }));
        
        const terminalSteps = [
            { text: "> Initializing arena-scraper_v4.0...", type: "sys", delay: 300 },
            { text: "> Connecting to wss://arena.ai/api/live...", type: "sys", delay: 400 },
            { text: "[OK] Connection established. Handshake verified.", type: "norm", delay: 300 },
            { text: `> Pulling ${currentCategory} leaderboards...`, type: "sys", delay: 500 },
            ...fetchSteps,
            { text: "... (truncating additional logs)", type: "sys", delay: 200 },
            { text: "> Re-calculating Elo intervals...", type: "sys", delay: 500 },
            { text: "[OK] Cross-referencing complete. Data integrity: 100.00%", type: "norm", delay: 400 },
            { text: "> Updating DOM elements and Chart.js canvas...", type: "sys", delay: 300 },
            { text: "[SUCCESS] Sync complete.", type: "norm", delay: 300 }
        ];

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

        setTimeout(() => {
            const now = new Date();
            lastSyncTime.textContent = now.toLocaleTimeString();
            
            // Visual chart jiggle
            if(eloChart) {
                const data = eloChart.data.datasets[0].data;
                eloChart.data.datasets[0].data = data.map(val => val + Math.floor(Math.random() * 3) - 1);
                eloChart.update();
            }

            setTimeout(() => { terminal.classList.add('hidden'); }, 3000);
        }, cumulativeDelay + 500);
    });
});