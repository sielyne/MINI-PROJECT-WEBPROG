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
        // Clear form when opening
        document.getElementById('edit-profile-form').reset();
      };
    }
    
    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.onclick = () => {
        settingsModal.style.display = 'none';
        document.getElementById('edit-profile-form').reset();
      };
    }

    // View Report button
    const viewReportBtn = document.getElementById('view-report-btn');
    if (viewReportBtn) {
      viewReportBtn.onclick = () => {
        this.showReport(username);
      };
    }

    // Download PDF button event
    const printBtn = document.getElementById('print-history-btn');
    if (printBtn) {
      printBtn.onclick = async () => {
        await this.downloadSimplePDF(username);
      };
    }

    // Edit profile form (UPDATED WITH PASSWORD VERIFICATION)
    const editForm = document.getElementById('edit-profile-form');
    if (editForm) {
      editForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const oldUsername = FeatureHandler.getCurrentUser();
        const currentPassword = document.getElementById('current-password').value;
        const newUsername = document.getElementById('edit-username').value.trim();
        const newPassword = document.getElementById('edit-password').value;
        
        // Validate current password is provided
        if (!currentPassword) {
          alert('Current password is required to make changes!');
          return;
        }
        
        // Check if any changes were made
        if (!newUsername && !newPassword) {
          alert('Please enter a new username or password to update.');
          return;
        }
        
        // Validate new username if provided
        if (newUsername && newUsername === oldUsername) {
          alert('New username is the same as current username.');
          return;
        }
        
        try {
          // First verify current password
          const verifyRes = await fetch('/user-verify-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              username: oldUsername, 
              password: currentPassword 
            })
          });
          
          const verifyData = await verifyRes.json();
          
          if (!verifyData.success) {
            alert('Current password is incorrect!');
            document.getElementById('current-password').focus();
            return;
          }
          
          // If verification passed, proceed with update
          const res = await fetch('/user-update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              oldUsername, 
              newUsername: newUsername || oldUsername, 
              newPassword: newPassword || null,
              currentPassword // Send current password for double verification
            })
          });
          
          const data = await res.json();
          
          if (data.success) {
            // Update username in localStorage/session and FeatureHandler
            const finalUsername = newUsername || oldUsername;
            localStorage.setItem('bloomii-username', finalUsername);
            FeatureHandler.setCurrentUser(finalUsername);
            document.getElementById('profile-username').textContent = finalUsername;
            
            // Reload all data for new username
            this.loadBMI(finalUsername);
            this.loadMood(finalUsername);
            this.loadQuiz(finalUsername);
            
            alert('Profile updated successfully!');
            document.getElementById('profile-settings-modal').style.display = 'none';
            editForm.reset();
          } else {
            alert('❌ ' + (data.error || 'Failed to update profile'));
          }
        } catch (err) {
          console.error('Update error:', err);
          alert('❌ Server error. Please try again.');
        }
      };
      
      // Delete account button (UPDATED WITH PASSWORD VERIFICATION)
      const delBtn = document.getElementById('delete-account-btn');
      if (delBtn) {
        delBtn.onclick = async () => {
          const currentPassword = document.getElementById('current-password').value;
          
          // Validate current password is provided
          if (!currentPassword) {
            alert('⚠️ Please enter your current password first!');
            document.getElementById('current-password').focus();
            return;
          }
          
          if (confirm('⚠️ Are you ABSOLUTELY SURE you want to delete your account?\n\nThis action CANNOT be undone!\n\nAll your data will be permanently deleted.')) {
            try {
              const username = FeatureHandler.getCurrentUser();
              
              // Verify password before deletion
              const verifyRes = await fetch('/user-verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  username, 
                  password: currentPassword 
                })
              });
              
              const verifyData = await verifyRes.json();
              
              if (!verifyData.success) {
                alert('❌ Current password is incorrect! Account deletion cancelled.');
                return;
              }
              
              // If verified, proceed with deletion
              const res = await fetch('/user-delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  username,
                  password: currentPassword 
                })
              });
              
              const data = await res.json();
              
              if (data.success) {
                alert('✅ Account deleted successfully.');
                localStorage.removeItem('bloomii-username');
                FeatureHandler.showPage('login');
              } else {
                alert('❌ ' + (data.error || 'Failed to delete account'));
              }
            } catch (err) {
              console.error('Delete error:', err);
              alert('❌ Server error. Please try again.');
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

      // Urutkan data berdasarkan ID (descending)
      data.sort((a, b) => b.id - a.id);

      // Ambil hanya 3 data terbaru
      const latest = data.slice(0, 3);

      // Tampilkan dari yang terbaru ke yang lama
      latest.forEach(item => {
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

      // Urutkan data berdasarkan ID terbaru
      data.sort((a, b) => b.id - a.id);

      // Ambil hanya 3 data terbaru
      const latest = data.slice(0, 3);

      latest.forEach(item => {
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

      // Urutkan berdasarkan ID terbaru
      data.sort((a, b) => b.id - a.id);

      // Ambil 3 hasil kuis terbaru
      const latest = data.slice(0, 3);

      latest.forEach(item => {
        list.innerHTML += `<li>${item.date}: ${item.result}</li>`;
      });
    });
},

  // NEW: Simple PDF Download from Profile Page
  async downloadSimplePDF(username) {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Fetch all data
      const bmiRes = await fetch(`/bmi-history?username=${username}`);
      const bmiData = await bmiRes.json();
      const moodRes = await fetch(`/mood-history?username=${username}`);
      const moodData = await moodRes.json();
      const quizRes = await fetch(`/quiz-history?username=${username}`);
      const quizData = await quizRes.json();
      
      let yPos = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const maxWidth = 170;
      
      // Helper function to check if new page is needed
      const checkPageBreak = (neededSpace) => {
        if (yPos + neededSpace > pageHeight - margin) {
          doc.addPage();
          yPos = 20;
        }
      };
      
      // Title
      doc.setFontSize(22);
      doc.setTextColor(102, 126, 234);
      doc.text('BLOOMII HEALTH REPORT', 105, yPos, { align: 'center' });
      yPos += 15;
      
      // User info
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`User: ${username}`, 20, yPos);
      yPos += 7;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
      yPos += 15;
      
      // BMI History Section
      checkPageBreak(30);
      doc.setFontSize(16);
      doc.setTextColor(102, 126, 234);
      doc.text(`BMI HISTORY (${bmiData.length} records)`, 20, yPos);
      yPos += 3;
      doc.setDrawColor(102, 126, 234);
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      if (bmiData.length === 0) {
        doc.text('No BMI records found.', 20, yPos);
        yPos += 10;
      } else {
        bmiData.slice(-10).reverse().forEach((item, index) => {
          checkPageBreak(20);
          doc.setFont(undefined, 'bold');
          doc.text(`${index + 1}. ${item.date}`, 20, yPos);
          yPos += 5;
          doc.setFont(undefined, 'normal');
          doc.text(`   BMI: ${item.value} | Status: ${item.status}`, 20, yPos);
          yPos += 8;
        });
      }
      yPos += 5;
      
      // Mood History Section
      checkPageBreak(30);
      doc.setFontSize(16);
      doc.setTextColor(102, 126, 234);
      doc.text(`MOOD TRACKER HISTORY (${moodData.length} records)`, 20, yPos);
      yPos += 3;
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      if (moodData.length === 0) {
        doc.text('No mood records found.', 20, yPos);
        yPos += 10;
      } else {
        moodData.slice(-10).reverse().forEach((item, index) => {
          checkPageBreak(25);
          doc.setFont(undefined, 'bold');
          doc.text(`${index + 1}. ${item.date}`, 20, yPos);
          yPos += 5;
          doc.setFont(undefined, 'normal');
          doc.text(`   Mood: ${item.mood}`, 20, yPos);
          yPos += 5;
          const noteText = `   Note: ${item.note || 'No note'}`;
          const splitNote = doc.splitTextToSize(noteText, maxWidth);
          doc.text(splitNote, 20, yPos);
          yPos += (splitNote.length * 5) + 3;
        });
      }
      yPos += 5;
      
      // Quiz History Section
      checkPageBreak(30);
      doc.setFontSize(16);
      doc.setTextColor(102, 126, 234);
      doc.text(`BODY SHAPE QUIZ RESULTS (${quizData.length} records)`, 20, yPos);
      yPos += 3;
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      if (quizData.length === 0) {
        doc.text('No quiz results found.', 20, yPos);
        yPos += 10;
      } else {
        quizData.slice(-10).reverse().forEach((item, index) => {
          checkPageBreak(20);
          doc.setFont(undefined, 'bold');
          doc.text(`${index + 1}. ${item.date}`, 20, yPos);
          yPos += 5;
          doc.setFont(undefined, 'normal');
          doc.text(`   Result: ${item.result}`, 20, yPos);
          yPos += 8;
        });
      }
      
      // Footer on last page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 105, pageHeight - 10, { align: 'center' });
      }
      
      // Save PDF
      doc.save(`bloomii-history-${username}-${Date.now()}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  },

  // Show Report Function
  async showReport(username) {
    document.getElementById('profile').style.display = 'none';
    document.getElementById('report').style.display = 'block';
    
    document.getElementById('report-username').textContent = username;
    document.getElementById('report-date').textContent = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    await this.loadReportData(username);
    this.setupReportButtons(username);
  },

  async loadReportData(username) {
    try {
      // Load BMI History
      const bmiRes = await fetch(`/bmi-history?username=${username}`);
      const bmiData = await bmiRes.json();
      const bmiList = document.getElementById('report-bmi-list');
      bmiList.innerHTML = '';
      document.getElementById('bmi-count').textContent = `${bmiData.length} records`;
      
      if (bmiData.length === 0) {
        bmiList.innerHTML = '<li style="text-align:center; color:#999;">No BMI records found</li>';
      } else {
        bmiData.reverse().forEach(item => {
          bmiList.innerHTML += `<li><strong>${item.date}</strong><br>BMI: ${item.value} — Status: <strong>${item.status}</strong></li>`;
        });
      }
      
      // Load Mood History
      const moodRes = await fetch(`/mood-history?username=${username}`);
      const moodData = await moodRes.json();
      const moodList = document.getElementById('report-mood-list');
      moodList.innerHTML = '';
      document.getElementById('mood-count').textContent = `${moodData.length} records`;
      
      if (moodData.length === 0) {
        moodList.innerHTML = '<li style="text-align:center; color:#999;">No mood records found</li>';
      } else {
        moodData.reverse().forEach(item => {
          moodList.innerHTML += `<li><strong>${item.date}</strong><br>Mood: ${item.mood}<br>Note: ${item.note || 'No note'}</li>`;
        });
      }
      
      // Load Quiz History
      const quizRes = await fetch(`/quiz-history?username=${username}`);
      const quizData = await quizRes.json();
      const quizList = document.getElementById('report-quiz-list');
      quizList.innerHTML = '';
      document.getElementById('quiz-count').textContent = `${quizData.length} records`;
      
      if (quizData.length === 0) {
        quizList.innerHTML = '<li style="text-align:center; color:#999;">No quiz results found</li>';
      } else {
        quizData.reverse().forEach(item => {
          quizList.innerHTML += `<li><strong>${item.date}</strong><br>Result: <strong>${item.result}</strong></li>`;
        });
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      alert('Failed to load report data. Please try again.');
    }
  },

  setupReportButtons(username) {
    // Download Report Button (UPDATED TO PDF)
    const downloadBtn = document.getElementById('download-report-btn');
    if (downloadBtn) {
      downloadBtn.onclick = async () => {
        try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          
          // Fetch all data
          const bmiRes = await fetch(`/bmi-history?username=${username}`);
          const bmiData = await bmiRes.json();
          const moodRes = await fetch(`/mood-history?username=${username}`);
          const moodData = await moodRes.json();
          const quizRes = await fetch(`/quiz-history?username=${username}`);
          const quizData = await quizRes.json();
          
          let yPos = 20;
          const pageHeight = doc.internal.pageSize.height;
          const margin = 20;
          const maxWidth = 170;
          
          // Helper function to check if new page is needed
          const checkPageBreak = (neededSpace) => {
            if (yPos + neededSpace > pageHeight - margin) {
              doc.addPage();
              yPos = 20;
            }
          };
          
          // Title
          doc.setFontSize(22);
          doc.setTextColor(102, 126, 234);
          doc.text('BLOOMII COMPLETE HEALTH REPORT', 105, yPos, { align: 'center' });
          yPos += 15;
          
          // User info
          doc.setFontSize(12);
          doc.setTextColor(60, 60, 60);
          doc.text(`User: ${username}`, 20, yPos);
          yPos += 7;
          doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
          yPos += 15;
          
          // BMI History Section
          checkPageBreak(30);
          doc.setFontSize(16);
          doc.setTextColor(102, 126, 234);
          doc.text(`BMI HISTORY (${bmiData.length} records)`, 20, yPos);
          yPos += 3;
          doc.setDrawColor(102, 126, 234);
          doc.line(20, yPos, 190, yPos);
          yPos += 10;
          
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          
          if (bmiData.length === 0) {
            doc.text('No BMI records found.', 20, yPos);
            yPos += 10;
          } else {
            bmiData.reverse().forEach((item, index) => {
              checkPageBreak(20);
              doc.setFont(undefined, 'bold');
              doc.text(`${index + 1}. ${item.date}`, 20, yPos);
              yPos += 5;
              doc.setFont(undefined, 'normal');
              doc.text(`   BMI: ${item.value} | Status: ${item.status}`, 20, yPos);
              yPos += 8;
            });
          }
          yPos += 5;
          
          // Mood History Section
          checkPageBreak(30);
          doc.setFontSize(16);
          doc.setTextColor(102, 126, 234);
          doc.text(`MOOD TRACKER HISTORY (${moodData.length} records)`, 20, yPos);
          yPos += 3;
          doc.line(20, yPos, 190, yPos);
          yPos += 10;
          
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          
          if (moodData.length === 0) {
            doc.text('No mood records found.', 20, yPos);
            yPos += 10;
          } else {
            moodData.reverse().forEach((item, index) => {
              checkPageBreak(25);
              doc.setFont(undefined, 'bold');
              doc.text(`${index + 1}. ${item.date}`, 20, yPos);
              yPos += 5;
              doc.setFont(undefined, 'normal');
              doc.text(`   Mood: ${item.mood}`, 20, yPos);
              yPos += 5;
              const noteText = `   Note: ${item.note || 'No note'}`;
              const splitNote = doc.splitTextToSize(noteText, maxWidth);
              doc.text(splitNote, 20, yPos);
              yPos += (splitNote.length * 5) + 3;
            });
          }
          yPos += 5;
          
          // Quiz History Section
          checkPageBreak(30);
          doc.setFontSize(16);
          doc.setTextColor(102, 126, 234);
          doc.text(`BODY SHAPE QUIZ RESULTS (${quizData.length} records)`, 20, yPos);
          yPos += 3;
          doc.line(20, yPos, 190, yPos);
          yPos += 10;
          
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          
          if (quizData.length === 0) {
            doc.text('No quiz results found.', 20, yPos);
            yPos += 10;
          } else {
            quizData.reverse().forEach((item, index) => {
              checkPageBreak(20);
              doc.setFont(undefined, 'bold');
              doc.text(`${index + 1}. ${item.date}`, 20, yPos);
              yPos += 5;
              doc.setFont(undefined, 'normal');
              doc.text(`   Result: ${item.result}`, 20, yPos);
              yPos += 8;
            });
          }
          
          // Footer on all pages
          const pageCount = doc.internal.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Bloomii Health Report - Page ${i} of ${pageCount}`, 105, pageHeight - 10, { align: 'center' });
          }
          
          // Save PDF
          doc.save(`bloomii-complete-report-${username}-${Date.now()}.pdf`);
          
        } catch (error) {
          console.error('Error generating PDF:', error);
          alert('Failed to generate PDF. Please try again.');
        }
      };
    }
    
    // Back to Profile Button
    const backBtn = document.getElementById('back-to-profile-btn');
    if (backBtn) {
      backBtn.onclick = () => {
        document.getElementById('report').style.display = 'none';
        document.getElementById('profile').style.display = 'block';
      };
    }
  }
});