FeatureHandler.registerFeature('bmi', {
  bmiChart: null,
  bmiData: [],
  history: [],
  currentFilter: null,

  init() {
    const form = document.getElementById('bmi-form');
    const backBtn = document.getElementById('bmiBackBtn');
    if (!form || !backBtn) {
      console.error('BMI form or back button not found');
      return;
    }
    form.addEventListener('submit', (e) => this.handleSubmit(e));
    backBtn.addEventListener('click', () => FeatureHandler.showPage('menu'));
    
    this.initSearchControls();
    this.bmiChart = null;
    this.currentFilter = null;
    this.loadHistory();
  },

  initSearchControls() {
    const searchType = document.getElementById('searchType');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const dateGroup = document.getElementById('dateSearchGroup');
    const statusGroup = document.getElementById('statusSearchGroup');

    if (!searchType || !searchBtn || !clearSearchBtn) return;

    searchType.addEventListener('change', (e) => {
      if (e.target.value === 'date') {
        dateGroup.style.display = 'block';
        statusGroup.style.display = 'none';
      } else {
        dateGroup.style.display = 'none';
        statusGroup.style.display = 'block';
      }
    });

    searchBtn.addEventListener('click', () => this.handleSearch());
    clearSearchBtn.addEventListener('click', () => this.clearSearch());
  },

  handleSearch() {
    const searchType = document.getElementById('searchType').value;
    
    if (searchType === 'date') {
      const searchDate = document.getElementById('searchDate').value;
      if (!searchDate) {
        alert('Please select a date');
        return;
      }
      this.currentFilter = {
        type: 'date',
        value: searchDate
      };
    } else if (searchType === 'status') {
      const searchStatus = document.getElementById('searchStatus').value;
      this.currentFilter = {
        type: 'status',
        value: searchStatus
      };
    }

    this.renderRecordsList();
  },

  clearSearch() {
    document.getElementById('searchDate').value = '';
    document.getElementById('searchStatus').value = '';
    this.currentFilter = null;
    this.renderRecordsList();
  },

  getFilteredHistory() {
    if (!this.currentFilter) {
      return this.history;
    }

    if (this.currentFilter.type === 'date') {
      return this.history.filter(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === this.currentFilter.value;
      });
    } else if (this.currentFilter.type === 'status') {
      if (!this.currentFilter.value) {
        return this.history;
      }
      return this.history.filter(record => 
        record.status.toLowerCase() === this.currentFilter.value.toLowerCase()
      );
    }

    return this.history;
  },

  renderRecordsList() {
    const recordsListDiv = document.getElementById('bmi-records-list');
    if (!recordsListDiv) return;

    const filteredData = this.getFilteredHistory();
    let html = '';

    if (filteredData.length === 0) {
      html = '<p style="text-align: center; color: #ca3c3cff;">No records found.</p>';
    } else {
      html += '<ul>';
      filteredData
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .forEach((r) => {
          const id = r.id || r._id || 0;
          html += `
            <li>
              <strong>${new Date(r.date).toLocaleDateString()}</strong> - 
              BMI: <b>${r.value}</b> (${r.status})
              <br>
              <small>Height: ${r.height}cm, Weight: ${r.weight}kg</small>
              <button onclick="FeatureHandler.executeFeature('bmi','editRecord',${id})">Edit</button>
              <button onclick="FeatureHandler.executeFeature('bmi','deleteRecord',${id})">Delete</button>
            </li>`;
        });
      html += '</ul>';
    }

    recordsListDiv.innerHTML = html;
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

        if (todayRecord) {
          const bmiVal = parseFloat(todayRecord.value).toFixed(1);
          const status = todayRecord.status || '';
          resultDiv.innerHTML = `
            <div class="bmi-result">
              <h3>Your BMI: ${bmiVal}</h3>
              <p class="bmi-status ${status.toLowerCase()}">${status}</p>
              <small>${new Date(todayRecord.date).toLocaleDateString()}</small>
            </div>`;
          form.style.display = 'none';
        } else {
          resultDiv.innerHTML = '';
          form.style.display = 'block';
        }
        this.renderRecordsList();
      })
      .catch((err) => {
        console.error('Error loading history', err);
        const recordsListDiv = document.getElementById('bmi-records-list');
        if (recordsListDiv) {
          recordsListDiv.innerHTML = '<p>Error loading data.</p>';
        }
      });
  },

  deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
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
          this.loadHistory();
          modal.style.display = 'none';
        })
        .catch((err) => {
          alert('Error updating record');
          console.error(err);
        });
    };
  },
});