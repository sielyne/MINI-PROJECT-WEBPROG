FeatureHandler.registerFeature('mood', {
    selectedMood: null,
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(),
    allMoodData: [],

    init() {
        document.getElementById('moodBackBtn').addEventListener('click', () => FeatureHandler.showPage('menu'));
        document.getElementById('saveJournalBtn').addEventListener('click', () => this.saveJournal());
        document.getElementById('skipJournalBtn').addEventListener('click', () => this.skipJournal());
        document.getElementById('cancelMoodBtn').addEventListener('click', () => this.cancelMood());
        document.getElementById('moodCalendarBackBtn').addEventListener('click', () => FeatureHandler.showPage('menu'));
        document.getElementById('prevMonthBtn').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonthBtn').addEventListener('click', () => this.navigateMonth(1));
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectMood(btn.dataset.mood));
        });
        this.checkTodayMoodAndJournal();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    checkTodayMoodAndJournal() {
        if (!FeatureHandler.getCurrentUser()) {
            FeatureHandler.showPage('login');
            return;
        }
        
        fetch(`/mood-history?username=${FeatureHandler.getCurrentUser()}`)
            .then(res => res.json())
            .then(data => {
                this.allMoodData = Array.isArray(data) ? data : [];
                const todayStr = new Date().toISOString().split('T')[0];
                const todayMood = this.allMoodData.find(m => m.date === todayStr);
                
                if (todayMood) {
                    // Sudah ada mood hari ini (dengan atau tanpa journal), langsung ke calendar
                    this.showStep(3);
                    this.loadMoodCalendar();
                } else {
                    // Belum pilih mood
                    this.showStep(1);
                }
            })
            .catch(() => {
                this.showStep(1);
            });
    },

    showStep(stepNumber) {
        document.getElementById('mood-step-1').classList.toggle('hidden', stepNumber !== 1);
        document.getElementById('mood-step-2').classList.toggle('hidden', stepNumber !== 2);
        document.getElementById('mood-step-3').classList.toggle('hidden', stepNumber !== 3);
    },

    selectMood(mood) {
        this.selectedMood = mood;
        if (!FeatureHandler.getCurrentUser()) {
            alert('Please log in to save mood');
            FeatureHandler.showPage('login');
            return;
        }
        
        // Langsung ke step 2 untuk menulis journal (atau skip)
        this.showStep(2);
    },

    cancelMood() {
        this.selectedMood = null;
        document.getElementById('mood-note').value = '';
        this.showStep(1);
    },

    skipJournal() {
        // Simpan mood tanpa journal (note kosong)
        this.saveJournal(true);
    },

    saveJournal(skipNote = false) {
        const note = skipNote ? '' : document.getElementById('mood-note').value.trim();
        
        if (!FeatureHandler.getCurrentUser()) {
            alert('Please log in to save journal');
            FeatureHandler.showPage('login');
            return;
        }
        
        if (!this.selectedMood) {
            alert('Please select mood first');
            return;
        }
        
        // Simpan mood dan journal (bisa kosong)
        fetch('/mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: FeatureHandler.getCurrentUser(), 
                mood: this.selectedMood, 
                note: note 
            })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                document.getElementById('mood-note').value = '';
                this.selectedMood = null;
                this.showStep(3);
                this.loadMoodCalendar();
            } else {
                alert(data.message || 'Failed to save. Please try again.');
            }
        })
        .catch(err => {
            console.error('Save journal error:', err);
            alert('Error saving journal. Please try again.');
        });
    },

    editMood(id) {
        if (!FeatureHandler.getCurrentUser()) {
            alert('Please log in to edit mood');
            FeatureHandler.showPage('login');
            return;
        }
        
        const moodData = this.allMoodData.find(m => m.id === id);
        if (!moodData) return;
        
        let newMood = prompt("New mood (happy, neutral, sad, angry, fear, disgusted):", moodData.mood);
        if (newMood === null) return;
        
        let newNote = prompt("New note (leave empty to skip):", moodData.note || '');
        if (newNote === null) return;
        
        fetch('/mood', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: FeatureHandler.getCurrentUser(), 
                id, 
                mood: newMood.trim() || moodData.mood, 
                note: newNote.trim()
            })
        })
        .then(res => {
            if (!res.ok) throw new Error('Error updating mood');
            return res.json();
        })
        .then(data => {
            if (data.success) {
                this.loadMoodCalendar();
            } else {
                alert(data.message || 'Failed to update. Please try again.');
            }
        })
        .catch(err => {
            console.error('Edit mood error:', err);
            alert('Error updating mood. Please try again.');
        });
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
                body: JSON.stringify({ 
                    username: FeatureHandler.getCurrentUser(), 
                    id 
                })
            })
            .then(res => {
                if (!res.ok) throw new Error('Error deleting mood');
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    this.loadMoodCalendar();
                } else {
                    alert(data.message || 'Failed to delete. Please try again.');
                }
            })
            .catch(err => {
                console.error('Delete mood error:', err);
                alert('Error deleting mood. Please try again.');
            });
        }
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
            
            if (mood) {
                let moodIcon = this.getMoodIcon(mood.mood);
                let moodColor = this.getMoodColor(mood.mood);
                
                calendarHTML += `
                    <div class='calendar-day has-mood' style='background:${moodColor};' data-date='${dateStr}' data-id='${mood.id}' title='Click to view'>
                        <div class='day-number'>${d}</div>
                        <div class='mood-icon'>${moodIcon}</div>
                        <div class='mood-actions hidden'>
                            <button class='edit-btn' onclick='event.stopPropagation(); FeatureHandler.executeFeature("mood", "editMood", ${mood.id})'>Edit</button>
                            <button class='delete-btn' onclick='event.stopPropagation(); FeatureHandler.executeFeature("mood", "deleteMood", ${mood.id})'>Delete</button>
                        </div>
                    </div>`;
            } else {
                calendarHTML += `
                    <div class='calendar-day empty'>
                        <div class='day-number'>${d}</div>
                    </div>`;
            }
        }
        
        document.getElementById('calendar').innerHTML = calendarHTML;
        
        if (moods.length === 0) {
            document.getElementById('calendar').innerHTML += '<div class="no-moods-msg">No moods recorded this month</div>';
        }

        document.querySelectorAll('.calendar-day.has-mood').forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const dateStr = dayEl.dataset.date;
                const actionsDiv = dayEl.querySelector('.mood-actions');
                
                document.querySelectorAll('.calendar-day .mood-actions').forEach(el => {
                    if (el !== actionsDiv) {
                        el.classList.add('hidden');
                    }
                });
                
                if (actionsDiv.classList.contains('hidden')) {
                    actionsDiv.classList.remove('hidden');
                    this.showMoodNote(dateStr);
                } else {
                    actionsDiv.classList.add('hidden');
                }
            });
        });
    },

    renderMoodStatsMonth(year, month) {
        const moods = this.allMoodData.filter(m => {
            const d = new Date(m.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
        
        let counts = { happy: 0, neutral: 0, sad: 0, angry: 0, fear: 0, disgusted: 0 };
        moods.forEach(m => {
            if (counts.hasOwnProperty(m.mood)) {
                counts[m.mood]++;
            }
        });

        let statsHTML = `
            <div class='mood-count-title'>
                <h3>Mood Count This Month</h3>
                <div class='mood-count-list'>
                    <span>😊 Happy: <b>${counts.happy}</b></span>
                    <span>😐 Neutral: <b>${counts.neutral}</b></span>
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
            ? `<div class='today-mood-title'>
                   <h3>Today's Mood</h3>
                   <div class='today-mood-detail'>
                       <span class='today-icon'>${this.getMoodIcon(todayMood.mood)}</span> 
                       <span class='today-mood-name'>${todayMood.mood}</span>
                       <p class='today-note'>${todayMood.note || 'No journal entry'}</p>
                   </div>
               </div>`
            : `<div class='today-mood-title'>
                   <h3>Today's Mood</h3>
                   <p class='no-mood-today'>No mood recorded today</p>
               </div>`;
        document.getElementById('today-mood').innerHTML = todayHTML;
    },

    getMoodIcon(mood) {
        const icons = {
            happy: '😊',
            neutral: '😐',
            sad: '😢',
            angry: '😡',
            fear: '😨',
            disgusted: '🤢'
        };
        return icons[mood] || '';
    },

    getMoodColor(mood) {
        const colors = {
            happy: '#34d399',
            neutral: '#dbcffb',
            sad: '#bfdbfe',
            angry: '#fecaca',
            fear: '#fef3c7',
            disgusted: '#fbcfe8'
        };
        return colors[mood] || '#fff';
    },

    showMoodNote(dateStr) {
        const mood = this.allMoodData.find(m => m.date === dateStr);
        if (mood) {
            const noteText = mood.note ? `\n\nNote: ${mood.note}` : '\n\nNo journal entry';
            alert(`Mood on ${dateStr}:\n\n${this.getMoodIcon(mood.mood)} ${mood.mood}${noteText}`);
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