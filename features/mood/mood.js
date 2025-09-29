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

    saveMood() {
        const note = document.getElementById('mood-note').value;
        if (!this.selectedMood || !note) return alert('Please select mood and write notes');

        fetch('/mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: FeatureHandler.getCurrentUser(), mood: this.selectedMood, note })
        })
            .then(res => res.json())
            .then(() => {
                document.getElementById('mood-step-2').classList.add('hidden');
                document.getElementById('mood-step-3').classList.remove('hidden');
                this.loadMoodCalendar();
            });
    },

    loadMoodCalendar() {
        fetch(`/mood-history?username=${FeatureHandler.getCurrentUser()}`)
            .then(res => res.json())
            .then(data => {
                this.allMoodData = data;
                this.renderCalendarMonth(this.calendarYear, this.calendarMonth);
                this.renderMoodStatsMonth(this.calendarYear, this.calendarMonth);
            });
    },

    renderCalendarMonth(year, month) {
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
                    case 'happy': moodIcon = '😊'; moodColor = '#dcfce7'; break;
                    case 'neutral': moodIcon = '😐'; moodColor = '#dbcffbff'; break;
                    case 'sad': moodIcon = '😢'; moodColor = '#bfdbfe'; break;
                    case 'angry': moodIcon = '😡'; moodColor = '#fecaca'; break;
                    case 'fear': moodIcon = '😨'; moodColor = '#fef3c7'; break;
                    case 'disgusted': moodIcon = '🤢'; moodColor = '#fbcfe8'; break;
                }
            }
            calendarHTML += `<div class='calendar-day' style='background:${moodColor};cursor:pointer;' title='${mood ? mood.note : ''}' onclick='FeatureHandler.executeFeature("mood", "showMoodNote", "${dateStr}")'>
                <div style='font-size:1.2em;'>${d}</div>
                <div>${moodIcon}</div>
            </div>`;
        }
        document.getElementById('calendar').innerHTML = calendarHTML;
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