FeatureHandler.registerFeature('quiz', {
    quizQuestions: [
        {
            question: 'Which part of your body is wider?',
            options: [
                { text: 'Shoulders wider than hips', value: 'inverted' },
                { text: 'Hips wider than shoulders', value: 'pear' },
                { text: 'Shoulders and hips balanced, waist defined', value: 'hourglass' },
                { text: 'Shoulders and hips balanced, waist less defined', value: 'rectangle' }
            ],
            key: 'shape1'
        },
        {
            question: 'Which area is most prominent?',
            options: [
                { text: 'Very slim waist', value: 'hourglass' },
                { text: 'Prominent hips', value: 'pear' },
                { text: 'Prominent shoulders', value: 'inverted' },
                { text: 'No area stands out', value: 'rectangle' }
            ],
            key: 'shape2'
        },
        {
            question: 'When wearing pants or skirts, where is the fit usually an issue?',
            options: [
                { text: 'Too big at waist, fits hips well', value: 'pear' },
                { text: 'Fits shoulders, loose at hips', value: 'inverted' },
                { text: 'Always fits evenly', value: 'hourglass' },
                { text: 'All areas usually too loose or tight', value: 'rectangle' }
            ],
            key: 'shape3'
        },
        {
            question: 'How would you describe your torso length?',
            options: [
                { text: 'Short torso', value: 'pear' },
                { text: 'Long torso', value: 'inverted' },
                { text: 'Proportional torso', value: 'hourglass' },
                { text: 'Straight torso without curves', value: 'rectangle' }
            ],
            key: 'shape4'
        },
        {
            question: 'How would you describe your arms and legs?',
            options: [
                { text: 'Slim arms and legs', value: 'hourglass' },
                { text: 'Thicker thighs or upper arms', value: 'pear' },
                { text: 'Broad shoulders and arms', value: 'inverted' },
                { text: 'Evenly proportioned, minimal curves', value: 'rectangle' }
            ],
            key: 'shape5'
        },
        {
            question: 'Which statement best describes your waistline?',
            options: [
                { text: 'Clearly defined waist', value: 'hourglass' },
                { text: 'Slightly defined waist', value: 'rectangle' },
                { text: 'Waist less defined than hips', value: 'pear' },
                { text: 'Waist less defined than shoulders', value: 'inverted' }
            ],
            key: 'shape6'
        }
    ],
    currentQuestion: 0,
    answers: {},
    lastQuizAnswers: null,

    init() {
        try {
            const menuBtn = document.getElementById('quizMenuBackBtn');
            const backBtn = document.getElementById('quizBackBtn');
            const nextBtn = document.getElementById('nextBtn');
            const submitBtn = document.getElementById('submitBtn');
            const reviewBtn = document.getElementById('reviewQuizBtn');
            const takeAgainBtn = document.getElementById('takeQuizAgainBtn');
            const resultBackBtn = document.getElementById('quizResultBackBtn');
            const reviewBackBtn = document.getElementById('quizReviewBackBtn');

            if (!menuBtn || !backBtn || !nextBtn || !submitBtn || !reviewBtn || !takeAgainBtn || !resultBackBtn || !reviewBackBtn) {
                throw new Error('One or more quiz buttons not found in DOM');
            }

            menuBtn.addEventListener('click', () => {
                console.log('Back to Menu clicked');
                FeatureHandler.showPage('menu');
            });
            backBtn.addEventListener('click', () => {
                console.log('Back button clicked');
                this.showPreviousQuestion();
            });
            nextBtn.addEventListener('click', () => {
                console.log('Next button clicked');
                this.showNextQuestion();
            });
            submitBtn.addEventListener('click', () => {
                console.log('Submit button clicked');
                this.finishQuiz();
            });
            reviewBtn.addEventListener('click', () => {
                console.log('Review Jawaban Quiz clicked');
                document.getElementById('quiz-result').classList.add('hidden');
                document.getElementById('quiz-review').classList.remove('hidden');
                this.reviewQuiz();
            });
            takeAgainBtn.addEventListener('click', () => {
                console.log('Take Quiz Again clicked');
                this.takeQuizAgain();
            });
            resultBackBtn.addEventListener('click', () => {
                console.log('Back to Menu from result clicked');
                FeatureHandler.showPage('menu');
            });
            reviewBackBtn.addEventListener('click', () => {
                console.log('Back to Result clicked');
                document.getElementById('quiz-review').classList.add('hidden');
                document.getElementById('quiz-result').classList.remove('hidden');
            });

            const user = FeatureHandler.getCurrentUser();
            if (user) {
                fetch(`/quiz-history?username=${encodeURIComponent(user)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data) && data.length > 0) {
                            // Ambil hasil quiz terakhir
                            const last = data[data.length - 1];
                            this.lastQuizAnswers = last;
                            this.showSavedQuizResult();
                        } else {
                            this.startQuiz();
                        }
                    })
                    .catch(() => this.startQuiz());
            } else {
                this.startQuiz();
            }
        } catch (err) {
            console.error('Quiz init error:', err.message);
            alert('Error loading quiz: ' + err.message + '. Please refresh the page.');
        }
    },

    startQuiz() {
        try {
            console.log('Starting quiz');
            this.currentQuestion = 0;
            this.answers = {};
            const quizBox = document.getElementById('quizBox');
            const quizResult = document.getElementById('quiz-result');
            const quizReview = document.getElementById('quiz-review');
            if (!quizBox || !quizResult || !quizReview) {
                throw new Error('Quiz container elements not found');
            }
            quizBox.classList.remove('hidden');
            quizResult.classList.add('hidden');
            quizReview.classList.add('hidden');
            document.getElementById('quizResultContent').innerHTML = '';
            document.getElementById('quizReviewContent').innerHTML = '';
            this.showQuestion();
        } catch (err) {
            console.error('Start quiz error:', err.message);
            alert('Error starting quiz: ' + err.message + '. Please refresh the page.');
        }
    },

    showQuestion() {
        try {
            console.log('Showing question', this.currentQuestion);
            const q = this.quizQuestions[this.currentQuestion];
            if (!q) {
                throw new Error(`Question at index ${this.currentQuestion} not found`);
            }
            const quizBox = document.getElementById('quizOptions');
            if (!quizBox) {
                throw new Error('quizOptions element not found');
            }
            quizBox.innerHTML = '';

            const card = document.createElement('div');
            card.className = 'quiz-card';

            const questionEl = document.createElement('p');
            questionEl.id = 'quizQuestion';
            questionEl.innerText = q.question;
            card.appendChild(questionEl);

            q.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.innerText = opt.text;
                if (this.answers[q.key] === opt.value) btn.classList.add('selected');
                btn.onclick = () => {
                    console.log('Option clicked:', opt.text);
                    this.answers[q.key] = opt.value;
                    Array.from(card.querySelectorAll('button')).forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    if (this.currentQuestion < this.quizQuestions.length - 1) {
                        this.currentQuestion++;
                        this.showQuestion();
                    } else {
                        document.getElementById('submitBtn').style.display = 'inline-block';
                        document.getElementById('nextBtn').style.display = 'none';
                    }
                };
                card.appendChild(btn);
            });

            quizBox.appendChild(card);

            document.getElementById('quizBackBtn').style.display = this.currentQuestion > 0 ? 'inline-block' : 'none';
            document.getElementById('nextBtn').style.display = (this.currentQuestion < this.quizQuestions.length - 1 && this.answers[q.key]) ? 'inline-block' : 'none';
            document.getElementById('submitBtn').style.display = (this.currentQuestion === this.quizQuestions.length - 1 && this.answers[q.key]) ? 'inline-block' : 'none';
        } catch (err) {
            console.error('Show question error:', err.message);
            alert('Error displaying question: ' + err.message + '. Please refresh the page.');
        }
    },

    showPreviousQuestion() {
        try {
            console.log('Showing previous question');
            if (this.currentQuestion > 0) {
                this.currentQuestion--;
                this.showQuestion();
            }
        } catch (err) {
            console.error('Show previous question error:', err.message);
            alert('Error navigating to previous question: ' + err.message);
        }
    },

    showNextQuestion() {
        try {
            console.log('Showing next question');
            if (this.currentQuestion < this.quizQuestions.length - 1 && this.answers[this.quizQuestions[this.currentQuestion].key]) {
                this.currentQuestion++;
                this.showQuestion();
            }
        } catch (err) {
            console.error('Show next question error:', err.message);
            alert('Error navigating to next question: ' + err.message);
        }
    },

    finishQuiz() {
    try {
            console.log('Finishing quiz');
            if (Object.keys(this.answers).length < this.quizQuestions.length) {
                alert('Please answer all questions before submitting');
                return;
            }
            let counts = { pear: 0, inverted: 0, hourglass: 0, rectangle: 0 };
            Object.values(this.answers).forEach(val => counts[val]++);

            let result = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

            let recommendation = '';
            let articles = '';
            switch (result) {
                case 'pear':
                    recommendation = `
                    Your body shape is Pear 🍐.<br>
                    <ul>
                        <li>Highlight your upper body with bright or detailed tops.</li>
                        <li>Choose A-line skirts or wide-leg pants to balance hips.</li>
                        <li>Avoid bottoms that add extra volume to your hips.</li>
                    </ul>`;
                    articles = `
                    <h3>Rekomendasi Artikel Outfit:</h3>
                    <ul>
                        <li><a href="https://www.stylecraze.com/articles/outfits-for-pear-shaped-body/" target="_blank">Outfits for Pear Shaped Body - StyleCraze</a></li>
                        <li><a href="https://www.instyle.com/pear-shaped-body-fashion-tips-7973072" target="_blank">Fashion Tips for Pear Shaped Body - InStyle</a></li>
                    </ul>`;
                    break;
                case 'inverted':
                    recommendation = `
                    Your body shape is Inverted Triangle 🔺.<br>
                    <ul>
                        <li>Wear simple tops to minimize shoulder width.</li>
                        <li>Flared or wide-leg pants can add volume to lower body.</li>
                        <li>Avoid shoulder pads or heavily decorated tops.</li>
                    </ul>`;
                    articles = `
                    <h3>Rekomendasi Artikel Outfit:</h3>
                    <ul>
                        <li><a href="https://www.stylecraze.com/articles/outfits-for-inverted-triangle-body-shape/" target="_blank">Outfits for Inverted Triangle - StyleCraze</a></li>
                        <li><a href="https://www.instyle.com/inverted-triangle-body-fashion-tips-7973073" target="_blank">Fashion Tips for Inverted Triangle - InStyle</a></li>
                    </ul>`;
                    break;
                case 'hourglass':
                    recommendation = `
                    Your body shape is Hourglass ⏳.<br>
                    <ul>
                        <li>Highlight your waist with fitted dresses or belts.</li>
                        <li>Bodycon dresses or outfits that show curves work well.</li>
                        <li>Avoid shapeless, boxy clothes that hide your waist.</li>
                    </ul>`;
                    articles = `
                    <h3>Rekomendasi Artikel Outfit:</h3>
                    <ul>
                        <li><a href="https://www.stylecraze.com/articles/outfits-for-hourglass-body-shape/" target="_blank">Outfits for Hourglass - StyleCraze</a></li>
                        <li><a href="https://www.instyle.com/hourglass-body-fashion-tips-7973074" target="_blank">Fashion Tips for Hourglass - InStyle</a></li>
                    </ul>`;
                    break;
                case 'rectangle':
                    recommendation = `
                    Your body shape is Rectangle ▭.<br>
                    <ul>
                        <li>Create curves with peplum tops or belts.</li>
                        <li>Layered outfits or ruffles add dimension.</li>
                        <li>Avoid straight-cut outfits that hide the waist completely.</li>
                    </ul>`;
                    articles = `
                    <h3>Rekomendasi Artikel Outfit:</h3>
                    <ul>
                        <li><a href="https://www.stylecraze.com/articles/outfits-for-rectangle-body-shape/" target="_blank">Outfits for Rectangle - StyleCraze</a></li>
                        <li><a href="https://www.instyle.com/rectangle-body-fashion-tips-7973075" target="_blank">Fashion Tips for Rectangle - InStyle</a></li>
                    </ul>`;
                    break;
            }

            if (FeatureHandler.getCurrentUser()) {
                fetch('/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: FeatureHandler.getCurrentUser(),
                        answers: this.answers,
                        result,
                        recommendation
                    })
                })
                    .then(res => {
                        if (!res.ok) throw new Error('Error saving quiz');
                        return res.json();
                    })
                    .then(data => console.log('Quiz saved:', data))
                    .catch(err => console.error('Quiz save error:', err));
            }


            // Sembunyikan pertanyaan dan navigasi quiz, tapi quizBox tetap tampil
            document.getElementById('quizQuestion').style.display = 'none';
            document.getElementById('quizOptions').style.display = 'none';
            document.querySelector('.quiz-nav').style.display = 'none';

            // Tampilkan hasil quiz di bawah quizBox
            document.getElementById('quiz-result').classList.remove('hidden');
            document.getElementById('quiz-review').classList.add('hidden');
            document.getElementById('quizResultContent').innerHTML = `
                <p><strong>Body Shape:</strong> ${result.charAt(0).toUpperCase() + result.slice(1)}</p>
                <p><strong>Style Recommendations:</strong> ${recommendation}</p>
                ${articles}
            `;

            this.lastQuizAnswers = { answers: { ...this.answers }, result, recommendation };
            // Tidak perlu simpan ke localStorage, cukup POST ke server
        } catch (err) {
            console.error('Finish quiz error:', err.message);
            alert('Error finishing quiz: ' + err.message + '. Please try again.');
        }
    },

    reviewQuiz() {
        try {
            console.log('Rendering quiz review');
            const reviewDiv = document.getElementById('quizReviewContent');
            if (!reviewDiv) {
                throw new Error('quizReviewContent element not found');
            }
            reviewDiv.innerHTML = '';

            const { answers } = this.lastQuizAnswers || { answers: {} };
            this.quizQuestions.forEach((q, idx) => {
                const userAnswer = answers[q.key];
                const qDiv = document.createElement('div');
                qDiv.className = 'quiz-card';
                qDiv.innerHTML = `<p><strong>Q${idx + 1}:</strong> ${q.question}</p>`;
                q.options.forEach(opt => {
                    const checked = (opt.value === userAnswer) ? '✅' : '';
                    const p = document.createElement('p');
                    p.innerHTML = `${opt.text} ${checked}`;
                    qDiv.appendChild(p);
                });
                reviewDiv.appendChild(qDiv);
            });
        } catch (err) {
            console.error('Review quiz error:', err.message);
            alert('Error loading quiz review: ' + err.message + '. Please try again.');
        }
    },

    takeQuizAgain() {
        try {
            console.log('Taking quiz again');
            const user = FeatureHandler.getCurrentUser();
            if (!user) {
                alert('Please login first!');
                FeatureHandler.showPage('login');
                return;
            }
            // Tidak perlu hapus localStorage, quiz akan direset dan hasil baru akan diambil dari server
            this.currentQuestion = 0;
            this.answers = {};
            document.getElementById('quizReviewContent').innerHTML = '';
            // Tampilkan kembali pertanyaan dan navigasi quiz
            document.getElementById('quizQuestion').style.display = '';
            document.getElementById('quizOptions').style.display = '';
            document.querySelector('.quiz-nav').style.display = '';
            this.startQuiz();
        } catch (err) {
            console.error('Take quiz again error:', err.message);
            alert('Error restarting quiz: ' + err.message + '. Please try again.');
        }

    },

    showSavedQuizResult() {
        // Tampilkan hasil quiz yang sudah tersimpan di localStorage
        try {
            document.getElementById('quizBox').classList.remove('hidden');
            document.getElementById('quiz-result').classList.remove('hidden');
            document.getElementById('quiz-review').classList.add('hidden');
            document.getElementById('quizQuestion').style.display = 'none';
            document.getElementById('quizOptions').style.display = 'none';
            document.querySelector('.quiz-nav').style.display = 'none';
            const { result, recommendation } = this.lastQuizAnswers || {};
            let articles = '';
            switch (result) {
                case 'pear':
                    articles = `
                    <h3>Rekomendasi Artikel Outfit:</h3>
                    <ul>
                        <li><a href="https://www.stylecraze.com/articles/outfits-for-pear-shaped-body/" target="_blank">Outfits for Pear Shaped Body - StyleCraze</a></li>
                        <li><a href="https://www.instyle.com/pear-shaped-body-fashion-tips-7973072" target="_blank">Fashion Tips for Pear Shaped Body - InStyle</a></li>
                    </ul>`;
                    break;
                case 'inverted':
                    articles = `
                    <h3>Rekomendasi Artikel Outfit:</h3>
                    <ul>
                        <li><a href="https://www.stylecraze.com/articles/outfits-for-inverted-triangle-body-shape/" target="_blank">Outfits for Inverted Triangle - StyleCraze</a></li>
                        <li><a href="https://www.instyle.com/inverted-triangle-body-fashion-tips-7973073" target="_blank">Fashion Tips for Inverted Triangle - InStyle</a></li>
                    </ul>`;
                    break;
                case 'hourglass':
                    articles = `
                    <h3>Rekomendasi Artikel Outfit:</h3>
                    <ul>
                        <li><a href="https://www.stylecraze.com/articles/outfits-for-hourglass-body-shape/" target="_blank">Outfits for Hourglass - StyleCraze</a></li>
                        <li><a href="https://www.instyle.com/hourglass-body-fashion-tips-7973074" target="_blank">Fashion Tips for Hourglass - InStyle</a></li>
                    </ul>`;
                    break;
                case 'rectangle':
                    articles = `
                    <h3>Rekomendasi Artikel Outfit:</h3>
                    <ul>
                        <li><a href="https://www.stylecraze.com/articles/outfits-for-rectangle-body-shape/" target="_blank">Outfits for Rectangle - StyleCraze</a></li>
                        <li><a href="https://www.instyle.com/rectangle-body-fashion-tips-7973075" target="_blank">Fashion Tips for Rectangle - InStyle</a></li>
                    </ul>`;
                    break;
            }
            document.getElementById('quizResultContent').innerHTML = `
                <p><strong>Body Shape:</strong> ${result ? result.charAt(0).toUpperCase() + result.slice(1) : ''}</p>
                <p><strong>Style Recommendations:</strong> ${recommendation || ''}</p>
                ${articles}
            `;
        } catch (err) {
            console.error('Show saved quiz result error:', err.message);
        }
    }
});