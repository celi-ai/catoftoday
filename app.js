document.addEventListener('DOMContentLoaded', () => {
  let patCount = 0;
  const patButton = document.getElementById('patButton');
  const patCountDisplay = document.getElementById('patCount');

  patButton.addEventListener('click', () => {
    patCount++;
    patCountDisplay.textContent = `You have patted the cat ${patCount} times.`;
  });
});
