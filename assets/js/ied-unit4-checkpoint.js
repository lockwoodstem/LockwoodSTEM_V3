(() => {
  const form = document.querySelector('[data-lesson-checkpoint]');
  if (!form) return;

  const feedback = form.querySelector('[data-practice-feedback]');
  form.addEventListener('change', () => {
    feedback.textContent = '';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const answer = form.querySelector('input[name="practice-choice"]:checked');
    if (!answer) return;

    feedback.textContent = answer.hasAttribute('data-correct')
      ? `Correct. ${answer.dataset.feedback}`
      : `Try again. ${answer.dataset.feedback}`;
  });

  form.hidden = false;
})();
