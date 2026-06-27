// ===== HisaabKitaab v2.0 — Multi-Currency Expense & Income Tracker =====

// ===== Constants =====
const STORAGE_KEY = 'hisaabkitaab_transactions';
const CATEGORIES_KEY = 'hisaabkitaab_categories';
const THEME_KEY = 'hisaabkitaab_theme';
const RATES_KEY = 'hisaabkitaab_exchange_rates';
const RATES_TIMESTAMP_KEY = 'hisaabkitaab_rates_timestamp';
const RATES_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

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

// Supported currencies
const SUPPORTED_CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
    { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
    { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
    { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar' },
    { code: 'OMR', symbol: 'ر.ع', name: 'Omani Rial' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
];

// ===== State =====
let transactions = [];
let categories = { income: [], expense: [] };
let currentType = 'income';
let deleteTargetId = null;
let exchangeRates = {};
let pendingCSVTransactions = [];

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadCategories();
    loadTransactions();
    migrateOldTransactions();
    setGreeting();
    setDefaultDate();
    populateFilters();
    populateCurrencyDropdown();
    populateDashboardMonthSelect();
    renderDashboard();
    renderHistory();
    renderInsights();
    renderReports();
    renderCategories();
    fetchExchangeRates();
    setupUploadZone();

    // Event listeners
    document.getElementById('filter-month').addEventListener('change', renderHistory);
    document.getElementById('filter-year').addEventListener('change', renderHistory);
    document.getElementById('filter-type').addEventListener('change', renderHistory);
    document.getElementById('search-input').addEventListener('input', renderHistory);
});

// ===== Theme =====
function loadTheme() {
    const theme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeButtons(theme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeButtons(theme);

    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.content = theme === 'dark' ? '#1A1916' : '#FAF7F2';
    }
}

function updateThemeButtons(theme) {
    // Header pill
    const lightBtn = document.getElementById('theme-light-btn');
    const darkBtn = document.getElementById('theme-dark-btn');
    if (lightBtn && darkBtn) {
        lightBtn.classList.toggle('active', theme === 'light');
        darkBtn.classList.toggle('active', theme === 'dark');
    }

    // Settings pill
    const settingsLight = document.getElementById('settings-light-btn');
    const settingsDark = document.getElementById('settings-dark-btn');
    if (settingsLight && settingsDark) {
        settingsLight.classList.toggle('active', theme === 'light');
        settingsDark.classList.toggle('active', theme === 'dark');
    }
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
    if (!categories.income) categories.income = [...DEFAULT_CATEGORIES.income];
    if (!categories.expense) categories.expense = [...DEFAULT_CATEGORIES.expense];
}

function saveCategories() {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

// ===== Data Migration (v1 → v2) =====
function migrateOldTransactions() {
    let needsSave = false;
    transactions.forEach(t => {
        if (!t.originalCurrency) {
            t.originalCurrency = 'INR';
            t.originalAmount = t.amount;
            t.amountINR = t.amount;
            needsSave = true;
        }
    });
    if (needsSave) {
        saveTransactions();
    }
}

// ===== Exchange Rates =====
async function fetchExchangeRates() {
    // Check cache first
    const cached = localStorage.getItem(RATES_KEY);
    const cachedTimestamp = localStorage.getItem(RATES_TIMESTAMP_KEY);

    if (cached && cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp);
        if (age < RATES_CACHE_DURATION) {
            try {
                exchangeRates = JSON.parse(cached);
                return;
            } catch (e) {
                // Cache corrupted, fetch fresh
            }
        }
    }

    try {
        const response = await fetch('https://open.er-api.com/v6/latest/INR');
        if (!response.ok) throw new Error('API error');

        const data = await response.json();
        if (data && data.rates) {
            // We need rates TO INR, but API gives FROM INR
            // So rate for USD means 1 INR = X USD
            // We want 1 USD = ? INR = 1 / rate
            exchangeRates = {};
            for (const [code, rate] of Object.entries(data.rates)) {
                exchangeRates[code] = rate > 0 ? 1 / rate : 0;
            }
            exchangeRates['INR'] = 1;

            localStorage.setItem(RATES_KEY, JSON.stringify(exchangeRates));
            localStorage.setItem(RATES_TIMESTAMP_KEY, Date.now().toString());
        }
    } catch (e) {
        console.warn('Failed to fetch exchange rates, using fallback');
        // Fallback rates (approximate)
        if (Object.keys(exchangeRates).length === 0) {
            exchangeRates = {
                'INR': 1, 'USD': 84.5, 'EUR': 92, 'GBP': 107,
                'AED': 23, 'SGD': 63, 'AUD': 55, 'CAD': 62,
                'JPY': 0.55, 'CHF': 95, 'SAR': 22.5, 'QAR': 23.2,
                'KWD': 275, 'BHD': 224, 'OMR': 219, 'CNY': 11.6,
                'THB': 2.4, 'MYR': 19, 'NZD': 51, 'SEK': 8.2
            };
        }
    }
}

function convertToINR(amount, currencyCode) {
    if (currencyCode === 'INR') return amount;
    const rate = exchangeRates[currencyCode];
    if (!rate) return amount; // Fallback: return as-is
    return amount * rate;
}

function getExchangeRate(currencyCode) {
    if (currencyCode === 'INR') return 1;
    return exchangeRates[currencyCode] || 0;
}

// ===== Currency Dropdown =====
function populateCurrencyDropdown() {
    const select = document.getElementById('txn-currency');
    if (!select) return;
    select.innerHTML = SUPPORTED_CURRENCIES.map(c =>
        `<option value="${c.code}" ${c.code === 'INR' ? 'selected' : ''}>${c.code}</option>`
    ).join('');
}

function updateCurrencyPreview() {
    const amountInput = document.getElementById('txn-amount');
    const currencySelect = document.getElementById('txn-currency');
    const infoDiv = document.getElementById('currency-info');
    const rateDiv = document.getElementById('currency-rate');
    const convertedDiv = document.getElementById('currency-converted');

    const currency = currencySelect.value;
    const amount = parseFloat(amountInput.value) || 0;

    if (currency === 'INR' || !currency) {
        infoDiv.style.display = 'none';
        return;
    }

    const rate = getExchangeRate(currency);
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    const symbol = currencyInfo ? currencyInfo.symbol : currency;

    infoDiv.style.display = 'block';
    rateDiv.textContent = `1 ${currency} = ₹${rate.toFixed(2)}`;

    if (amount > 0) {
        const inrAmount = convertToINR(amount, currency);
        convertedDiv.textContent = `${symbol}${amount.toLocaleString()} = ${formatCurrency(inrAmount)}`;
    } else {
        convertedDiv.textContent = '';
    }
}

// ===== Greeting =====
function setGreeting() {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 17) greeting = 'Good Afternoon';
    else if (hour < 21) greeting = 'Good Evening';
    else greeting = 'Good Night';

    document.getElementById('greeting-text').textContent = greeting;

    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('greeting-date').textContent = today.toLocaleDateString('en-IN', options);
}

// ===== Navigation =====
function switchTab(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

    if (page === 'history') renderHistory();
    if (page === 'insights') renderInsights();
    if (page === 'reports') renderReports();
}

// ===== Dashboard Month Selector =====
function populateDashboardMonthSelect() {
    const select = document.getElementById('dashboard-month-select');
    if (!select) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Show last 12 months
    const options = [];
    for (let i = 0; i < 12; i++) {
        let m = currentMonth - i;
        let y = currentYear;
        if (m < 0) { m += 12; y -= 1; }
        const label = `${MONTHS_SHORT[m]} ${y}`;
        const value = `${y}-${m}`;
        options.push(`<option value="${value}" ${i === 0 ? 'selected' : ''}>${label}</option>`);
    }
    select.innerHTML = options.join('');
}

// ===== Modal =====
function openAddModal(editId = null) {
    const modal = document.getElementById('add-modal');
    const form = document.getElementById('transaction-form');

    if (editId) {
        const txn = transactions.find(t => t.id === editId);
        if (!txn) return;

        document.getElementById('modal-title').textContent = 'Edit transaction';
        document.getElementById('save-btn').textContent = 'Update transaction';
        document.getElementById('edit-id').value = editId;
        setTransactionType(txn.type);
        document.getElementById('txn-amount').value = txn.originalAmount || txn.amount;
        document.getElementById('txn-currency').value = txn.originalCurrency || 'INR';
        document.getElementById('txn-category').value = txn.category;
        document.getElementById('txn-description').value = txn.description || '';
        document.getElementById('txn-date').value = txn.date;
        updateCurrencyPreview();
    } else {
        document.getElementById('modal-title').textContent = 'New transaction';
        document.getElementById('save-btn').textContent = 'Save transaction';
        form.reset();
        document.getElementById('edit-id').value = '';
        setTransactionType('income');
        document.getElementById('txn-currency').value = 'INR';
        setDefaultDate();
        document.getElementById('currency-info').style.display = 'none';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

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

    if (cats.includes(currentValue)) {
        select.value = currentValue;
    }
}

// ===== Save Transaction =====
function saveTransaction(event) {
    event.preventDefault();

    const editId = document.getElementById('edit-id').value;
    const originalAmount = parseFloat(document.getElementById('txn-amount').value);
    const currency = document.getElementById('txn-currency').value;
    const category = document.getElementById('txn-category').value;
    const description = document.getElementById('txn-description').value.trim();
    const date = document.getElementById('txn-date').value;

    if (!originalAmount || originalAmount <= 0) {
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

    // Convert to INR
    const amountINR = convertToINR(originalAmount, currency);

    const transaction = {
        id: editId || generateId(),
        type: currentType,
        amount: amountINR, // Legacy field, always INR
        amountINR: amountINR,
        originalAmount: originalAmount,
        originalCurrency: currency,
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
        showToast('Transaction updated ✅');
    } else {
        transactions.push(transaction);
        showToast('Transaction saved ✅');
    }

    saveTransactions();
    closeAddModal();
    renderDashboard();
    renderHistory();
    renderInsights();
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
    renderInsights();
    renderReports();
    showToast('Transaction deleted 🗑️');
}

// ===== Render Dashboard =====
function renderDashboard() {
    const today = new Date();
    const todayStr = formatDateISO(today);

    // Get selected month from dashboard selector
    const dashSelect = document.getElementById('dashboard-month-select');
    let selectedMonth, selectedYear;

    if (dashSelect && dashSelect.value) {
        const parts = dashSelect.value.split('-');
        selectedYear = parseInt(parts[0]);
        selectedMonth = parseInt(parts[1]);
    } else {
        selectedMonth = today.getMonth();
        selectedYear = today.getFullYear();
    }

    // Today's totals
    const todayTxns = transactions.filter(t => t.date === todayStr);
    const todayIncome = todayTxns.filter(t => t.type === 'income').reduce((s, t) => s + (t.amountINR || t.amount), 0);
    const todayExpense = todayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amountINR || t.amount), 0);

    // Monthly totals
    const monthTxns = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
    const monthIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + (t.amountINR || t.amount), 0);
    const monthExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amountINR || t.amount), 0);
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

    filtered.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        return dateCompare !== 0 ? dateCompare : b.createdAt - a.createdAt;
    });

    // Summary
    const allMonthTxns = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });
    const totalIncome = allMonthTxns.filter(t => t.type === 'income').reduce((s, t) => s + (t.amountINR || t.amount), 0);
    const totalExpense = allMonthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amountINR || t.amount), 0);
    const balance = totalIncome - totalExpense;

    document.getElementById('history-income').textContent = formatCurrency(totalIncome);
    document.getElementById('history-expense').textContent = formatCurrency(totalExpense);
    document.getElementById('history-balance').textContent = formatCurrency(balance);
    document.getElementById('history-balance').className = `month-summary-value ${balance >= 0 ? 'positive' : 'negative'}`;

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
            const todayStr = formatDateISO(new Date());
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = formatDateISO(yesterdayDate);

            let dateLabel;
            if (txn.date === todayStr) {
                dateLabel = 'Today';
            } else if (txn.date === yesterdayStr) {
                dateLabel = 'Yesterday';
            } else {
                dateLabel = dateObj.toLocaleDateString('en-IN', {
                    weekday: 'short', day: 'numeric', month: 'short'
                });
            }
            html += `<div class="date-separator">${dateLabel}</div>`;
        }
        html += createTransactionHTML(txn, i, true);
    });

    container.innerHTML = html;
}

// ===== Create Transaction HTML =====
function createTransactionHTML(txn, index, showActions = false) {
    const icon = CATEGORY_ICONS[txn.category] || (txn.type === 'income' ? '💰' : '📦');
    const sign = txn.type === 'income' ? '+' : '-';
    const amountINR = txn.amountINR || txn.amount;
    const dateObj = new Date(txn.date + 'T00:00:00');
    const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    // Show original currency if not INR
    let currencyNote = '';
    if (txn.originalCurrency && txn.originalCurrency !== 'INR') {
        const currInfo = SUPPORTED_CURRENCIES.find(c => c.code === txn.originalCurrency);
        const sym = currInfo ? currInfo.symbol : txn.originalCurrency;
        currencyNote = `<div class="txn-original-currency">${sym}${txn.originalAmount?.toLocaleString() || ''}</div>`;
    }

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
        <div class="transaction-item" style="animation-delay: ${index * 0.03}s" onclick="openAddModal('${txn.id}')">
            <div class="txn-icon ${txn.type}">${icon}</div>
            <div class="txn-info">
                <div class="txn-category">${txn.category}</div>
                <div class="txn-desc">${txn.description || dateStr}</div>
            </div>
            <div class="txn-right">
                <div class="txn-amount ${txn.type}">${sign}${formatCurrency(amountINR)}</div>
                ${currencyNote}
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
    if (!container) return;

    const monthMap = new Map();
    transactions.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthMap.has(key)) {
            monthMap.set(key, { year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 });
        }
        const entry = monthMap.get(key);
        const amt = t.amountINR || t.amount;
        if (t.type === 'income') entry.income += amt;
        else entry.expense += amt;
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

// ===== Render Insights =====
function renderInsights() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Set month label (e.g. "June 2026")
    const monthLabelEl = document.getElementById('insights-month-label');
    if (monthLabelEl) {
        monthLabelEl.textContent = `${MONTHS[currentMonth]} ${currentYear}`;
    }

    const downloadBtn = document.getElementById('download-insights-btn');
    if (downloadBtn) {
        downloadBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download ${MONTHS[currentMonth]} as CSV
        `;
    }

    // Filter transactions of current month and year
    const monthTxns = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // 1. Spending by Category (Donut Chart)
    const expenseTxns = monthTxns.filter(t => t.type === 'expense');
    const totalExpense = expenseTxns.reduce((sum, t) => sum + (t.amountINR || t.amount), 0);

    const donutChartWrapper = document.querySelector('.donut-chart-wrapper');
    const donutEmpty = document.getElementById('donut-empty');
    const donutCenterValue = document.getElementById('donut-center-value');

    if (totalExpense === 0) {
        if (donutChartWrapper) donutChartWrapper.style.display = 'none';
        if (donutEmpty) donutEmpty.style.display = 'block';
    } else {
        if (donutChartWrapper) donutChartWrapper.style.display = 'flex';
        if (donutEmpty) donutEmpty.style.display = 'none';
        if (donutCenterValue) {
            donutCenterValue.textContent = '₹' + Math.round(totalExpense).toLocaleString('en-IN');
        }

        // Group by category
        const categoryMap = {};
        expenseTxns.forEach(t => {
            categoryMap[t.category] = (categoryMap[t.category] || 0) + (t.amountINR || t.amount);
        });

        // Sort by amount descending
        const sortedCats = Object.entries(categoryMap)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);

        // Render Donut SVG
        const donutSvg = document.getElementById('donut-svg');
        if (donutSvg) {
            const radius = 70;
            const circumference = 2 * Math.PI * radius; // approx 439.82
            const donutColors = ['#4B6B94', '#C25B3F', '#D4AF37', '#8E7AA6', '#6B8E7D', '#778CA3'];
            
            let accumulatedPercent = 0;
            let svgContent = '';

            sortedCats.forEach((cat, idx) => {
                const color = donutColors[idx % donutColors.length];
                const pct = cat.amount / totalExpense;
                const strokeDasharray = `${(pct * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
                const strokeDashoffset = (-accumulatedPercent * circumference).toFixed(2);
                
                svgContent += `<circle r="${radius}" cx="100" cy="100" stroke="${color}" stroke-width="20" stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}"></circle>`;
                accumulatedPercent += pct;
            });
            donutSvg.innerHTML = svgContent;
        }

        // Render Legend
        const donutLegend = document.getElementById('donut-legend');
        if (donutLegend) {
            const donutColors = ['#4B6B94', '#C25B3F', '#D4AF37', '#8E7AA6', '#6B8E7D', '#778CA3'];
            donutLegend.innerHTML = sortedCats.map((cat, idx) => {
                const color = donutColors[idx % donutColors.length];
                const pct = Math.round((cat.amount / totalExpense) * 100);
                return `
                    <div class="donut-legend-item">
                        <span class="donut-legend-dot" style="background:${color}"></span>
                        <span class="donut-legend-label">${cat.category}</span>
                        <span class="donut-legend-pct">${pct}%</span>
                    </div>
                `;
            }).join('');
        }
    }

    // 2. 6-Month Trend (Bar Chart)
    const barChart = document.getElementById('bar-chart');
    const barChartEmpty = document.getElementById('bar-chart-empty');

    // Get last 6 months list (excluding future months)
    const trendMonths = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        trendMonths.push({
            year: d.getFullYear(),
            month: d.getMonth(),
            label: MONTHS_SHORT[d.getMonth()]
        });
    }

    // Calculate In / Out for each month
    const trendData = trendMonths.map(m => {
        const txns = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === m.month && d.getFullYear() === m.year;
        });
        const income = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amountINR || t.amount), 0);
        const expense = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amountINR || t.amount), 0);
        return {
            ...m,
            income,
            expense
        };
    });

    const maxVal = Math.max(...trendData.map(d => Math.max(d.income, d.expense)), 100);

    if (transactions.length === 0) {
        if (barChart) barChart.style.display = 'none';
        if (barChartEmpty) barChartEmpty.style.display = 'block';
    } else {
        if (barChart) barChart.style.display = 'flex';
        if (barChartEmpty) barChartEmpty.style.display = 'none';

        if (barChart) {
            barChart.innerHTML = trendData.map(d => {
                const inHeight = Math.max(3, (d.income / maxVal) * 100);
                const outHeight = Math.max(3, (d.expense / maxVal) * 100);
                const isCurrent = d.month === currentMonth && d.year === currentYear;
                return `
                    <div class="bar-chart-group">
                        <div class="bar-chart-bars">
                            <div class="bar-chart-bar bar-in" style="height:${inHeight}%" title="Income: ${formatCurrency(d.income)}"></div>
                            <div class="bar-chart-bar bar-out" style="height:${outHeight}%" title="Expense: ${formatCurrency(d.expense)}"></div>
                        </div>
                        <span class="bar-chart-label ${isCurrent ? 'current-month' : ''}">${d.label}</span>
                    </div>
                `;
            }).join('');
        }
    }
}

// ===== Filters =====
function populateFilters() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthSelects = ['filter-month', 'report-month'];
    monthSelects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = MONTHS.map((m, i) =>
            `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${m}</option>`
        ).join('');
    });

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

// ===== Download Current Month Sheet (CSV) =====
function downloadCurrentMonthCSV() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthTxns = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    if (monthTxns.length === 0) {
        showToast('No transactions found for this month');
        return;
    }

    monthTxns.sort((a, b) => a.date.localeCompare(b.date));

    // CSV with currency columns
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (₹)', 'Original Currency', 'Original Amount'];
    const rows = monthTxns.map(t => {
        const dateObj = new Date(t.date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        const amountINR = t.amountINR || t.amount;
        return [
            dateStr,
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
            `"${t.category}"`,
            `"${(t.description || '').replace(/"/g, '""')}"`,
            t.type === 'income' ? amountINR.toFixed(2) : `-${amountINR.toFixed(2)}`,
            t.originalCurrency || 'INR',
            t.originalAmount || amountINR
        ].join(',');
    });

    // Summary
    const totalIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + (t.amountINR || t.amount), 0);
    const totalExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amountINR || t.amount), 0);
    const balance = totalIncome - totalExpense;

    rows.push('');
    rows.push(`"Total Income",,,,${totalIncome.toFixed(2)},,`);
    rows.push(`"Total Expense",,,,-${totalExpense.toFixed(2)},,`);
    rows.push(`"Balance",,,,${balance.toFixed(2)},,`);

    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    downloadCSVBlob(csv, `HisaabKitaab_${MONTHS[currentMonth]}_${currentYear}.csv`);
    showToast('Sheet downloaded 📥');
}

// ===== Export All Data as CSV =====
function exportAllDataCSV() {
    if (transactions.length === 0) {
        showToast('No data to export');
        return;
    }

    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (₹)', 'Original Currency', 'Original Amount'];
    const rows = sorted.map(t => {
        const dateObj = new Date(t.date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        const amountINR = t.amountINR || t.amount;
        return [
            dateStr,
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
            `"${t.category}"`,
            `"${(t.description || '').replace(/"/g, '""')}"`,
            t.type === 'income' ? amountINR.toFixed(2) : `-${amountINR.toFixed(2)}`,
            t.originalCurrency || 'INR',
            t.originalAmount || amountINR
        ].join(',');
    });

    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    downloadCSVBlob(csv, `HisaabKitaab_Backup_${formatDateISO(new Date())}.csv`);
    showToast('Data exported 📦');
}

function downloadCSVBlob(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== CSV Import/Upload =====
function setupUploadZone() {
    const zone = document.getElementById('upload-zone');
    if (!zone) return;

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].name.endsWith('.csv')) {
            parseCSVFile(files[0]);
        } else {
            showToast('Please upload a CSV file');
        }
    });
}

function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
        showToast('Please upload a CSV file');
        return;
    }
    parseCSVFile(file);
}

function parseCSVFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            if (lines.length < 2) {
                showToast('CSV file is empty or invalid');
                return;
            }

            // Parse header
            const header = lines[0].toLowerCase();
            const hasNewFormat = header.includes('original currency');

            const parsed = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                // Skip summary rows
                if (line.startsWith('"Total') || line.startsWith('"Balance')) continue;
                if (line.trim() === '') continue;

                const cols = parseCSVLine(line);
                if (cols.length < 5) continue;

                const dateStr = cols[0].replace(/"/g, '').trim();
                const type = cols[1].replace(/"/g, '').trim().toLowerCase();
                const category = cols[2].replace(/"/g, '').trim();
                const description = cols[3].replace(/"/g, '').trim();
                const amountStr = cols[4].replace(/"/g, '').trim();

                if (!dateStr || !type || !category || !amountStr) continue;
                if (type !== 'income' && type !== 'expense') continue;

                const amount = Math.abs(parseFloat(amountStr));
                if (isNaN(amount) || amount <= 0) continue;

                // Parse date (dd/mm/yyyy format from Indian locale)
                let parsedDate;
                const dateParts = dateStr.split('/');
                if (dateParts.length === 3) {
                    const day = parseInt(dateParts[0]);
                    const month = parseInt(dateParts[1]) - 1;
                    const year = parseInt(dateParts[2]);
                    parsedDate = new Date(year, month, day);
                } else {
                    parsedDate = new Date(dateStr);
                }

                if (isNaN(parsedDate.getTime())) continue;
                const isoDate = formatDateISO(parsedDate);

                let originalCurrency = 'INR';
                let originalAmount = amount;

                if (hasNewFormat && cols.length >= 7) {
                    originalCurrency = (cols[5] || '').replace(/"/g, '').trim() || 'INR';
                    const oa = parseFloat((cols[6] || '').replace(/"/g, '').trim());
                    if (!isNaN(oa) && oa > 0) {
                        originalAmount = oa;
                    }
                }

                parsed.push({
                    type,
                    amount,
                    amountINR: amount,
                    originalCurrency,
                    originalAmount,
                    category,
                    description,
                    date: isoDate,
                });
            }

            if (parsed.length === 0) {
                showToast('No valid transactions found in CSV');
                return;
            }

            // Check for duplicates
            let newCount = 0;
            let duplicateCount = 0;
            const newTransactions = [];

            parsed.forEach(p => {
                const isDuplicate = transactions.some(t =>
                    t.date === p.date &&
                    t.category === p.category &&
                    Math.abs((t.amountINR || t.amount) - p.amountINR) < 0.01 &&
                    t.type === p.type
                );
                if (!isDuplicate) {
                    newTransactions.push(p);
                    newCount++;
                } else {
                    duplicateCount++;
                }
            });

            pendingCSVTransactions = newTransactions;

            const preview = document.getElementById('upload-preview');
            const previewText = document.getElementById('upload-preview-text');

            let msg = `Found ${parsed.length} transactions`;
            if (duplicateCount > 0) {
                msg += ` (${duplicateCount} duplicates skipped)`;
            }
            msg += `. Import ${newCount} new entries?`;

            previewText.textContent = msg;
            preview.classList.add('visible');

            if (newCount === 0) {
                previewText.textContent = `All ${parsed.length} transactions already exist. Nothing to import.`;
                pendingCSVTransactions = [];
            }

        } catch (err) {
            console.error('CSV parse error:', err);
            showToast('Failed to parse CSV file');
        }
    };
    reader.readAsText(file);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

function confirmCSVImport() {
    if (pendingCSVTransactions.length === 0) {
        showToast('No transactions to import');
        cancelCSVImport();
        return;
    }

    // Add IDs and timestamps
    const now = Date.now();
    pendingCSVTransactions.forEach((t, i) => {
        t.id = generateId() + i;
        t.createdAt = now + i;
        t.updatedAt = now + i;
    });

    transactions = [...transactions, ...pendingCSVTransactions];
    saveTransactions();

    showToast(`Imported ${pendingCSVTransactions.length} transactions ✅`);
    pendingCSVTransactions = [];

    cancelCSVImport();
    renderDashboard();
    renderHistory();
    renderInsights();
    renderReports();
}

function cancelCSVImport() {
    pendingCSVTransactions = [];
    const preview = document.getElementById('upload-preview');
    preview.classList.remove('visible');

    // Reset file input
    const fileInput = document.getElementById('csv-file-input');
    if (fileInput) fileInput.value = '';
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
    renderInsights();
    renderReports();
    showToast('All data cleared 🗑️');
}

// ===== Categories Management =====
function renderCategories() {
    renderCategoryTags('income');
    renderCategoryTags('expense');
}

function renderCategoryTags(type) {
    const container = document.getElementById(`${type}-categories`);
    if (!container) return;
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
    showToast(`Category "${name}" added ✅`);
}

function removeCategory(type, name) {
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
            // Service worker registration failed — app still works fine
        });
    });
}
