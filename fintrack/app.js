import { getCurrentUser, getUserData, saveUserData, signOutUser, removeCurrentUserKey } from './auth.js';

const getCurrentUserKey = () => {
  const user = getCurrentUser();
  return user ? user.email : null;
};

const redirectIfUnauthenticated = () => {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = 'login.html';
    return false;
  }

  return true;
};

// Toast Notification System
const showToast = (message, type = 'success', duration = 3000) => {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg = {
    success: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    delete: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
    error: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
  };

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg[type] || iconSvg.success}</div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
};

const showSuccessToast = (message) => showToast(message, 'success', 3000);
const showDeleteToast = (message) => showToast(message, 'delete', 3000);
const showErrorToast = (message) => showToast(message, 'error', 3000);

const hideLoadingScreen = () => {
  const loading = document.getElementById('loadingScreen');
  if (!loading) return;
  loading.classList.add('loading-fade-out');
  setTimeout(() => {
    loading.remove();
  }, 600);
};

const initDashboard = async () => {
  const isAuthenticated = redirectIfUnauthenticated();
  if (!isAuthenticated) return;

  let user = getUserData();

  if (!user) {
    hideLoadingScreen();
    console.error('User data not available. Redirecting to login.');
    window.location.href = 'login.html';
    return;
  }

  if (!Array.isArray(user.transactions)) user.transactions = [];
  if (!user.goals) user.goals = { title: 'Save Smart', target: 0, progress: 0 };
  if (!user.lastInsight) user.lastInsight = '';

  saveUserData(user);
  attachDashboardHandlers(user);
  hideLoadingScreen();
};

const getCategoryClass = (category) => {
  const categoryMap = {
    'Salary': 'category-salary',
    'Shopping': 'category-shopping',
    'Food': 'category-food',
    'Bills': 'category-bills',
    'Transport': 'category-transport',
    'Health': 'category-health',
    'Entertainment': 'category-entertainment',
    'pocket money': 'category-pocket',
  };
  return categoryMap[category] || 'category-default';
};

const updateCategoryDropdownStyle = () => {
  const categorySelect = document.getElementById('transactionCategory');
  if (!categorySelect) return;
  
  const applyStyle = () => {
    const selectedValue = categorySelect.value;
    const categoryClass = getCategoryClass(selectedValue);
    
    // Remove all category classes
    categorySelect.className = categorySelect.className.replace(/category-\w+/g, '').trim();
    
    // Add the new category class
    categorySelect.classList.add(categoryClass);
  };
  
  categorySelect.addEventListener('change', applyStyle);
  categorySelect.addEventListener('input', applyStyle);
  applyStyle();
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

const setDefaultDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  document.getElementById('transactionDate').value = `${year}-${month}-${day}`;
};

const attachDashboardHandlers = (user) => {
  document.getElementById('userName').textContent = user.name || 'FinTrack User';
  setDefaultDate();

  const form = document.getElementById('transactionForm');
  const searchInput = document.getElementById('transactionSearch');
  const logoutBtn = document.getElementById('logoutBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const currentUser = getUserData();
    if (currentUser) addTransaction(currentUser);
  });

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
      const currentUser = getUserData();
      if (currentUser) generateReportPdf(currentUser);
    });
  }

  searchInput.addEventListener('input', () => {
    const currentUser = getUserData();
    if (currentUser) renderTransactions(currentUser);
  });
  
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOutUser();
      removeCurrentUserKey();
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout error:', error);
      removeCurrentUserKey();
      window.location.href = 'login.html';
    }
  });

  updateCategoryDropdownStyle();
  initMobileMenu();
  updateDashboard(user);
};

const addTransaction = (user) => {
  const desc = document.getElementById('transactionDesc').value.trim();
  const amount = parseFloat(document.getElementById('transactionAmount').value);
  const type = document.getElementById('transactionType').value;
  const category = document.getElementById('transactionCategory').value;
  const dateValue = document.getElementById('transactionDate').value;

  if (!desc || Number.isNaN(amount) || !dateValue) return;

  const transaction = {
    id: Date.now().toString(),
    description: desc,
    amount: Math.abs(amount),
    type,
    category,
    date: dateValue,
  };
  user.transactions.unshift(transaction);
  saveUserData(user);
  document.getElementById('transactionForm').reset();
  setDefaultDate();
  updateDashboard(user);
  showSuccessToast(`Added: ${desc} • ${formatCurrency(amount)}`);
};

const formatCurrency = (value) => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
};

const updateDashboard = (user) => {
  const income = user.transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = user.transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const balance = income - expense;
  const monthlySpend = getMonthlySpend(user.transactions);

  document.getElementById('totalIncome').textContent = formatCurrency(income);
  document.getElementById('totalExpense').textContent = formatCurrency(expense);
  document.getElementById('totalBalance').textContent = formatCurrency(balance);
  document.getElementById('monthlySpend').textContent = formatCurrency(monthlySpend);

  const goalTitle = user.goals.title || 'No Goal Set';
  const progress = user.goals.target ? Math.min(user.goals.progress, user.goals.target) : 0;
  const progressPercent = user.goals.target ? Math.round((progress / user.goals.target) * 100) : 0;

  document.getElementById('goalTitle').textContent = goalTitle;
  document.getElementById('goalProgressText').textContent = user.goals.target
    ? `${progressPercent}% toward ${formatCurrency(user.goals.target)}`
    : 'Set a goal to start saving smartly.';
  document.getElementById('savingsProgress').style.width = `${progressPercent}%`;

  const insight = createInsight(user, expense, income);
  document.getElementById('insightText').textContent = insight;

  const patternText = getSpendingPattern(user.transactions);
  const compareText = getMonthlyExpenseComparison(user.transactions);
  const topCategory = getTopSpendingCategory(user.transactions);
  const warningInfo = getOverspendingWarning(user, expense, income);

  const patternEl = document.getElementById('patternText');
  const compareEl = document.getElementById('compareText');
  const categoryEl = document.getElementById('categoryText');
  const warningEl = document.getElementById('insightWarning');

  if (patternEl) patternEl.textContent = patternText;
  if (compareEl) compareEl.textContent = compareText;
  if (categoryEl) categoryEl.textContent = topCategory ? `${topCategory.category} • ${formatCurrency(topCategory.amount)}` : 'No expenses yet';
  if (warningEl) {
    warningEl.textContent = warningInfo.message;
    warningEl.classList.toggle('warning', warningInfo.level === 'warning');
    warningEl.classList.toggle('danger', warningInfo.level === 'danger');
    warningEl.classList.toggle('note', warningInfo.level === 'none');
    warningEl.classList.toggle('alert-visible', warningInfo.level !== 'none');
    warningEl.style.display = warningInfo.level === 'none' ? 'none' : 'inline-flex';
  }

  user.lastInsight = insight;
  saveUserData(user);

  renderTransactions(user);
};

const getMonthlySpend = (transactions) => {
  const currentMonth = new Date().getMonth();
  return transactions
    .filter((tx) => {
      const txMonth = new Date(tx.date).getMonth();
      return tx.type === 'expense' && txMonth === currentMonth;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
};

const getEffectiveBudget = (user, totalIncome) => {
  const customBudget = Number(user.budgetLimit);
  if (!Number.isNaN(customBudget) && customBudget > 0 && customBudget !== 1200) {
    return customBudget;
  }
  return totalIncome;
};

const createInsight = (user, totalExpense, totalIncome) => {
  const limit = getEffectiveBudget(user, totalIncome);
  if (!limit) {
    return 'Set a monthly budget or record income to unlock smart spending alerts.';
  }

  const ratio = totalExpense / limit;
  if (ratio >= 1) {
    return 'Danger: Monthly expenses exceeded your budget. Review your spending now.';
  }
  if (ratio >= 0.8) {
    return 'Warning: You have used 80% of your budget.';
  }
  return 'Your finances are stable. Keep tracking to stay on course.';
};

const getSpendingPattern = (transactions) => {
  const expenses = transactions.filter((tx) => tx.type === 'expense');
  if (!expenses.length) return 'No spending patterns available yet.';

  const today = new Date();
  const currentMonth = today.getMonth();
  const lastMonth = new Date(today.getFullYear(), currentMonth - 1, 1).getMonth();
  const currentSpend = expenses
    .filter((tx) => new Date(tx.date).getMonth() === currentMonth)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const previousSpend = expenses
    .filter((tx) => new Date(tx.date).getMonth() === lastMonth)
    .reduce((sum, tx) => sum + tx.amount, 0);

  if (previousSpend === 0) {
    return currentSpend > 0
      ? 'Spending started this month. Keep tracking every category for a clear view.'
      : 'No expense activity yet this month.';
  }

  const change = (currentSpend - previousSpend) / previousSpend;
  if (change >= 0.2) return 'Spending is rising. Review variable costs and non-essential purchases.';
  if (change <= -0.2) return 'Good progress: your expense trend has improved significantly.';
  return 'Spending is steady compared to last month.';
};

const getMonthlyExpenseComparison = (transactions) => {
  const expenses = transactions.filter((tx) => tx.type === 'expense');
  if (!expenses.length) return 'No expenses available for monthly comparison.';

  const today = new Date();
  const currentMonth = today.getMonth();
  const lastMonth = new Date(today.getFullYear(), currentMonth - 1, 1).getMonth();
  const currentSpend = expenses
    .filter((tx) => new Date(tx.date).getMonth() === currentMonth)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const previousSpend = expenses
    .filter((tx) => new Date(tx.date).getMonth() === lastMonth)
    .reduce((sum, tx) => sum + tx.amount, 0);

  if (previousSpend === 0) return 'No spend last month to compare yet.';

  const diff = currentSpend - previousSpend;
  const percent = Math.round((Math.abs(diff) / previousSpend) * 100);
  if (diff > 0) return `${percent}% higher than last month.`;
  if (diff < 0) return `${percent}% lower than last month.`;
  return 'Expenses are unchanged from last month.';
};

const getTopSpendingCategory = (transactions) => {
  const expenses = transactions.filter((tx) => tx.type === 'expense');
  if (!expenses.length) return null;
  const totals = expenses.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});
  const topCategory = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  return topCategory ? { category: topCategory[0], amount: topCategory[1] } : null;
};

const getOverspendingWarning = (user, totalExpense, totalIncome) => {
  const limit = getEffectiveBudget(user, totalIncome);
  if (!limit) {
    return {
      message: 'No budget or income set. Add one to receive alerts.',
      level: 'none',
    };
  }

  const ratio = totalExpense / limit;
  if (ratio >= 1) {
    return {
      message: 'Danger: Monthly expenses exceeded your budget.',
      level: 'danger',
    };
  }
  if (ratio >= 0.8) {
    return {
      message: 'Warning: You have used 80% of your budget.',
      level: 'warning',
    };
  }

  return {
    message: 'Budget healthy: you are within a safe spending range.',
    level: 'none',
  };
};

const renderTransactions = (user) => {
  const container = document.getElementById('transactionList');
  const wrapper = document.querySelector('.transaction-table-wrapper');
  const search = document.getElementById('transactionSearch').value.toLowerCase();

  const filtered = user.transactions.filter((tx) => {
    return (
      tx.description.toLowerCase().includes(search) ||
      tx.category.toLowerCase().includes(search) ||
      tx.type.toLowerCase().includes(search)
    );
  });

  if (filtered.length === 0 && user.transactions.length === 0) {
    container.innerHTML = '';
    wrapper.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="currentColor" stroke-width="2" opacity="0.2"/>
            <path d="M32 28H56C57.1046 28 58 28.8954 58 30V58C58 59.1046 57.1046 60 56 60H32C30.8954 60 30 59.1046 30 58V30C30 28.8954 30.8954 28 32 28Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M34 40L38 44L46 36" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="empty-state-content">
          <h3>No transactions yet</h3>
          <p>Start by adding your first income or expense to track your finances.</p>
          <button class="btn btn-primary empty-state-btn" onclick="document.querySelector('input#transactionDesc').focus(); document.querySelector('.add-transaction-card').scrollIntoView({ behavior: 'smooth' })">Add Your First Transaction</button>
        </div>
      </div>
    `;
  } else if (filtered.length === 0) {
    container.innerHTML = '';
    wrapper.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="28" stroke="currentColor" stroke-width="2" opacity="0.2"/>
            <path d="M20 30H40M30 20V40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="empty-state-content">
          <h3>No results found</h3>
          <p>Try adjusting your search terms to find your transactions.</p>
        </div>
      </div>
    `;
  } else {
    wrapper.innerHTML = `
      <table class="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="transactionList"></tbody>
      </table>
    `;
    const tbody = document.getElementById('transactionList');
    tbody.innerHTML = filtered
      .map((tx) => {
        return `
          <tr>
            <td>${new Date(tx.date).toLocaleDateString()}</td>
            <td>${tx.description}</td>
            <td><span class="tag">${tx.category}</span></td>
            <td>${tx.type === 'expense' ? '-' : '+'}${formatCurrency(tx.amount)}</td>
            <td>${tx.type}</td>
            <td><button class="delete-btn" onclick="deleteTransaction('${tx.id}')">Delete</button></td>
          </tr>
        `;
      })
      .join('');
  }
};

const generateReportPdf = (user) => {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF export is unavailable right now. Please try again later.');
    return;
  }

  const income = user.transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = user.transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const balance = income - expense;

  const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = 60;

  // Brand header
  doc.setFillColor(107, 87, 255);
  doc.roundedRect(margin, y - 18, 140, 34, 10, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FinTrack', margin + 16, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Expense report', margin + 16, y + 18);

  doc.setFontSize(10);
  doc.setTextColor(99, 110, 130);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin + maxWidth, y + 6, { align: 'right' });

  y += 44;
  doc.setDrawColor(226, 229, 236);
  doc.line(margin, y, margin + maxWidth, y);
  y += 24;

  // Summary cards
  const cardWidth = (maxWidth - 32) / 3;
  const cardHeight = 90;
  const cardTitles = ['Balance', 'Income', 'Expenses'];
  const cardValues = [formatCurrency(balance), formatCurrency(income), formatCurrency(expense)];

  cardTitles.forEach((title, index) => {
    const x = margin + (cardWidth + 16) * index;
    doc.setFillColor(248, 249, 252);
    doc.roundedRect(x, y, cardWidth, cardHeight, 14, 14, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(84, 95, 114);
    doc.text(title, x + 14, y + 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(18, 28, 45);
    doc.text(cardValues[index], x + 14, y + 54);
  });

  y += cardHeight + 34;
  doc.setFillColor(107, 87, 255);
  doc.roundedRect(margin, y - 18, maxWidth, 24, 10, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Transaction History', margin + 14, y);

  y += 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 50, 72);

  const columnX = [margin, margin + 70, margin + 250, margin + 380, margin + 470];
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
  headers.forEach((text, index) => {
    doc.text(text, columnX[index], y);
  });

  y += 18;
  doc.setDrawColor(226, 229, 236);
  doc.line(margin, y - 8, margin + maxWidth, y - 8);

  const rows = user.transactions.slice(0, 28);
  rows.forEach((tx) => {
    const amountLabel = `${tx.type === 'expense' ? '-' : '+'}${formatCurrency(tx.amount)}`;
    const descriptionLines = doc.splitTextToSize(tx.description, 154);
    const rowHeight = Math.max(16, descriptionLines.length * 12);

    if (y + rowHeight > 760) {
      doc.addPage();
      y = 60;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
    }

    doc.text(new Date(tx.date).toLocaleDateString(), columnX[0], y);
    doc.text(descriptionLines, columnX[1], y);
    doc.text(tx.category, columnX[2], y);
    doc.text(amountLabel, columnX[3], y);
    doc.text(tx.type, columnX[4], y);
    y += rowHeight + 8;
  });

  if (!rows.length) {
    doc.setFontSize(10);
    doc.setTextColor(99, 110, 130);
    doc.text('No transactions available for this report.', margin, y);
  }

  const fileName = `FinTrack_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

const deleteTransaction = (id) => {
  const user = getUserData();
  if (!user) return;
  const transaction = user.transactions.find((tx) => tx.id === id);
  user.transactions = user.transactions.filter((tx) => tx.id !== id);
  saveUserData(user);
  updateDashboard(user);
  if (transaction) {
    showDeleteToast(`Deleted: ${transaction.description}`);
  }
};

const loadAnalyticsData = () => {
  redirectIfUnauthenticated();
  const user = getUserData();
  if (!user) return;
  if (!Array.isArray(user.transactions)) user.transactions = [];
  saveUserData(user);
  return user;
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
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result = months.map(() => 0);
  transactions.forEach((tx) => {
    const date = new Date(tx.date);
    const index = date.getMonth();
    if (tx.type === 'expense') result[index] += tx.amount;
  });
  return {
    labels: months,
    data: result,
  };
};

const initPageAuthRedirect = () => {
  if (typeof window === 'undefined') return;

  if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('signup.html')) {
    if (getCurrentUser()) {
      window.location.href = 'index.html';
    }
  }
};

// Export initDashboard for use as a module
export { initDashboard };

if (typeof window !== 'undefined') {
  window.deleteTransaction = deleteTransaction;
  initPageAuthRedirect();
}

// Note: initDashboard is called explicitly in HTML files as an ES module
// The auto-call is commented out to prevent double-initialization
// if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
//   initDashboard();
// }