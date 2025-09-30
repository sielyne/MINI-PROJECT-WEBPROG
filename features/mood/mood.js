FeatureHandler.registerFeature('mood', {
    selectedMood: null,
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(),
    allMoodData: [],

    init() {
        document.getElementById('moodBackBtn').addEventListener('click', () => FeatureHandler.showPage('menu'));
        document.getElementById('saveMoodBtn').addEventListener('click', () => this.saveMood());
        document.getElementById('cancelMoodBtn').addEventListener('click', () => this.cancelMood());
        document.getElementById('moodCalendarBackBtn').addEventListener('click', () => FeatureHandler.showPage('menu'));
        document.getElementById('prevMonthBtn').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonthBtn').addEventListener('click', () => this.navigateMonth(1));
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectMood(btn.dataset.mood));
        });
        this.loadMoodCalendar();
    },

    selectMood(mood) {
        this.selectedMood = mood;
        document.getElementById('mood-step-1').classList.add('hidden');
        document.getElementById('mood-step-2').classList.remove('hidden');
    },

    cancelMood() {
        this.selectedMood = null;
        document.getElementById('mood-step-2').classList.add('hidden');
        document.getElementById('mood-step-1').classList.remove('hidden');
    },

    editMood(id) {
    if (!FeatureHandler.getCurrentUser()) {
        alert('Please log in to edit mood');
        FeatureHandler.showPage('login');
        return;
    }
    let newMood = prompt("New mood (happy, neutral, sad, angry, fear, disgusted):");
    let newNote = prompt("New note:");
    if (newMood && newNote) {
        fetch('/mood', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: FeatureHandler.getCurrentUser(), id, mood: newMood, note: newNote })
        })
            .then(res => {
                if (!res.ok) throw new Error('Error updating mood');
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    this.loadMoodCalendar();
                }
            })
            .catch(err => {
                console.error('Edit mood error:', err);
                alert('Error updating mood. Please try again.');
            });
    }
},
deleteMood(id) {
    if (!FeatureHandler.getCurrentUser()) {
        alert('Please log in to delete mood');
        FeatureHandler.showPage('login');
        return;
    }
    if (confirm('Delete this mood?')) {
        fetch('/mood', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: FeatureHandler.getCurrentUser(), id })
        })
            .then(res => {
                if (!res.ok) throw new Error('Error deleting mood');
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    this.loadMoodCalendar();
                }
            })
            .catch(err => {
                console.error('Delete mood error:', err);
                alert('Error deleting mood. Please try again.');
            });
    }
},

    saveMood() {
    const note = document.getElementById('mood-note').value;
    if (!FeatureHandler.getCurrentUser()) {
        alert('Please log in to save mood');
        FeatureHandler.showPage('login');
        return;
    }
    if (!this.selectedMood || !note) {
        alert('Please select mood and write notes');
        return;
    }

    fetch('/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: FeatureHandler.getCurrentUser(), mood: this.selectedMood, note })
    })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw err; });
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                document.getElementById('mood-step-2').classList.add('hidden');
                document.getElementById('mood-step-3').classList.remove('hidden');
                this.loadMoodCalendar();
            }
        })
        .catch(err => {
            console.error('Save mood error:', err);
            alert(err.error || 'Error saving mood. Please try again.');
        });
},

    loadMoodCalendar() {
    if (!FeatureHandler.getCurrentUser()) {
        alert('Please log in to view calendar');
        FeatureHandler.showPage('login');
        return;
    }
    fetch(`/mood-history?username=${FeatureHandler.getCurrentUser()}`)
        .then(res => {
            if (!res.ok) throw new Error('Error loading mood history');
            return res.json();
        })
        .then(data => {
            this.allMoodData = Array.isArray(data) ? data : [];
            this.renderCalendarMonth(this.calendarYear, this.calendarMonth);
            this.renderMoodStatsMonth(this.calendarYear, this.calendarMonth);
        })
        .catch(err => {
            console.error('Load mood error:', err);
            alert('Error loading calendar. Please try again.');
            this.allMoodData = [];
            this.renderCalendarMonth(this.calendarYear, this.calendarMonth);
        });
},

    renderCalendarMonth(year, month) {
    // Hapus validasi ketat, pakai fallback array kosong
    this.allMoodData = Array.isArray(this.allMoodData) ? this.allMoodData : [];
    const moods = this.allMoodData.filter(m => {
        const d = new Date(m.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarMonthLabel').textContent = `${monthNames[month]} ${year}`;

    let calendarHTML = '';
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<div class='calendar-day empty'></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
        let dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        let mood = moods.find(m => m.date === dateStr);
        let moodIcon = '';
        let moodColor = '';
        if (mood) {
            switch (mood.mood) {
                case 'happy': moodIcon = '😊'; moodColor = '#34d399'; break; // Warna lebih kontras
                case 'neutral': moodIcon = '😐'; moodColor = '#dbcffb'; break;
                case 'sad': moodIcon = '😢'; moodColor = '#bfdbfe'; break;
                case 'angry': moodIcon = '😡'; moodColor = '#fecaca'; break;
                case 'fear': moodIcon = '😨'; moodColor = '#fef3c7'; break;
                case 'disgusted': moodIcon = '🤢'; moodColor = '#fbcfe8'; break;
            }
            calendarHTML += `<div class='calendar-day' style='background:${moodColor};cursor:pointer;' title='${mood.note}' onclick='FeatureHandler.executeFeature("mood", "showMoodNote", "${dateStr}")'>
                <div style='font-size:1.2em;'>${d}</div>
                <div>${moodIcon}</div>
                <button onclick='FeatureHandler.executeFeature("mood", "editMood", ${mood.id})'>Edit</button>
                <button onclick='FeatureHandler.executeFeature("mood", "deleteMood", ${mood.id})'>Delete</button>
            </div>`;
        } else {
            calendarHTML += `<div class='calendar-day' style='background:${moodColor};cursor:pointer;' title='' onclick='FeatureHandler.executeFeature("mood", "showMoodNote", "${dateStr}")'>
                <div style='font-size:1.2em;'>${d}</div>
                <div>${moodIcon}</div>
            </div>`;
        }
    }
    document.getElementById('calendar').innerHTML = calendarHTML;
    if (moods.length === 0) {
        document.getElementById('calendar').innerHTML += '<p>No moods recorded this month</p>';
    }
},

    renderMoodStatsMonth(year, month) {
        const moods = this.allMoodData.filter(m => {
            const d = new Date(m.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
        let counts = { happy: 0, sad: 0, angry: 0, fear: 0, disgusted: 0 };
        moods.forEach(m => counts[m.mood]++);

        let statsHTML = `<div class='mood-count-title'>
            <h3>Mood Count This Month</h3>
            <div class='mood-count-list'>
                <span>😊 Happy: <b>${counts.happy}</b></span>
                <span>😐 Neutral: <b>${counts.neutral || 0}</b></span>
                <span>😢 Sad: <b>${counts.sad}</b></span>
                <span>😡 Angry: <b>${counts.angry}</b></span>
                <span>😨 Fear: <b>${counts.fear}</b></span>
                <span>🤢 Disgusted: <b>${counts.disgusted}</b></span>
            </div>
        </div>`;
        document.getElementById('mood-count').innerHTML = statsHTML;

        let todayStr = new Date().toISOString().split('T')[0];
        let todayMood = moods.find(m => m.date === todayStr);
        let todayHTML = todayMood
            ? `<div class='today-mood-title'><h3>Today's Mood</h3><div class='today-mood-detail'><span style='font-size:1.5em;'>${this.getMoodIcon(todayMood.mood)}</span> <span style='font-weight:bold;'>${todayMood.mood}</span><br><span style='color:#555;'>${todayMood.note}</span></div></div>`
            : `<div class='today-mood-title'><h3>Today's Mood</h3><p>No mood recorded today</p></div>`;
        document.getElementById('today-mood').innerHTML = todayHTML;
    },

    getMoodIcon(mood) {
        switch (mood) {
            case 'happy': return '😊';
            case 'neutral': return '😐';
            case 'sad': return '😢';
            case 'angry': return '😡';
            case 'fear': return '😨';
            case 'disgusted': return '🤢';
            default: return '';
        }
    },

    showMoodNote(dateStr) {
        const mood = this.allMoodData.find(m => m.date === dateStr);
        if (mood) {
            alert(`Mood on ${dateStr}: ${this.getMoodIcon(mood.mood)}\n${mood.mood}\nNote: ${mood.note}`);
        }
    },

    navigateMonth(direction) {
        this.calendarMonth += direction;
        if (this.calendarMonth < 0) {
            this.calendarMonth = 11;
            this.calendarYear--;
        } else if (this.calendarMonth > 11) {
            this.calendarMonth = 0;
            this.calendarYear++;
        }
        this.renderCalendarMonth(this.calendarYear, this.calendarMonth);
        this.renderMoodStatsMonth(this.calendarYear, this.calendarMonth);
    }
});