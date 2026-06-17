// ===== HisaabKitaab - Expense & Income Tracker =====

// ===== Constants =====
const STORAGE_KEY = 'hisaabkitaab_transactions';
const CATEGORIES_KEY = 'hisaabkitaab_categories';
const THEME_KEY = 'hisaabkitaab_theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_ICONS = {
    // Income
    'Salary': '💰', 'Business': '💼', 'Freelance': '💻', 'Investment': '📈',
    'Rent Received': '🏠', 'Interest': '🏦', 'Gift': '🎁', 'Other Income': '💵',
    // Expense
    'Food': '🍽️', 'Groceries': '🛒', 'Transport': '🚗', 'Fuel': '⛽',
    'Shopping': '🛍️', 'Bills': '📃', 'Electricity': '⚡', 'Water': '💧',
    'Internet': '📶', 'Phone': '📱', 'Rent': '🏡', 'Medical': '🏥',
    'Education': '📚', 'Entertainment': '🎬', 'Travel': '✈️', 'Clothing': '👕',
    'Personal': '👤', 'Household': '🏠', 'Maintenance': '🔧', 'Insurance': '🛡️',
    'Tax': '📋', 'Charity': '❤️', 'Other Expense': '📦'
};

const DEFAULT_CATEGORIES = {
    income: ['Salary', 'Business', 'Freelance', 'Investment', 'Rent Received', 'Interest', 'Gift', 'Other Income'],
    expense: ['Food', 'Groceries', 'Transport', 'Fuel', 'Shopping', 'Bills', 'Electricity', 'Water',
        'Internet', 'Phone', 'Rent', 'Medical', 'Education', 'Entertainment', 'Travel', 'Clothing',
        'Personal', 'Household', 'Maintenance', 'Insurance', 'Tax', 'Charity', 'Other Expense']
};

// ===== State =====
let transactions = [];
let categories = { income: [], expense: [] };
let currentType = 'income';
let deleteTargetId = null;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadCategories();
    loadTransactions();
    setGreeting();
    setDefaultDate();
    populateFilters();
    renderDashboard();
    renderHistory();
    renderReports();
    renderCategories();

    // Event listeners
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('filter-month').addEventListener('change', renderHistory);
    document.getElementById('filter-year').addEventListener('change', renderHistory);
    document.getElementById('filter-type').addEventListener('change', renderHistory);
    document.getElementById('search-input').addEventListener('input', renderHistory);
});

// ===== Theme =====
function loadTheme() {
    const theme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
}

// ===== Data Management =====
function loadTransactions() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        transactions = data ? JSON.parse(data) : [];
    } catch (e) {
        transactions = [];
    }
}

function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadCategories() {
    try {
        const data = localStorage.getItem(CATEGORIES_KEY);
        categories = data ? JSON.parse(data) : { ...DEFAULT_CATEGORIES };
    } catch (e) {
        categories = { ...DEFAULT_CATEGORIES };
    }
    // Ensure arrays exist
    if (!categories.income) categories.income = [...DEFAULT_CATEGORIES.income];
    if (!categories.expense) categories.expense = [...DEFAULT_CATEGORIES.expense];
}

function saveCategories() {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

// ===== Greeting =====
function setGreeting() {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = 'Good Morning ☀️';
    else if (hour < 17) greeting = 'Good Afternoon 🌤️';
    else if (hour < 21) greeting = 'Good Evening 🌅';
    else greeting = 'Good Night 🌙';

    document.getElementById('greeting-text').textContent = greeting;

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('greeting-date').textContent = today.toLocaleDateString('en-IN', options);
}

// ===== Navigation =====
function switchTab(page) {
    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

    // Refresh data on page switch
    if (page === 'history') renderHistory();
    if (page === 'reports') renderReports();
}

// ===== Modal =====
function openAddModal(editId = null) {
    const modal = document.getElementById('add-modal');
    const form = document.getElementById('transaction-form');

    if (editId) {
        const txn = transactions.find(t => t.id === editId);
        if (!txn) return;

        document.getElementById('modal-title').textContent = 'Edit Transaction';
        document.getElementById('save-btn').innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Update Transaction`;
        document.getElementById('edit-id').value = editId;
        setTransactionType(txn.type);
        document.getElementById('txn-amount').value = txn.amount;
        document.getElementById('txn-category').value = txn.category;
        document.getElementById('txn-description').value = txn.description || '';
        document.getElementById('txn-date').value = txn.date;
    } else {
        document.getElementById('modal-title').textContent = 'Add Transaction';
        document.getElementById('save-btn').innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Save Transaction`;
        form.reset();
        document.getElementById('edit-id').value = '';
        setTransactionType('income');
        setDefaultDate();
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus amount after animation
    setTimeout(() => {
        document.getElementById('txn-amount').focus();
    }, 350);
}

function closeAddModal() {
    const modal = document.getElementById('add-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function closeModalOutside(event) {
    if (event.target === event.currentTarget) {
        closeAddModal();
    }
}

function setDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('txn-date').value = `${yyyy}-${mm}-${dd}`;
}

// ===== Transaction Type Toggle =====
function setTransactionType(type) {
    currentType = type;
    const incomeBtn = document.getElementById('toggle-income');
    const expenseBtn = document.getElementById('toggle-expense');

    incomeBtn.classList.toggle('active', type === 'income');
    expenseBtn.classList.toggle('active', type === 'expense');

    updateCategoryDropdown();
}

function updateCategoryDropdown() {
    const select = document.getElementById('txn-category');
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select category</option>';

    const cats = categories[currentType] || [];
    cats.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        const icon = CATEGORY_ICONS[cat] || (currentType === 'income' ? '💰' : '📦');
        option.textContent = `${icon} ${cat}`;
        select.appendChild(option);
    });

    // Restore value if it exists in new list
    if (cats.includes(currentValue)) {
        select.value = currentValue;
    }
}

// ===== Save Transaction =====
function saveTransaction(event) {
    event.preventDefault();

    const editId = document.getElementById('edit-id').value;
    const amount = parseFloat(document.getElementById('txn-amount').value);
    const category = document.getElementById('txn-category').value;
    const description = document.getElementById('txn-description').value.trim();
    const date = document.getElementById('txn-date').value;

    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount');
        return;
    }

    if (!category) {
        showToast('Please select a category');
        return;
    }

    if (!date) {
        showToast('Please select a date');
        return;
    }

    const transaction = {
        id: editId || generateId(),
        type: currentType,
        amount: amount,
        category: category,
        description: description,
        date: date,
        createdAt: editId ? (transactions.find(t => t.id === editId)?.createdAt || Date.now()) : Date.now(),
        updatedAt: Date.now()
    };

    if (editId) {
        const index = transactions.findIndex(t => t.id === editId);
        if (index !== -1) {
            transactions[index] = transaction;
        }
        showToast('Transaction updated! ✅');
    } else {
        transactions.push(transaction);
        showToast('Transaction saved! ✅');
    }

    saveTransactions();
    closeAddModal();
    renderDashboard();
    renderHistory();
    renderReports();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ===== Delete Transaction =====
function openDeleteModal(id) {
    deleteTargetId = id;
    document.getElementById('delete-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    deleteTargetId = null;
    document.getElementById('delete-modal').classList.remove('active');
    document.body.style.overflow = '';
}

function confirmDelete() {
    if (!deleteTargetId) return;

    transactions = transactions.filter(t => t.id !== deleteTargetId);
    saveTransactions();
    closeDeleteModal();
    renderDashboard();
    renderHistory();
    renderReports();
    showToast('Transaction deleted! 🗑️');
}

// ===== Render Dashboard =====
function renderDashboard() {
    const today = new Date();
    const todayStr = formatDateISO(today);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Today's totals
    const todayTxns = transactions.filter(t => t.date === todayStr);
    const todayIncome = todayTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const todayExpense = todayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // Monthly totals
    const monthTxns = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const monthExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = monthIncome - monthExpense;

    document.getElementById('today-income').textContent = formatCurrency(todayIncome);
    document.getElementById('today-expense').textContent = formatCurrency(todayExpense);
    document.getElementById('month-income').textContent = formatCurrency(monthIncome);
    document.getElementById('month-expense').textContent = formatCurrency(monthExpense);
    document.getElementById('balance-amount').textContent = formatCurrency(balance);
    document.getElementById('balance-amount').className = `balance-amount ${balance >= 0 ? '' : 'negative'}`;

    // Recent transactions (last 7)
    const sorted = [...transactions].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        return dateCompare !== 0 ? dateCompare : b.createdAt - a.createdAt;
    });

    const recent = sorted.slice(0, 7);
    const container = document.getElementById('recent-transactions');

    if (recent.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="3" width="20" height="18" rx="2"/>
                    <path d="M2 8h20M8 3v18"/>
                </svg>
                <p>No transactions yet</p>
                <span>Tap + to add your first entry</span>
            </div>`;
        return;
    }

    container.innerHTML = recent.map((txn, i) => createTransactionHTML(txn, i)).join('');
}

// ===== Render History =====
function renderHistory() {
    const month = parseInt(document.getElementById('filter-month').value);
    const year = parseInt(document.getElementById('filter-year').value);
    const type = document.getElementById('filter-type').value;
    const search = document.getElementById('search-input').value.toLowerCase().trim();

    let filtered = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    if (type !== 'all') {
        filtered = filtered.filter(t => t.type === type);
    }

    if (search) {
        filtered = filtered.filter(t =>
            t.category.toLowerCase().includes(search) ||
            (t.description && t.description.toLowerCase().includes(search))
        );
    }

    // Sort by date descending, then by creation time descending
    filtered.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        return dateCompare !== 0 ? dateCompare : b.createdAt - a.createdAt;
    });

    // Summary
    const allMonthTxns = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });
    const totalIncome = allMonthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = allMonthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;

    document.getElementById('history-income').textContent = formatCurrency(totalIncome);
    document.getElementById('history-expense').textContent = formatCurrency(totalExpense);
    document.getElementById('history-balance').textContent = formatCurrency(balance);
    document.getElementById('history-balance').className = `month-summary-value ${balance >= 0 ? 'positive' : 'negative'}`;

    // Render transactions grouped by date
    const container = document.getElementById('history-transactions');

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="3" width="20" height="18" rx="2"/>
                    <path d="M2 8h20M8 3v18"/>
                </svg>
                <p>No transactions found</p>
                <span>Try changing your filters</span>
            </div>`;
        return;
    }

    let html = '';
    let lastDate = '';

    filtered.forEach((txn, i) => {
        if (txn.date !== lastDate) {
            lastDate = txn.date;
            const dateObj = new Date(txn.date + 'T00:00:00');
            const dateStr = dateObj.toLocaleDateString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'short'
            });
            html += `<div class="date-separator">${dateStr}</div>`;
        }
        html += createTransactionHTML(txn, i, true);
    });

    container.innerHTML = html;
}

// ===== Create Transaction HTML =====
function createTransactionHTML(txn, index, showActions = false) {
    const icon = CATEGORY_ICONS[txn.category] || (txn.type === 'income' ? '💰' : '📦');
    const sign = txn.type === 'income' ? '+' : '-';
    const dateObj = new Date(txn.date + 'T00:00:00');
    const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    const actionsHTML = showActions ? `
        <div class="txn-actions">
            <button class="icon-btn" onclick="event.stopPropagation(); openAddModal('${txn.id}')" aria-label="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn delete-btn" onclick="event.stopPropagation(); openDeleteModal('${txn.id}')" aria-label="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
        </div>` : '';

    return `
        <div class="transaction-item" style="animation-delay: ${index * 0.04}s" onclick="openAddModal('${txn.id}')">
            <div class="txn-icon ${txn.type}">${icon}</div>
            <div class="txn-info">
                <div class="txn-category">${txn.category}</div>
                <div class="txn-desc">${txn.description || 'No description'}</div>
            </div>
            <div class="txn-right">
                <div class="txn-amount ${txn.type}">${sign}${formatCurrency(txn.amount)}</div>
                <div class="txn-date">${dateStr}</div>
            </div>
            ${actionsHTML}
        </div>`;
}

// ===== Render Reports =====
function renderReports() {
    renderMonthlyOverview();
}

function renderMonthlyOverview() {
    const container = document.getElementById('monthly-overview');
    
    // Get all unique month/year combos
    const monthMap = new Map();
    
    transactions.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthMap.has(key)) {
            monthMap.set(key, { year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 });
        }
        const entry = monthMap.get(key);
        if (t.type === 'income') entry.income += t.amount;
        else entry.expense += t.amount;
    });

    const months = Array.from(monthMap.values()).sort((a, b) => {
        return (b.year * 12 + b.month) - (a.year * 12 + a.month);
    });

    if (months.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>No data yet</p>
                <span>Start adding transactions to see reports</span>
            </div>`;
        return;
    }

    container.innerHTML = months.map(m => {
        const balance = m.income - m.expense;
        const balanceClass = balance >= 0 ? 'positive' : 'negative';
        return `
            <div class="monthly-card">
                <div class="monthly-card-month">
                    <span class="month-name">${MONTHS_SHORT[m.month]}</span>
                    <span class="month-year">${m.year}</span>
                </div>
                <div class="monthly-card-info">
                    <div class="monthly-card-row">
                        <span class="monthly-card-label">Income</span>
                        <span class="monthly-card-value income-text">${formatCurrency(m.income)}</span>
                    </div>
                    <div class="monthly-card-row">
                        <span class="monthly-card-label">Expense</span>
                        <span class="monthly-card-value expense-text">${formatCurrency(m.expense)}</span>
                    </div>
                    <div class="monthly-card-row">
                        <span class="monthly-card-label">Balance</span>
                        <span class="monthly-card-value ${balanceClass}">${formatCurrency(balance)}</span>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// ===== Filters =====
function populateFilters() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Month dropdowns
    const monthSelects = ['filter-month', 'report-month'];
    monthSelects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = MONTHS.map((m, i) =>
            `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${m}</option>`
        ).join('');
    });

    // Year dropdowns (5 years range)
    const yearSelects = ['filter-year', 'report-year'];
    yearSelects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const years = [];
        for (let y = currentYear + 1; y >= currentYear - 4; y--) {
            years.push(`<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`);
        }
        select.innerHTML = years.join('');
    });
}

// ===== Download Monthly Sheet =====
function downloadMonthlySheet() {
    const month = parseInt(document.getElementById('report-month').value);
    const year = parseInt(document.getElementById('report-year').value);

    const monthTxns = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    if (monthTxns.length === 0) {
        showToast('No transactions found for this month');
        return;
    }

    // Sort by date
    monthTxns.sort((a, b) => a.date.localeCompare(b.date));

    // Create CSV
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (₹)'];
    const rows = monthTxns.map(t => {
        const dateObj = new Date(t.date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        return [
            dateStr,
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
            `"${t.category}"`,
            `"${(t.description || '').replace(/"/g, '""')}"`,
            t.type === 'income' ? t.amount.toFixed(2) : `-${t.amount.toFixed(2)}`
        ].join(',');
    });

    // Add summary
    const totalIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;

    rows.push('');
    rows.push(`"Total Income",,,,${totalIncome.toFixed(2)}`);
    rows.push(`"Total Expense",,,,-${totalExpense.toFixed(2)}`);
    rows.push(`"Balance",,,,${balance.toFixed(2)}`);

    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HisaabKitaab_${MONTHS[month]}_${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Sheet downloaded! 📥`);
}

// ===== Export All Data =====
function exportAllData() {
    if (transactions.length === 0) {
        showToast('No data to export');
        return;
    }

    const data = {
        exportDate: new Date().toISOString(),
        transactions: transactions,
        categories: categories
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HisaabKitaab_Backup_${formatDateISO(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Data exported! 📦');
}

// ===== Clear All Data =====
function clearAllData() {
    if (!confirm('⚠️ Are you sure you want to delete ALL transactions? This cannot be undone!')) {
        return;
    }

    if (!confirm('This is your LAST chance. All data will be permanently deleted. Continue?')) {
        return;
    }

    transactions = [];
    saveTransactions();
    renderDashboard();
    renderHistory();
    renderReports();
    showToast('All data cleared! 🗑️');
}

// ===== Categories Management =====
function renderCategories() {
    renderCategoryTags('income');
    renderCategoryTags('expense');
}

function renderCategoryTags(type) {
    const container = document.getElementById(`${type}-categories`);
    container.innerHTML = categories[type].map(cat => {
        const icon = CATEGORY_ICONS[cat] || (type === 'income' ? '💰' : '📦');
        return `
            <span class="category-tag">
                ${icon} ${cat}
                <button class="remove-cat" onclick="removeCategory('${type}', '${cat}')" aria-label="Remove ${cat}">×</button>
            </span>`;
    }).join('');
}

function addCategory(type) {
    const input = document.getElementById(`new-${type}-cat`);
    const name = input.value.trim();

    if (!name) {
        showToast('Please enter a category name');
        return;
    }

    if (categories[type].includes(name)) {
        showToast('Category already exists');
        return;
    }

    categories[type].push(name);
    saveCategories();
    renderCategories();
    input.value = '';
    showToast(`Category "${name}" added! ✅`);
}

function removeCategory(type, name) {
    // Check if category is in use
    const inUse = transactions.some(t => t.type === type && t.category === name);
    if (inUse) {
        if (!confirm(`"${name}" is used in some transactions. Remove anyway?`)) {
            return;
        }
    }

    categories[type] = categories[type].filter(c => c !== name);
    saveCategories();
    renderCategories();
    showToast(`Category "${name}" removed`);
}

// ===== Toast =====
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ===== Utility Functions =====
function formatCurrency(amount) {
    const abs = Math.abs(amount);
    // Indian number formatting
    if (abs >= 10000000) {
        return `₹${(abs / 10000000).toFixed(2)}Cr`;
    }
    if (abs >= 100000) {
        return `₹${(abs / 100000).toFixed(2)}L`;
    }
    return '₹' + abs.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatDateISO(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// ===== Service Worker Registration =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {
            // Service worker registration failed - app still works fine
        });
    });
}
