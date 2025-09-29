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

    init() {
        document.getElementById('quizMenuBackBtn').addEventListener('click', () => FeatureHandler.showPage('menu'));
        document.getElementById('quizBackBtn').addEventListener('click', () => this.showPreviousQuestion());
        document.getElementById('nextBtn').addEventListener('click', () => this.showNextQuestion());
        document.getElementById('submitBtn').addEventListener('click', () => this.finishQuiz());
        document.getElementById('quizResultBackBtn').addEventListener('click', () => FeatureHandler.showPage('menu'));
        document.getElementById('quizReviewBackBtn').addEventListener('click', () => {
            document.getElementById('quiz-result').classList.remove('hidden');
            document.getElementById('quiz-review').classList.add('hidden');
        });
        document.getElementById('reviewQuizBtn').addEventListener('click', () => {
            document.getElementById('quiz-result').classList.add('hidden');
            document.getElementById('quiz-review').classList.remove('hidden');
            this.reviewQuiz();
        });
        document.getElementById('takeQuizAgainBtn').addEventListener('click', () => this.takeQuizAgain());
        this.startQuiz();
    },

    startQuiz() {
        this.currentQuestion = 0;
        this.answers = {};
        document.getElementById('quizBox').classList.remove('hidden');
        document.getElementById('quiz-result').classList.add('hidden');
        document.getElementById('quiz-review').classList.add('hidden');
        this.showQuestion();
    },

    showQuestion() {
        const q = this.quizQuestions[this.currentQuestion];
        const quizBox = document.getElementById('quizOptions');
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
        document.getElementById('nextBtn').style.display = (this.currentQuestion < this.quizQuestions.length - 1) ? 'inline-block' : 'none';
        document.getElementById('submitBtn').style.display = 'none';
    },

    showPreviousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.showQuestion();
        }
    },

    showNextQuestion() {
        if (this.currentQuestion < this.quizQuestions.length - 1) {
            this.currentQuestion++;
            this.showQuestion();
        }
    },

    finishQuiz() {
        let counts = { pear: 0, inverted: 0, hourglass: 0, rectangle: 0 };
        Object.values(this.answers).forEach(val => counts[val]++);

        let result = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        let recommendation = '';
        switch (result) {
            case 'pear':
                recommendation = `
                Your body shape is Pear 🍐. <br>
                <ul>
                    <li>Highlight your upper body with bright or detailed tops.</li>
                    <li>Choose A-line skirts or wide-leg pants to balance hips.</li>
                    <li>Avoid bottoms that add extra volume to your hips.</li>
                </ul>`;
                break;
            case 'inverted':
                recommendation = `
                Your body shape is Inverted Triangle 🔺. <br>
                <ul>
                    <li>Wear simple tops to minimize shoulder width.</li>
                    <li>Flared or wide-leg pants can add volume to lower body.</li>
                    <li>Avoid shoulder pads or heavily decorated tops.</li>
                </ul>`;
                break;
            case 'hourglass':
                recommendation = `
                Your body shape is Hourglass ⏳. <br>
                <ul>
                    <li>Highlight your waist with fitted dresses or belts.</li>
                    <li>Bodycon dresses or outfits that show curves work well.</li>
                    <li>Avoid shapeless, boxy clothes that hide your waist.</li>
                </ul>`;
                break;
            case 'rectangle':
                recommendation = `
                Your body shape is Rectangle ▭. <br>
                <ul>
                    <li>Create curves with peplum tops or belts.</li>
                    <li>Layered outfits or ruffles add dimension.</li>
                    <li>Avoid straight-cut outfits that hide the waist completely.</li>
                </ul>`;
                break;
        }

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
            .then(res => res.json())
            .then(data => console.log('Quiz saved:', data))
            .catch(err => console.error('Quiz save error:', err));

        document.getElementById('quizBox').classList.add('hidden');
        document.getElementById('quiz-result').classList.remove('hidden');
        document.getElementById('quizResultContent').innerHTML = `
            <p><strong>Body Shape:</strong> ${result}</p>
            <p><strong>Style Recommendations:</strong> ${recommendation}</p>
        `;

        window.lastQuizAnswers = { answers: this.answers, result, recommendation };
    },

    reviewQuiz() {
        const reviewDiv = document.getElementById('quizReviewContent');
        reviewDiv.innerHTML = '';

        const { answers } = window.lastQuizAnswers;
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
    },

    takeQuizAgain() {
        if (!FeatureHandler.getCurrentUser()) return alert('Please login first!');
        this.currentQuestion = 0;
        this.answers = {};
        document.getElementById('quizReviewContent').innerHTML = '';
        this.startQuiz();
    }
});