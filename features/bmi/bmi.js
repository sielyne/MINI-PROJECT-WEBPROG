FeatureHandler.registerFeature('bmi', {
    bmiChart: null,
    bmiData: [],
    latestBMIResult: '', // Simpan hasil BMI terbaru untuk ditampilkan kembali

    init() {
        const form = document.getElementById('bmi-form');
        const backBtn = document.getElementById('bmiBackBtn');
        if (!form || !backBtn) {
            console.error('BMI form or back button not found');
            return;
        }
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        backBtn.addEventListener('click', () => FeatureHandler.showPage('menu'));
        this.loadHistory();
    },

    handleSubmit(e) {
        e.preventDefault();
        if (!FeatureHandler.getCurrentUser()) {
            alert("Please login first!");
            return;
        }

        const height = parseFloat(document.getElementById('height').value);
        const weight = parseFloat(document.getElementById('weight').value);

        if (isNaN(height) || isNaN(weight) || height < 100 || height > 250 || weight < 30 || weight > 200) {
            alert('Please enter valid height (100-250cm) and weight (30-200kg)');
            return;
        }

        const today = new Date().toLocaleDateString();
        if (this.bmiData.find(d => d.date === today)) {
            if (!confirm('You have already submitted a BMI today. This will overwrite the previous entry. Continue?')) {
                return;
            }
        }

        const data = new URLSearchParams();
        data.append('username', FeatureHandler.getCurrentUser());
        data.append('height', height);
        data.append('weight', weight);

        fetch('/bmi', { method: 'POST', body: data })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(result => {
                if (result.error) {
                    alert('Error: ' + result.error);
                    return;
                }

                // Simpan hasil BMI terbaru
                this.latestBMIResult = `
                    <div class="bmi-result">
                        <h3>Your BMI: ${result.bmi}</h3>
                        <p class="bmi-status ${result.status.toLowerCase()}">${result.status}</p>
                        <small>Calculated on ${today}</small>
                    </div>
                `;

                // Perbarui bmiData untuk hari ini
                const existingIndex = this.bmiData.findIndex(d => d.date === today);
                if (existingIndex >= 0) {
                    this.bmiData[existingIndex].value = parseFloat(result.bmi);
                } else {
                    this.bmiData.push({
                        date: today,
                        value: parseFloat(result.bmi)
                    });
                }

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
        const canvas = document.getElementById('bmiChart');
        if (!canvas) {
            console.error('BMI chart canvas not found');
            return;
        }

        if (!window.Chart) {
            console.error('Chart.js library is not loaded');
            return;
        }

        if (typeof Chart === 'undefined') {
            console.error('Chart.js not loaded');
            document.getElementById('bmiChart').innerHTML = '<p>Error loading chart library</p>';
            return;
        }

        if (!this.bmiChart) {
            this.bmiData.sort((a, b) => new Date(a.date) - new Date(b.date));
            this.bmiChart = new Chart(canvas, {
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
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data.error) {
                    document.getElementById("bmi-result").innerHTML = this.latestBMIResult + `<p>${data.error}</p>`;
                    return;
                }

                this.bmiData = data.map(r => ({
                    date: r.date || new Date().toLocaleDateString(),
                    value: parseFloat(r.value) || 0
                }));
                this.updateBMIChart();

                // Bangun HTML untuk history tanpa duplikasi
                let html = this.latestBMIResult || ''; // Sertakan hasil BMI terbaru (jika ada)
                html += "<h3>BMI History</h3><ul>";
                data.forEach(r => {
                    html += `
                    <li>
                        ${r.date} - <b>${r.value}</b> (${r.status})
                        <button onclick="FeatureHandler.executeFeature('bmi', 'editRecord', ${r.id})">Edit</button>
                        <button onclick="FeatureHandler.executeFeature('bmi', 'deleteRecord', ${r.id})">Delete</button>
                    </li>`;
                });
                html += "</ul>";

                // Ganti seluruh konten bmi-result, bukan tambah
                document.getElementById("bmi-result").innerHTML = html;
            })
            .catch(err => {
                console.error("Error loading BMI history:", err);
                document.getElementById("bmi-result").innerHTML = this.latestBMIResult + `<p>Error loading history</p>`;
            });
    },

    deleteRecord(id) {
        fetch('/bmi', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: FeatureHandler.getCurrentUser(), id })
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(() => this.loadHistory())
            .catch(err => {
                alert('Error deleting record. Please try again.');
                console.error("Error deleting record:", err);
            });
    },

    editRecord(id) {
  document.getElementById('editModal').style.display = 'block';
  const form = document.getElementById('editBmiForm');
  form.onsubmit = (e) => {
    e.preventDefault();
    const height = parseFloat(document.getElementById('editHeight').value);
    const weight = parseFloat(document.getElementById('editWeight').value);
    if (isNaN(height) || isNaN(weight) || height < 100 || height > 250 || weight < 30 || weight > 200) {
      alert('Please enter valid height (100-250cm) and weight (30-200kg)');
      return;
    }
    fetch('/bmi', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: FeatureHandler.getCurrentUser(), id, height, weight })
    })
    .then(res => res.json())
    .then(() => {
      this.loadHistory();
      document.getElementById('editModal').style.display = 'none';
    })
    .catch(err => alert('Error updating record.'));
  };
}
});