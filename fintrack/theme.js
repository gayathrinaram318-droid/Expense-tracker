const THEME_KEY = 'fintrackTheme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body && document.body.setAttribute('data-theme', theme);
  updateThemeIcons(theme);
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    console.warn('Unable to save theme preference:', error);
  }
}

function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (error) {
    return null;
  }
}

function updateThemeIcons(theme) {
  document.querySelectorAll('#themeToggle').forEach((button) => {
    const sunIcon = button.querySelector('.icon-sun');
    const moonIcon = button.querySelector('.icon-moon');

    if (!sunIcon || !moonIcon) {
      return;
    }

    if (theme === 'light') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  });
}

function resolvePreferredTheme() {
  const savedTheme = getSavedTheme();
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'dark';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme);
  saveTheme(nextTheme);
}

function initThemeToggle() {
  const themeButtons = document.querySelectorAll('#themeToggle');

  themeButtons.forEach((button) => {
    button.addEventListener('click', toggleTheme);
  });
}

function initTheme() {
  const theme = resolvePreferredTheme();
  applyTheme(theme);
  initThemeToggle();
}

document.addEventListener('DOMContentLoaded', initTheme);
