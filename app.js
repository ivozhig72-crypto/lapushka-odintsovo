const menuToggle = document.querySelector('#menuToggle');
const menuPanel = document.querySelector('#menuPanel');

function setMenuOpen(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  menuPanel.hidden = !open;
}

menuToggle.addEventListener('click', () => {
  setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
});

menuPanel.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenuOpen(false);
});

document.addEventListener('click', (event) => {
  if (
    menuToggle.getAttribute('aria-expanded') === 'true' &&
    !menuPanel.contains(event.target) &&
    !menuToggle.contains(event.target)
  ) {
    setMenuOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuOpen(false);
});
