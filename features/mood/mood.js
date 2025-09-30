FeatureHandler.registerFeature('mood', {
    selectedMood: null,
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(),
    allMoodData: [],

    init() {
        document.getElementById('moodBackBtn').addEventListener('click', () => FeatureHandler.showPage('menu'));
        document.getElementById('saveJournalBtn').addEventListener('click', () => this.saveJournal());
        document.getElementById('cancelMoodBtn').addEventListener('click', () => this.cancelMood());
        document.getElementById('moodCalendarBackBtn').addEventListener('click', () => FeatureHandler.showPage('menu'));
        document.getElementById('prevMonthBtn').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonthBtn').addEventListener('click', () => this.navigateMonth(1));
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectMood(btn.dataset.mood));
        });
        this.checkTodayMoodAndJournal();
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
                
                if (todayMood && todayMood.note) {
                    // Sudah isi mood & journal, langsung ke calendar
                    this.showStep(3);
                    this.loadMoodCalendar();
                } else if (todayMood && !todayMood.note) {
                    // Sudah pilih mood, belum isi journal
                    this.showStep(2);
                    this.selectedMood = todayMood.mood;
                } else {
                    // Belum pilih mood
                    this.showStep(1);
                }
            })
            .catch(() => {
                // Default ke step 1 jika gagal ambil data
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
        
        // Simpan mood tanpa journal
        fetch('/mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: FeatureHandler.getCurrentUser(), 
                mood: this.selectedMood, 
                note: '' 
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                this.showStep(2);
            }
        })
        .catch(err => {
            console.error('Save mood error:', err);
            alert('Error saving mood. Please try again.');
        });
    },

    cancelMood() {
        this.selectedMood = null;
        document.getElementById('mood-note').value = '';
        this.showStep(1);
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
        if (newMood === null) return; // User cancelled
        
        let newNote = prompt("New note:", moodData.note);
        if (newNote === null) return; // User cancelled
        
        if (newMood && newNote) {
            fetch('/mood', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: FeatureHandler.getCurrentUser(), 
                    id, 
                    mood: newMood, 
                    note: newNote 
                })
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
                }
            })
            .catch(err => {
                console.error('Delete mood error:', err);
                alert('Error deleting mood. Please try again.');
            });
        }
    },

    saveJournal() {
        const note = document.getElementById('mood-note').value.trim();
        
        if (!FeatureHandler.getCurrentUser()) {
            alert('Please log in to save journal');
            FeatureHandler.showPage('login');
            return;
        }
        
        if (!this.selectedMood) {
            alert('Please select mood first');
            return;
        }
        
        if (!note) {
            alert('Please write your journal');
            return;
        }
        
        // Update mood hari ini dengan journal (menggunakan PUT untuk update)
        const todayStr = new Date().toISOString().split('T')[0];
        const todayMood = this.allMoodData.find(m => m.date === todayStr);
        
        if (todayMood && todayMood.id) {
            // Update existing mood dengan journal
            fetch('/mood', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: FeatureHandler.getCurrentUser(),
                    id: todayMood.id,
                    mood: this.selectedMood, 
                    note 
                })
            })
            .then(res => {
                if (!res.ok) throw new Error('Error updating journal');
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    document.getElementById('mood-note').value = '';
                    this.showStep(3);
                    this.loadMoodCalendar();
                } else {
                    alert('Failed to save journal. Please try again.');
                }
            })
            .catch(err => {
                console.error('Save journal error:', err);
                alert('Error saving journal. Please try again.');
            });
        } else {
            // Jika belum ada mood (fallback), create new
            fetch('/mood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: FeatureHandler.getCurrentUser(), 
                    mood: this.selectedMood, 
                    note 
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('mood-note').value = '';
                    this.showStep(3);
                    this.loadMoodCalendar();
                } else {
                    alert('Failed to save journal. Please try again.');
                }
            })
            .catch(err => {
                console.error('Save journal error:', err);
                alert('Error saving journal. Please try again.');
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
        
        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += `<div class='calendar-day empty'></div>`;
        }
        
        // Days of the month
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

        // Add click handlers to toggle mood actions
        document.querySelectorAll('.calendar-day.has-mood').forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const dateStr = dayEl.dataset.date;
                const actionsDiv = dayEl.querySelector('.mood-actions');
                
                // Close all other open actions first
                document.querySelectorAll('.calendar-day .mood-actions').forEach(el => {
                    if (el !== actionsDiv) {
                        el.classList.add('hidden');
                    }
                });
                
                // Toggle current actions
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
                       <p class='today-note'>${todayMood.note}</p>
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
            alert(`Mood on ${dateStr}:\n\n${this.getMoodIcon(mood.mood)} ${mood.mood}\n\nNote: ${mood.note}`);
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