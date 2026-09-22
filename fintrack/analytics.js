(function () {
const ANALYTICS_CURRENT_KEY = 'fintrackCurrentUser';
const ANALYTICS_STORAGE_KEY = 'fintrackUsers';

const getUsers = () => JSON.parse(localStorage.getItem(ANALYTICS_STORAGE_KEY) || '[]');
const getCurrentUserKey = () => localStorage.getItem(ANALYTICS_CURRENT_KEY);
const findUser = (email) => getUsers().find((user) => user.email === email);

const redirectIfUnauthenticated = () => {
  if (!getCurrentUserKey()) {
    window.location.href = 'login.html';
  }
};

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

const getCategoryTotals = (transactions) => {
  return transactions.reduce((acc, tx) => {
    if (tx.type === 'expense') {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    }
    return acc;
  }, {});
};

const getMonthlyTrend = (transactions) => {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = Array(12).fill(0);
  transactions.forEach((tx) => {
    if (tx.type !== 'expense') return;
    const month = new Date(tx.date).getMonth();
    data[month] += tx.amount;
  });
  return { labels, data };
};

const renderAnalytics = () => {
  redirectIfUnauthenticated();
  const user = getUser();
  if (!user) return;

  const categoryTotals = getCategoryTotals(user.transactions || []);
  const categories = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);

  const topCategory = categories.length
    ? categories.reduce((max, category) => (categoryTotals[category] > categoryTotals[max] ? category : max), categories[0])
    : 'No data yet';
  document.getElementById('topCategory').textContent = topCategory;

  const avgExpense = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  document.getElementById('averageExpense').textContent = formatCurrency(avgExpense);

  const budgetUsed = (user.transactions || []).reduce((sum, tx) => (tx.type === 'expense' ? sum + tx.amount : sum), 0);
  const healthLabel = budgetUsed > (user.budgetLimit || 0) ? 'Alert' : 'Healthy';
  document.getElementById('budgetHealth').textContent = healthLabel;

  const categoryCtx = document.getElementById('categoryChart').getContext('2d');
  const trendCtx = document.getElementById('trendChart').getContext('2d');

  new Chart(categoryCtx, {
    type: 'pie',
    data: {
      labels: categories.length ? categories : ['No expenses'],
      datasets: [
        {
          data: values.length ? values : [1],
          backgroundColor: ['#7b5cff', '#2ab6ff', '#ff7d5b', '#32d3a4', '#ffc75e', '#ff5c7a'],
          hoverOffset: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#d8e0ff' },
        },
      },
    },
  });

  const trend = getMonthlyTrend(user.transactions || []);
  new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: trend.labels,
      datasets: [
        {
          label: 'Expenses',
          data: trend.data,
          borderColor: '#7b5cff',
          backgroundColor: 'rgba(123, 92, 255, 0.18)',
          tension: 0.35,
          fill: true,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#b8c4ff' } },
        y: { ticks: { color: '#b8c4ff' }, beginAtZero: true },
      },
      plugins: {
        legend: { labels: { color: '#d8e0ff' } },
      },
    },
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(ANALYTICS_CURRENT_KEY);
    window.location.href = 'login.html';
  });
};

document.addEventListener('DOMContentLoaded', () => {
  renderAnalytics();
  if (typeof initMobileMenu === 'function') initMobileMenu();
});
})();
