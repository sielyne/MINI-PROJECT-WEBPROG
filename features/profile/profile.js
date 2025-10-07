FeatureHandler.registerFeature('profile', {
  init() {
    const username = FeatureHandler.getCurrentUser();
    if (!username) {
      FeatureHandler.showPage('login');
      return;
    }

    document.getElementById('profile-username').textContent = username;

    this.loadBMI(username);
    this.loadMood(username);
    this.loadQuiz(username);

    // Settings modal logic
    const settingsBtn = document.getElementById('profile-settings-btn');
    const settingsModal = document.getElementById('profile-settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    if (settingsBtn && settingsModal) {
      settingsBtn.onclick = () => {
        settingsModal.style.display = 'flex';
      };
    }
    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.onclick = () => {
        settingsModal.style.display = 'none';
      };
    }

    // Download PDF button event
    const printBtn = document.getElementById('print-history-btn');
    if (printBtn) {
      printBtn.onclick = () => {
        // ...existing code for download history...
        const username = document.getElementById('profile-username').textContent;
        const bmiList = Array.from(document.querySelectorAll('#profile-bmi-list li')).map(li => li.textContent).join('\n');
        const moodList = Array.from(document.querySelectorAll('#profile-mood-list li')).map(li => li.textContent).join('\n');
        const quizList = Array.from(document.querySelectorAll('#profile-quiz-list li')).map(li => li.textContent).join('\n');
        const text = `User: ${username}\n\nBMI History:\n${bmiList}\n\nMood History:\n${moodList}\n\nBody Shape Quiz Results:\n${quizList}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bloomii-history-${username}.txt`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      };
    }

    // Edit profile form
    const editForm = document.getElementById('edit-profile-form');
    if (editForm) {
      editForm.onsubmit = async (e) => {
        e.preventDefault();
        const oldUsername = FeatureHandler.getCurrentUser();
        const newUsername = document.getElementById('edit-username').value.trim();
        const newPassword = document.getElementById('edit-password').value;
        if (!newUsername) {
          alert('Username cannot be empty!');
          return;
        }
        try {
          const res = await fetch('/user-update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldUsername, newUsername, newPassword })
          });
          const data = await res.json();
          if (data.success) {
            // Update username di localStorage/session dan FeatureHandler
            localStorage.setItem('bloomii-username', newUsername);
            FeatureHandler.setCurrentUser(newUsername);
            document.getElementById('profile-username').textContent = newUsername;
            // Reload all data for new username (refresh grafik, dsb)
            this.loadBMI(newUsername);
            this.loadMood(newUsername);
            this.loadQuiz(newUsername);
            alert('Profile updated!');
            document.getElementById('profile-settings-modal').style.display = 'none';
            // Reset form
            editForm.reset();
          } else {
            alert(data.error || 'Failed to update profile');
          }
        } catch (err) {
          alert('Server error. Please try again.');
        }
      };
      const delBtn = document.getElementById('delete-account-btn');
      if (delBtn) {
        delBtn.onclick = async () => {
          if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
              const username = FeatureHandler.getCurrentUser();
              const res = await fetch('/user-delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
              });
              const data = await res.json();
              if (data.success) {
                alert('Account deleted.');
                localStorage.removeItem('bloomii-username');
                FeatureHandler.showPage('login');
              } else {
                alert(data.error || 'Failed to delete account');
              }
            } catch (err) {
              alert('Server error. Please try again.');
            }
          }
        };
      }
    }
  },

  loadBMI(username) {
    fetch(`/bmi-history?username=${username}`)
      .then(res => res.json())
      .then(data => {
        const list = document.getElementById('profile-bmi-list');
        list.innerHTML = '';
        data.slice(-5).reverse().forEach(item => {
          list.innerHTML += `<li>${item.date}: ${item.value} (${item.status})</li>`;
        });
      });
  },

  loadMood(username) {
    fetch(`/mood-history?username=${username}`)
      .then(res => res.json())
      .then(data => {
        const list = document.getElementById('profile-mood-list');
        list.innerHTML = '';
        data.slice(-5).reverse().forEach(item => {
          list.innerHTML += `<li>${item.date}: ${item.mood} — ${item.note}</li>`;
        });
      });
  },

  loadQuiz(username) {
    fetch(`/quiz-history?username=${username}`)
      .then(res => res.json())
      .then(data => {
        const list = document.getElementById('profile-quiz-list');
        list.innerHTML = '';
        data.slice(-3).reverse().forEach(item => {
          list.innerHTML += `<li>${item.date}: ${item.result}</li>`;
        });
      });
  }
});
