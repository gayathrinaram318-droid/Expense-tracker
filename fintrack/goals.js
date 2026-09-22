(function () {
const GOALS_CURRENT_KEY = 'fintrackCurrentUser';
const GOALS_STORAGE_KEY = 'fintrackUsers';

const getUsers = () => JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY) || '[]');
const getCurrentUserKey = () => localStorage.getItem(GOALS_CURRENT_KEY);
const findUser = (email) => getUsers().find((user) => user.email === email);

const redirectIfUnauthenticated = () => {
  if (!getCurrentUserKey()) {
    window.location.href = 'login.html';
  }
};

const saveUsers = (users) => localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(users));

const getUser = () => {
  const email = getCurrentUserKey();
  if (!email) return null;
  return findUser(email) || null;
};

const formatCurrency = (value) => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
};

const initMobileMenu = () => {
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.getElementById('mobileMenuToggle');
  const closeBtn = document.getElementById('mobileMenuClose');
  const links = sidebar ? sidebar.querySelectorAll('nav a') : [];

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.add('mobile-open');
      document.body.classList.add('mobile-nav-open');
    });
  }

  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      document.body.classList.remove('mobile-nav-open');
    });
  }

  links.forEach((link) => {
    link.addEventListener('click', () => {
      if (sidebar) {
        sidebar.classList.remove('mobile-open');
        document.body.classList.remove('mobile-nav-open');
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (!sidebar || !document.body.classList.contains('mobile-nav-open')) return;
    const target = event.target;
    if (sidebar.contains(target) || (toggle && toggle.contains(target))) return;

    sidebar.classList.remove('mobile-open');
    document.body.classList.remove('mobile-nav-open');
  });
};

const renderGoalPage = () => {
  redirectIfUnauthenticated();
  const user = getUser();
  if (!user) return;
  if (!user.goals) user.goals = { title: 'Emergency Fund', target: 2000, progress: 0 };
  const goal = user.goals;

  document.getElementById('goalTitle').value = goal.title;
  document.getElementById('goalTarget').value = goal.target;
  document.getElementById('goalProgress').value = goal.progress;

  const percent = goal.target ? Math.round((goal.progress / goal.target) * 100) : 0;
  document.getElementById('goalAmount').textContent = formatCurrency(goal.target);
  document.getElementById('goalSaved').textContent = formatCurrency(goal.progress);
  document.getElementById('goalComplete').textContent = `${percent}%`;
  document.getElementById('goalBar').style.width = `${Math.min(percent, 100)}%`;
  document.getElementById('goalText').textContent =
    percent >= 100
      ? 'Goal achieved! Great work, keep building your savings.'
      : `You are ${percent}% toward your goal. Stay consistent to close the gap.`;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(GOALS_CURRENT_KEY);
    window.location.href = 'login.html';
  });
};

const handleGoalForm = () => {
  const form = document.getElementById('goalForm');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const user = getUser();
    if (!user) return;

    const title = document.getElementById('goalTitle').value.trim();
    const target = Number(document.getElementById('goalTarget').value);
    const progress = Number(document.getElementById('goalProgress').value);
    if (!title || !target || target <= 0 || progress < 0) return;

    user.goals = { title, target, progress: Math.min(progress, target) };
    const users = getUsers();
    const index = users.findIndex((item) => item.email === user.email);
    if (index !== -1) {
      users[index] = user;
      saveUsers(users);
      renderGoalPage();
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  renderGoalPage();
  handleGoalForm();
  if (typeof initMobileMenu === 'function') initMobileMenu();
});
})();
