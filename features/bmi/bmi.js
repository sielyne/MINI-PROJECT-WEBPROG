FeatureHandler.registerFeature('bmi', {
  bmiChart: null,
  bmiData: [],
  history: [],
  latestBMIResult: '',

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

  isSameDate(a, b) {
    const da = new Date(a);
    const db = new Date(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  },

  handleSubmit(e) {
    e.preventDefault();
    if (!FeatureHandler.getCurrentUser()) {
      alert('Please login first!');
      return;
    }

    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);

    if (
      isNaN(height) ||
      isNaN(weight) ||
      height < 100 ||
      height > 250 ||
      weight < 30 ||
      weight > 200
    ) {
      alert('Please enter valid height (100–250 cm) and weight (30–200 kg)');
      return;
    }

    const data = new URLSearchParams();
    data.append('username', FeatureHandler.getCurrentUser());
    data.append('height', height);
    data.append('weight', weight);

    fetch('/bmi', { method: 'POST', body: data })
      .then((r) => r.json())
      .then(() => this.loadHistory())
      .catch((err) => {
        alert('Network error, please try again.');
        console.error(err);
      });
  },

  updateBMIChart() {
    const canvas = document.getElementById('bmiChart');
    if (!canvas) return;
    if (typeof Chart === 'undefined') return;

    this.bmiData.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!this.bmiChart) {
      this.bmiChart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: this.bmiData.map((d) => d.date),
          datasets: [
            {
              label: 'BMI Progress',
              data: this.bmiData.map((d) => d.value),
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99,102,241,0.15)',
              borderWidth: 2,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: false, min: 15, max: 35 },
          },
        },
      });
    } else {
      this.bmiChart.data.labels = this.bmiData.map((d) => d.date);
      this.bmiChart.data.datasets[0].data = this.bmiData.map((d) => d.value);
      this.bmiChart.update();
    }
  },

  loadHistory() {
    if (!FeatureHandler.getCurrentUser()) return;

    fetch(`/bmi-history?username=${FeatureHandler.getCurrentUser()}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error('Invalid history format', data);
          return;
        }

        this.history = data;
        this.bmiData = data.map((r) => ({
          date: r.date,
          value: parseFloat(r.value),
        }));
        this.updateBMIChart();

        const today = new Date();
        const todayRecord = data.find((r) => this.isSameDate(r.date, today));

        const form = document.getElementById('bmi-form');
        const resultDiv = document.getElementById('bmi-result');
        let html = '';

        // === Your BMI section ===
        if (todayRecord) {
          const bmiVal = parseFloat(todayRecord.value).toFixed(1);
          const status = todayRecord.status || '';
          this.latestBMIResult = `
            <div class="bmi-result">
              <h3>Your BMI: ${bmiVal}</h3>
              <p class="bmi-status ${status.toLowerCase()}">${status}</p>
              <small>${new Date(todayRecord.date).toLocaleDateString()}</small>
            </div>`;
          form.style.display = 'none'; // hide input form
        } else {
          this.latestBMIResult = '';
          form.style.display = 'block';
        }
        html += this.latestBMIResult;

        // === History list ===
        html += '<h3>BMI History</h3>';
        if (data.length === 0) {
          html += '<p>No BMI records yet.</p>';
        } else {
          html += '<ul>';
          data
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach((r) => {
              const id = r.id || r._id || 0;
              html += `
                <li>
                  ${new Date(r.date).toLocaleDateString()} - 
                  <b>${r.value}</b> (${r.status})
                  <button onclick="FeatureHandler.executeFeature('bmi','editRecord',${id})">Edit</button>
                  <button onclick="FeatureHandler.executeFeature('bmi','deleteRecord',${id})">Delete</button>
                </li>`;
            });
          html += '</ul>';
        }

        resultDiv.innerHTML = html;
      })
      .catch((err) => {
        console.error('Error loading history', err);
        document.getElementById('bmi-result').innerHTML =
          '<p>Error loading data.</p>';
      });
  },

  deleteRecord(id) {
    fetch('/bmi', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: FeatureHandler.getCurrentUser(),
        id,
      }),
    })
      .then((r) => r.json())
      .then(() => this.loadHistory())
      .catch((err) => {
        alert('Error deleting record');
        console.error(err);
      });
  },

  editRecord(id) {
    const modal = document.getElementById('editModal');
    modal.style.display = 'block';

    const record = this.history.find((r) => r.id === id || r._id === id);
    const editHeight = document.getElementById('editHeight');
    const editWeight = document.getElementById('editWeight');
    if (record) {
      editHeight.value = record.height || '';
      editWeight.value = record.weight || '';
    }

    const form = document.getElementById('editBmiForm');
    form.onsubmit = (e) => {
      e.preventDefault();
      const height = parseFloat(editHeight.value);
      const weight = parseFloat(editWeight.value);
      if (
        isNaN(height) ||
        isNaN(weight) ||
        height < 100 ||
        height > 250 ||
        weight < 30 ||
        weight > 200
      ) {
        alert('Please enter valid height (100–250 cm) and weight (30–200 kg)');
        return;
      }

      fetch('/bmi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: FeatureHandler.getCurrentUser(),
          id,
          height,
          weight,
        }),
      })
        .then((r) => r.json())
        .then(() => {
          this.loadHistory(); // refresh "Your BMI" + history
          modal.style.display = 'none';
        })
        .catch((err) => {
          alert('Error updating record');
          console.error(err);
        });
    };
  },
});
