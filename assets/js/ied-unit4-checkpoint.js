(() => {
  const form = document.querySelector('[data-lesson-checkpoint]');
  const review = document.querySelector('[data-lesson-review]');
  if (!form || !review) return;

  const feedback = form.querySelector('[data-practice-feedback]');
  const confirmation = review.querySelector('[data-review-confirm]');
  const status = review.querySelector('[data-review-status]');
  const waiting = status.textContent;

  confirmation.addEventListener('change', () => {
    status.textContent = confirmation.checked
      ? 'Ready to submit. Turn in your work through Google Classroom.'
      : 'Practice complete. Review your work before you submit.';
  });

  form.addEventListener('change', () => {
    feedback.textContent = '';
    confirmation.checked = false;
    confirmation.disabled = true;
    status.textContent = waiting;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const answer = form.querySelector('input[name="practice-choice"]:checked');
    if (!answer) return;

    const correct = answer.hasAttribute('data-correct');
    feedback.textContent = correct
      ? `Correct. ${answer.dataset.feedback}`
      : `Try again. ${answer.dataset.feedback}`;
    confirmation.disabled = !correct;
    if (!confirmation.checked) {
      status.textContent = correct ? 'Practice complete. Review your work before you submit.' : waiting;
    }
  });

  form.hidden = false;
  review.hidden = false;
})();
