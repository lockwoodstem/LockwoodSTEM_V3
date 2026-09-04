(() => {
  'use strict';

  const STORAGE_KEY = 'lockwoodstem-adm-python-pretest-v1';
  const domains = [
    'Python Fundamentals',
    'Operators and Decisions',
    'Loops, Lists, and Functions',
    'Debugging and Manufacturing Applications'
  ];

  const questions = [
    {
      domain: domains[0],
      prompt: 'What is displayed when this Python statement runs?',
      code: 'print("System ready")',
      options: ['System ready', '"System ready"', 'print(System ready)', 'Nothing'],
      answer: 0,
      skill: 'output with print()'
    },
    {
      domain: domains[0],
      prompt: 'Which statement correctly creates a variable named part_count with the value 12?',
      options: ['part_count == 12', '12 = part_count', 'part_count = 12', 'variable part_count = 12'],
      answer: 2,
      skill: 'variable assignment'
    },
    {
      domain: domains[0],
      prompt: 'What is the data type of the value stored in measurement?',
      code: 'measurement = 3.5',
      options: ['int', 'float', 'str', 'bool'],
      answer: 1,
      skill: 'data types'
    },
    {
      domain: domains[0],
      prompt: 'What value is printed by this code?',
      code: 'parts = 8\nparts = parts + 3\nprint(parts)',
      options: ['3', '8', '11', '83'],
      answer: 2,
      skill: 'updating variables'
    },
    {
      domain: domains[0],
      prompt: 'Why is int() used in this statement?',
      code: 'target = int(input("Enter target quantity: "))',
      options: ['To display the target', 'To convert the typed text to an integer', 'To repeat the input', 'To create a decimal value'],
      answer: 1,
      skill: 'input and type conversion'
    },
    {
      domain: domains[1],
      prompt: 'What value is produced by the expression 17 // 5?',
      options: ['2', '3', '3.4', '4'],
      answer: 1,
      skill: 'integer division'
    },
    {
      domain: domains[1],
      prompt: 'What value is produced by the expression 17 % 5?',
      options: ['2', '3', '3.4', '5'],
      answer: 0,
      skill: 'remainder operator'
    },
    {
      domain: domains[1],
      prompt: 'What Boolean value is produced by the comparison?',
      code: 'temperature = 72\ntemperature > 80',
      options: ['True', 'False', '72', '80'],
      answer: 1,
      skill: 'comparisons and Boolean values'
    },
    {
      domain: domains[1],
      prompt: 'What is printed when this code runs?',
      code: 'quality = 88\n\nif quality >= 90:\n    print("Excellent")\nelif quality >= 80:\n    print("Accept")\nelse:\n    print("Rework")',
      options: ['Excellent', 'Accept', 'Rework', 'Nothing'],
      answer: 1,
      skill: 'if-elif-else logic'
    },
    {
      domain: domains[1],
      prompt: 'A machine may run only when the guard is closed and the emergency stop is reset. Which condition represents that rule?',
      options: ['guard_closed or e_stop_reset', 'guard_closed and e_stop_reset', 'not guard_closed', 'guard_closed == e_stop_reset == False'],
      answer: 1,
      skill: 'Boolean and operator'
    },
    {
      domain: domains[2],
      prompt: 'What values are printed by this loop?',
      code: 'for step in range(3):\n    print(step)',
      options: ['1, 2, 3', '0, 1, 2', '0, 1, 2, 3', '3 only'],
      answer: 1,
      skill: 'for loops and range()'
    },
    {
      domain: domains[2],
      prompt: 'What value is stored in total after the loop finishes?',
      code: 'total = 0\nfor part in range(1, 4):\n    total = total + part',
      options: ['3', '4', '6', '10'],
      answer: 2,
      skill: 'accumulation in loops'
    },
    {
      domain: domains[2],
      prompt: 'Which statement must eventually become false so this loop can stop?',
      code: 'while sensor_value < 50:\n    sensor_value = read_sensor()',
      options: ['sensor_value < 50', 'sensor_value = read_sensor()', 'while', 'read_sensor'],
      answer: 0,
      skill: 'while-loop conditions'
    },
    {
      domain: domains[2],
      prompt: 'What value is stored in selected_color?',
      code: 'colors = ["red", "green", "blue"]\nselected_color = colors[1]',
      options: ['red', 'green', 'blue', '1'],
      answer: 1,
      skill: 'list indexing'
    },
    {
      domain: domains[2],
      prompt: 'What does this function return when cycle_time(10, 50) is called?',
      code: 'def cycle_time(parts, seconds):\n    return seconds / parts',
      options: ['0.2', '5', '40', '500'],
      answer: 1,
      skill: 'functions, parameters, and return values'
    },
    {
      domain: domains[3],
      prompt: 'Which line contains the syntax error?',
      code: '1  sensor = 42\n2  if sensor > 40\n3      print("High")',
      options: ['Line 1: a semicolon is missing', 'Line 2: a colon is missing', 'Line 3: print cannot be indented', 'There is no error'],
      answer: 1,
      skill: 'finding syntax errors'
    },
    {
      domain: domains[3],
      prompt: 'A programmer wants the loop to process parts numbered 1 through 5. Which range is correct?',
      options: ['range(1, 5)', 'range(0, 5)', 'range(1, 6)', 'range(5, 1)'],
      answer: 2,
      skill: 'off-by-one loop errors'
    },
    {
      domain: domains[3],
      prompt: 'A color sensor reports 18 for a dark defective part. What action is printed?',
      code: 'sensor_value = 18\n\nif sensor_value < 25:\n    print("Reject")\nelse:\n    print("Accept")',
      options: ['Reject', 'Accept', '18', 'No action'],
      answer: 0,
      skill: 'sensor-threshold logic'
    },
    {
      domain: domains[3],
      prompt: 'The conveyor should stop after five parts are counted. Which change correctly updates the counter each time a part passes?',
      options: ['count == count + 1', 'count = 1', 'count = count + 1', 'count + 1 = count'],
      answer: 2,
      skill: 'counter logic'
    },
    {
      domain: domains[3],
      prompt: 'A robot moves to an approach point, lowers to pick up a part, then returns upward. Which sequence is safest and most logical?',
      options: [
        'Move to pick point → move to approach point → grip part',
        'Move to approach point → move to pick point → grip part → return to approach point',
        'Grip part → move to pick point → move to approach point',
        'Move directly to the next station without an approach point'
      ],
      answer: 1,
      skill: 'manufacturing motion sequencing'
    }
  ];

  const state = {
    current: 0,
    answers: Array(questions.length).fill(null),
    studentName: '',
    classPeriod: '',
    experienceLevel: 'Not provided',
    startedAt: null,
    completedAt: null
  };

  const $ = (selector) => document.querySelector(selector);
  const els = {};

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, completedAt: null }));
      if (els.autosaveStatus) {
        els.autosaveStatus.textContent = 'Saved';
        clearTimeout(saveState.timer);
        saveState.timer = setTimeout(() => { els.autosaveStatus.textContent = 'Answers save automatically'; }, 1100);
      }
    } catch (error) {
      console.warn('Could not save pre-test progress.', error);
      if (els.autosaveStatus) els.autosaveStatus.textContent = 'Autosave unavailable';
    }
  }

  function loadSavedState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || !Array.isArray(saved.answers) || saved.answers.length !== questions.length) return false;
      state.current = Math.min(Math.max(Number(saved.current) || 0, 0), questions.length - 1);
      state.answers = saved.answers.map((answer) => Number.isInteger(answer) ? answer : null);
      state.studentName = String(saved.studentName || '');
      state.classPeriod = String(saved.classPeriod || '');
      state.experienceLevel = String(saved.experienceLevel || 'Not provided');
      state.startedAt = saved.startedAt || null;
      return true;
    } catch (error) {
      console.warn('Could not load saved pre-test progress.', error);
      return false;
    }
  }

  function clearSavedState() {
    try { localStorage.removeItem(STORAGE_KEY); }
    catch (error) { console.warn('Could not clear saved pre-test progress.', error); }
  }

  function showPanel(panel) {
    [els.startPanel, els.quizPanel, els.resultsPanel].forEach((item) => { item.hidden = item !== panel; });
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderNavigator() {
    els.navigator.innerHTML = questions.map((question, index) => {
      const classes = ['python-pretest-nav-button'];
      if (state.answers[index] !== null) classes.push('is-answered');
      if (index === state.current) classes.push('is-current');
      return `<button type="button" class="${classes.join(' ')}" data-question-index="${index}" aria-label="Question ${index + 1}${state.answers[index] !== null ? ', answered' : ', unanswered'}"${index === state.current ? ' aria-current="step"' : ''}>${index + 1}</button>`;
    }).join('');
  }

  function renderQuestion() {
    const question = questions[state.current];
    els.questionCount.textContent = `Question ${state.current + 1} of ${questions.length}`;
    els.progressFill.style.width = `${((state.current + 1) / questions.length) * 100}%`;
    els.questionDomain.textContent = question.domain;
    els.questionNumberLabel.textContent = `Question ${state.current + 1}`;
    els.questionPrompt.textContent = question.prompt;

    if (question.code) {
      els.questionCode.hidden = false;
      els.questionCode.querySelector('code').textContent = question.code;
    } else {
      els.questionCode.hidden = true;
      els.questionCode.querySelector('code').textContent = '';
    }

    els.options.innerHTML = question.options.map((option, index) => {
      const letter = String.fromCharCode(65 + index);
      return `<label class="python-pretest-option"><input type="radio" name="question-${state.current}" value="${index}"${state.answers[state.current] === index ? ' checked' : ''}><span class="python-pretest-option-letter">${letter}.</span><span>${escapeHtml(option)}</span></label>`;
    }).join('');

    els.previousButton.disabled = state.current === 0;
    const isLast = state.current === questions.length - 1;
    els.nextButton.hidden = isLast;
    els.submitButton.hidden = !isLast;
    renderNavigator();
    els.questionCard.focus?.({ preventScroll: true });
  }

  function startAttempt(resume = false) {
    if (!resume) {
      const studentName = els.studentName.value.trim();
      const classPeriod = els.classPeriod.value.trim();
      if (!studentName || !classPeriod) {
        els.startMessage.textContent = 'Enter your name and class period before beginning.';
        els.startMessage.hidden = false;
        (!studentName ? els.studentName : els.classPeriod).focus();
        return;
      }
      state.current = 0;
      state.answers = Array(questions.length).fill(null);
      state.studentName = studentName;
      state.classPeriod = classPeriod;
      state.experienceLevel = els.experienceLevel.value;
      state.startedAt = new Date().toISOString();
      state.completedAt = null;
      saveState();
    }
    els.startMessage.hidden = true;
    showPanel(els.quizPanel);
    renderQuestion();
  }

  function updateAnswer(event) {
    const input = event.target.closest('input[type="radio"]');
    if (!input) return;
    state.answers[state.current] = Number(input.value);
    saveState();
    renderNavigator();
  }

  function goToQuestion(index) {
    state.current = Math.min(Math.max(index, 0), questions.length - 1);
    saveState();
    renderQuestion();
    els.questionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function readinessFor(score) {
    if (score >= 16) return { title: 'Advanced readiness', description: 'You already demonstrate strong Python foundations. You are ready for extension tasks involving reusable functions, data processing, and manufacturing automation logic.' };
    if (score >= 11) return { title: 'Ready with targeted review', description: 'You demonstrate a useful Python foundation. A short review of your lower-scoring skill areas should prepare you for course programming tasks.' };
    if (score >= 6) return { title: 'Developing foundation', description: 'You recognize several Python concepts but will benefit from guided practice before applying code to automated manufacturing systems.' };
    return { title: 'Starting foundation', description: 'Python may be new to you. Begin with variables, input and output, simple decisions, and short loops. This starting point is expected and will not prevent success in the course.' };
  }

  function domainMessage(correct) {
    if (correct === 5) return 'Strong evidence of mastery in this area.';
    if (correct >= 3) return 'Functional understanding with a few concepts to review.';
    return 'Priority review area before independent programming work.';
  }

  function buildNextSteps(domainScores) {
    const recommendations = {
      [domains[0]]: 'Review print(), variable assignment, basic data types, input(), and converting text to numbers.',
      [domains[1]]: 'Practice arithmetic operators, comparisons, Boolean logic, and tracing if-elif-else decisions.',
      [domains[2]]: 'Practice range(), for and while loops, list indexing, and writing small functions that return values.',
      [domains[3]]: 'Practice locating syntax and logic errors, checking loop boundaries, and translating sensor or motion rules into code.'
    };
    const ordered = domains.slice().sort((a, b) => domainScores[a] - domainScores[b]);
    const focus = ordered.filter((domain) => domainScores[domain] < 4);
    const selected = focus.length ? focus : [ordered[0]];
    return selected.slice(0, 3).map((domain, index) => `<article class="python-pretest-next-step"><span>${index + 1}</span><div><h3>${escapeHtml(domain)}</h3><p>${escapeHtml(recommendations[domain])}</p></div></article>`).join('');
  }

  function formatDate(iso) {
    if (!iso) return 'Not recorded';
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
  }

  function submitAttempt() {
    const unanswered = state.answers.map((answer, index) => answer === null ? index + 1 : null).filter(Boolean);
    if (unanswered.length) {
      const message = unanswered.length === 1 ? `Question ${unanswered[0]} is unanswered. Submit anyway?` : `${unanswered.length} questions are unanswered. Submit anyway?`;
      if (!window.confirm(message)) {
        goToQuestion(unanswered[0] - 1);
        return;
      }
    }

    state.completedAt = new Date().toISOString();
    const domainScores = Object.fromEntries(domains.map((domain) => [domain, 0]));
    let score = 0;
    questions.forEach((question, index) => {
      if (state.answers[index] === question.answer) {
        score += 1;
        domainScores[question.domain] += 1;
      }
    });

    const percent = Math.round((score / questions.length) * 100);
    const readiness = readinessFor(score);
    els.resultsScore.textContent = `${score}/${questions.length}`;
    els.resultsPercent.textContent = `${percent}%`;
    els.resultsStudentLine.textContent = `${state.studentName} • Period ${state.classPeriod} • Completed ${formatDate(state.completedAt)}`;
    els.readinessTitle.textContent = readiness.title;
    els.readinessDescription.textContent = readiness.description;

    els.domainResults.innerHTML = domains.map((domain) => {
      const correct = domainScores[domain];
      return `<article class="python-pretest-domain-card"><div class="python-pretest-domain-card-top"><h3>${escapeHtml(domain)}</h3><strong>${correct}/5</strong></div><div class="python-pretest-domain-bar" aria-label="${correct} of 5 correct"><span style="width:${correct * 20}%"></span></div><p>${escapeHtml(domainMessage(correct))}</p></article>`;
    }).join('');

    els.nextSteps.innerHTML = buildNextSteps(domainScores);
    const summary = [
      'LockwoodSTEM — ADM Python Programming Pre-Test',
      `Student: ${state.studentName}`,
      `Class Period: ${state.classPeriod}`,
      `Previous Python Experience: ${state.experienceLevel}`,
      `Completed: ${formatDate(state.completedAt)}`,
      '',
      `Total Score: ${score}/${questions.length} (${percent}%)`,
      `Readiness Level: ${readiness.title}`,
      '',
      'Skill Breakdown:',
      ...domains.map((domain) => `- ${domain}: ${domainScores[domain]}/5`),
      '',
      'Purpose: Beginning-of-course diagnostic; not a course grade.'
    ].join('\n');
    els.summaryText.textContent = summary;
    clearSavedState();
    showPanel(els.resultsPanel);
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(els.summaryText.textContent);
      els.copyStatus.textContent = 'Result summary copied.';
    } catch (error) {
      els.copyStatus.textContent = 'Copy was blocked. Select the summary text and copy it manually.';
    }
  }

  function downloadSummary() {
    const safeName = state.studentName.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Student';
    const blob = new Blob([els.summaryText.textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}_ADM_Python_Pretest_Results.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    els.copyStatus.textContent = 'Result summary downloaded.';
  }

  function restartAttempt() {
    if (!window.confirm('Start a new attempt? The current results will no longer be displayed.')) return;
    clearSavedState();
    state.current = 0;
    state.answers = Array(questions.length).fill(null);
    state.startedAt = null;
    state.completedAt = null;
    els.studentName.value = state.studentName;
    els.classPeriod.value = state.classPeriod;
    els.experienceLevel.value = state.experienceLevel;
    els.resumeButton.hidden = true;
    els.clearSavedButton.hidden = true;
    showPanel(els.startPanel);
  }

  function bindEvents() {
    els.startButton.addEventListener('click', () => startAttempt(false));
    els.resumeButton.addEventListener('click', () => startAttempt(true));
    els.clearSavedButton.addEventListener('click', () => {
      if (!window.confirm('Clear the saved attempt?')) return;
      clearSavedState();
      els.resumeButton.hidden = true;
      els.clearSavedButton.hidden = true;
      els.studentName.value = '';
      els.classPeriod.value = '';
      els.experienceLevel.value = 'Not provided';
    });
    els.options.addEventListener('change', updateAnswer);
    els.previousButton.addEventListener('click', () => goToQuestion(state.current - 1));
    els.nextButton.addEventListener('click', () => goToQuestion(state.current + 1));
    els.submitButton.addEventListener('click', submitAttempt);
    els.navigator.addEventListener('click', (event) => {
      const button = event.target.closest('[data-question-index]');
      if (button) goToQuestion(Number(button.dataset.questionIndex));
    });
    els.printButton.addEventListener('click', () => window.print());
    els.copyButton.addEventListener('click', copySummary);
    els.downloadButton.addEventListener('click', downloadSummary);
    els.restartButton.addEventListener('click', restartAttempt);
  }

  function init() {
    Object.assign(els, {
      startPanel: $('#pretestStartPanel'), quizPanel: $('#pretestQuizPanel'), resultsPanel: $('#pretestResultsPanel'),
      studentName: $('#studentName'), classPeriod: $('#classPeriod'), experienceLevel: $('#experienceLevel'),
      startButton: $('#startPretestButton'), resumeButton: $('#resumePretestButton'), clearSavedButton: $('#clearSavedAttemptButton'), startMessage: $('#startFormMessage'),
      questionCount: $('#questionCount'), progressFill: $('#progressFill'), autosaveStatus: $('#autosaveStatus'), navigator: $('#questionNavigator'),
      questionCard: $('#questionCard'), questionDomain: $('#questionDomain'), questionNumberLabel: $('#questionNumberLabel'), questionPrompt: $('#questionPrompt'), questionCode: $('#questionCode'), options: $('#questionOptions'),
      previousButton: $('#previousQuestionButton'), nextButton: $('#nextQuestionButton'), submitButton: $('#submitPretestButton'),
      resultsScore: $('#resultsScore'), resultsPercent: $('#resultsPercent'), resultsStudentLine: $('#resultsStudentLine'), readinessTitle: $('#readinessTitle'), readinessDescription: $('#readinessDescription'), domainResults: $('#domainResults'), nextSteps: $('#nextSteps'), summaryText: $('#resultSummaryText'),
      printButton: $('#printResultsButton'), copyButton: $('#copyResultsButton'), downloadButton: $('#downloadResultsButton'), restartButton: $('#restartPretestButton'), copyStatus: $('#copyStatus')
    });

    const hasSaved = loadSavedState();
    if (hasSaved) {
      els.studentName.value = state.studentName;
      els.classPeriod.value = state.classPeriod;
      els.experienceLevel.value = state.experienceLevel;
      els.resumeButton.hidden = false;
      els.clearSavedButton.hidden = false;
    }
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
