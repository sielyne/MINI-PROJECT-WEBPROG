FeatureHandler.registerFeature('bmi', {
    bmiChart: null,
    bmiData: [],

    init() {
        document.getElementById('bmi-form').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('bmiBackBtn').addEventListener('click', () => FeatureHandler.showPage('menu'));
        this.loadHistory();
    },

    handleSubmit(e) {
        e.preventDefault();
        if (!FeatureHandler.getCurrentUser()) return alert("Login first!");

        const height = document.getElementById('height').value;
        const weight = document.getElementById('weight').value;

        if (!height || !weight || height < 100 || height > 250 || weight < 30 || weight > 200) {
            alert('Please enter valid height (100-250cm) and weight (30-200kg)');
            return;
        }

        const data = new URLSearchParams();
        data.append('username', FeatureHandler.getCurrentUser());
        data.append('height', height);
        data.append('weight', weight);

        fetch('/bmi', { method: 'POST', body: data })
            .then(res => res.json())
            .then(result => {
                if (result.error) {
                    alert('Error: ' + result.error);
                    return;
                }

                document.getElementById('bmi-result').innerHTML = `
                    <div class="bmi-result">
                        <h3>Your BMI: ${result.bmi}</h3>
                        <p class="bmi-status ${result.status.toLowerCase()}">${result.status}</p>
                        <small>Calculated on ${new Date().toLocaleDateString()}</small>
                    </div>
                `;

                this.bmiData.push({
                    date: new Date().toLocaleDateString(),
                    value: parseFloat(result.bmi)
                });

                this.updateBMIChart();
                this.loadHistory();
                e.target.reset();
            })
            .catch(err => {
                alert('Network error. Please try again.');
                console.error('BMI Error:', err);
            });
    },

    updateBMIChart() {
        if (!this.bmiChart) {
            this.bmiChart = new Chart(document.getElementById('bmiChart'), {
                type: 'line',
                data: {
                    labels: this.bmiData.map(d => d.date),
                    datasets: [{
                        label: 'BMI Progress',
                        data: this.bmiData.map(d => d.value),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: false, min: 15, max: 35 }
                    }
                }
            });
        } else {
            this.bmiChart.data.labels = this.bmiData.map(d => d.date);
            this.bmiChart.data.datasets[0].data = this.bmiData.map(d => d.value);
            this.bmiChart.update();
        }
    },

    loadHistory() {
        if (!FeatureHandler.getCurrentUser()) return;

        fetch(`/bmi-history?username=${FeatureHandler.getCurrentUser()}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    document.getElementById("bmi-result").innerHTML = `<p>${data.error}</p>`;
                    return;
                }

                this.bmiData = data.map(r => ({ date: r.date, value: parseFloat(r.value) }));
                this.updateBMIChart();

                let html = "<h3>BMI History</h3><ul>";
                data.forEach(r => {
                    html += `
                    <li>
                        ${r.date} - <b>${r.value}</b> (${r.status})
                        <button onclick="FeatureHandler.executeFeature('bmi', 'editRecord', ${r.id})">Edit</button>
                        <button onclick="FeatureHandler.executeFeature('bmi', 'deleteRecord', ${r.id})">Delete</button>
                    </li>`;
                });
                html += "</ul>";
                document.getElementById("bmi-result").innerHTML += html;
            })
            .catch(err => console.error("Error load history:", err));
    },

    deleteRecord(id) {
        fetch('/bmi', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: FeatureHandler.getCurrentUser(), id })
        }).then(res => res.json()).then(() => this.loadHistory());
    },

    editRecord(id) {
        let height = prompt("Masukkan tinggi baru (cm):");
        let weight = prompt("Masukkan berat baru (kg):");
        if (!height || !weight) return;

        fetch('/bmi', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: FeatureHandler.getCurrentUser(), id, height, weight })
        }).then(res => res.json()).then(() => this.loadHistory());
    }
});