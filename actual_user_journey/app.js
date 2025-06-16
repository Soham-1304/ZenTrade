document.addEventListener('DOMContentLoaded', () => {
    // --- APP STATE, CONSTANTS & REFERENCES ---
    const USER_DB_KEY = 'kite_simulation_users';
    const SESSION_KEY = 'kite_simulation_session';
    const STOCKS_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSURPZNruD6agTtpt8R_REa41D5hzX9J_zPLFhcPqGKM9HHI4oJOje1FjzYFXq9uFqTt3ZSfWXeejfy/pub?gid=0&single=true&output=csv';

    let STOCKS_MASTER_LIST = [];
    let STOCKS_LIVE_DATA = [];
    let STATE = {};
    let niftyChart, singleStockChart, marketUpdateInterval;

    const views = { 
        dashboard: document.getElementById('dashboard-view'), 
        orders: document.getElementById('orders-view'), 
        holdings: document.getElementById('holdings-view'), 
        journal: document.getElementById('journal-view'),
        profile: document.getElementById('profile-view') 
    };
    const watchlistEl = document.getElementById('watchlist');
    const chartPanelEl = document.getElementById('chart-panel');
    const modalContainer = document.getElementById('modal-container');
    const modalOverlay = document.getElementById('modal-overlay');

    // --- THEME MANAGEMENT ---
    const applyTheme = (theme) => {
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');
        const sunIcon = `<svg class="w-5 h-5 mr-3 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"></path></svg>`;
        const moonIcon = `<svg class="w-5 h-5 mr-3 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
        if (theme === 'dark') { document.documentElement.classList.add('dark'); if (themeIcon) themeIcon.innerHTML = sunIcon; if (themeText) themeText.textContent = 'Light Mode'; }
        else { document.documentElement.classList.remove('dark'); if (themeIcon) themeIcon.innerHTML = moonIcon; if (themeText) themeText.textContent = 'Dark Mode'; }
        if(STATE.currentView === 'profile') ProfileApp.renderProfileView(views.profile);
    };
    const toggleTheme = () => { const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark'; localStorage.setItem('theme', newTheme); applyTheme(newTheme); };

    // --- DATA & STATE MANAGEMENT ---
    const getCurrentUser = () => { const m = sessionStorage.getItem(SESSION_KEY); if (!m) { window.location.href = 'login.html'; return null; } return (JSON.parse(localStorage.getItem(USER_DB_KEY)) || []).find(u => u.mobile === m); };
    const saveState = () => { STATE.stocks_today = STOCKS_LIVE_DATA; const u = getCurrentUser(); if (!u) return; let db = JSON.parse(localStorage.getItem(USER_DB_KEY)) || []; const i = db.findIndex(user => user.mobile === u.mobile); if (i !== -1) { db[i].accountData = STATE; localStorage.setItem(USER_DB_KEY, JSON.stringify(db)); } };
    const formatCurrency = (val) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const getStock = (name) => STOCKS_LIVE_DATA.find(s => s.name === name);
    const calculateHoldings = () => { let tI=0, tCV=0, dP=0; if (!STATE.holdings) return { hD: [], tI, tCV, dP, tP: 0 }; const hD = Object.keys(STATE.holdings).map(n => { const h = STATE.holdings[n]; if (h.quantity <= 0) return null; const s = getStock(n); if (!s) return null; const i = h.quantity * h.avgPrice; const cV = h.quantity * s.price; const p = cV - i; const dC = (s.price - s.day_open) * h.quantity; tI += i; tCV += cV; dP += dC; return { n, ...h, l: s.price, cV, p, dC }; }).filter(Boolean); return { hD, tI, tCV, dP, tP: tCV - tI }; };
    
    // --- REAL-TIME MARKET & SIMULATION ENGINE ---
    const getCurrentTimeFormatted = () => { const now = new Date(); return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`; };
    const getMarketStatus = () => { const now = new Date(); const day = now.getDay(); const hour = now.getHours(); const minute = now.getMinutes(); const isWeekday = day >= 1 && day <= 5; const isMarketHours = (hour > 9 || (hour === 9 && minute >= 15)) && (hour < 15 || (hour === 15 && minute <= 30)); return (isWeekday && isMarketHours) ? 'LIVE' : 'SIMULATED'; };
    async function fetchLiveMarketData() { const response = await fetch(STOCKS_DATA_URL, { cache: "no-store" }); if (!response.ok) throw new Error('Network response failed'); const csvText = await response.text(); const parsedData = csvText.split('\n').slice(1).map(row => { const columns = row.split(','); if (columns.length < 4) return null; const [ticker, fullName, exchange, price] = columns; const displayName = ticker.startsWith('INDEX') ? fullName.trim() : ticker.trim(); return { name: displayName, fullName: fullName.trim(), exchange: exchange.trim(), price: parseFloat(price) }; }).filter(s => s && s.name && s.exchange && !isNaN(s.price)); if (parsedData.length === 0) throw new Error('No data parsed'); return parsedData; }
    function getFallbackData() { return [ { name: 'NIFTY 50', fullName: 'NIFTY 50', exchange: 'INDEX', price: 24718.60 }, { name: 'SENSEX', fullName: 'SENSEX', exchange: 'INDEX', price: 81118.60 }, { name: 'INFY', fullName: 'Infosys', exchange: 'BSE', price: 1605.00 }, { name: 'TCS', fullName: 'Tata Consultancy Services', exchange: 'NSE', price: 3447.40 }, { name: 'RELIANCE', fullName: 'Reliance Industries', exchange: 'NSE', price: 1427.50 }, { name: 'HDFCBANK', fullName: 'HDFC Bank', exchange: 'NSE', price: 1919.50 }, { name: 'ICICIBANK', fullName: 'ICICI Bank', exchange: 'NSE', price: 1417.70 }, { name: 'LT', fullName: 'Larsen & Toubro', exchange: 'NSE', price: 3586.20 }, { name: 'HINDUNILVR', fullName: 'Hindustan Unilever', exchange: 'NSE', price: 2320.00 }, { name: 'ITC', fullName: 'ITC', exchange: 'NSE', price: 413.95 }, { name: 'SBIN', fullName: 'State Bank of India', exchange: 'NSE', price: 793.30 }, { name: 'KOTAKBANK', fullName: 'Kotak Mahindra Bank', exchange: 'NSE', price: 2106.00 }, { name: 'AXISBANK', fullName: 'Axis Bank', exchange: 'NSE', price: 1207.00 }, { name: 'BAJFINANCE', fullName: 'Bajaj Finance', exchange: 'NSE', price: 9340.00 }, { name: 'BAJAJFINSV', fullName: 'Bajaj Finserv', exchange: 'NSE', price: 2015.00 }, { name: 'MARUTI', fullName: 'Maruti Suzuki India', exchange: 'NSE', price: 12405.00 }, { name: 'BHARTIARTL', fullName: 'Bharti Airtel', exchange: 'NSE', price: 1840.10 }, { name: 'TITAN', fullName: 'Titan Company', exchange: 'NSE', price: 3420.00 }, { name: 'ULTRACEMCO', fullName: 'UltraTech Cement', exchange: 'NSE', price: 11215.00 }, { name: 'ONGC', fullName: 'Oil & Natural Gas Corp', exchange: 'NSE', price: 251.05 }, { name: 'NTPC', fullName: 'NTPC', exchange: 'NSE', price: 332.20 }, { name: 'POWERGRID', fullName: 'Power Grid Corporation', exchange: 'NSE', price: 286.00 }, { name: 'COALINDIA', fullName: 'Coal India', exchange: 'NSE', price: 391.30 }, { name: 'TECHM', fullName: 'Tech Mahindra', exchange: 'NSE', price: 1658.00 }, { name: 'SUNPHARMA', fullName: 'Sun Pharmaceutical Industries', exchange: 'NSE', price: 1688.00 }, { name: 'DRREDDY', fullName: 'Dr. Reddy’s Laboratories', exchange: 'NSE', price: 1363.00 }, { name: 'CIPLA', fullName: 'Cipla', exchange: 'NSE', price: 1507.80 }, { name: 'BAJAJ-AUTO', fullName: 'Bajaj Auto', exchange: 'NSE', price: 8482.50 }, { name: 'EICHERMOT', fullName: 'Eicher Motors', exchange: 'NSE', price: 5323.00 }, { name: 'GRASIM', fullName: 'Grasim Industries', exchange: 'NSE', price: 2665.00 }, { name: 'ADANIPORTS', fullName: 'Adani Ports & SEZ', exchange: 'NSE', price: 1406.10 }, { name: 'ADANIENT', fullName: 'Adani Enterprises', exchange: 'NSE', price: 2506.00 }, { name: 'ADANIGREEN', fullName: 'Adani Green Energy', exchange: 'NSE', price: 994.00 }, { name: 'JSWSTEEL', fullName: 'JSW Steel', exchange: 'NSE', price: 987.10 }, { name: 'TATASTEEL', fullName: 'Tata Steel', exchange: 'NSE', price: 152.34 }, { name: 'HCLTECH', fullName: 'HCL Technologies', exchange: 'NSE', price: 1697.40 }, { name: 'WIPRO', fullName: 'Wipro', exchange: 'NSE', price: 260.59 }, { name: 'VEDL', fullName: 'Vedanta', exchange: 'NSE', price: 458.35 }, { name: 'SBILIFE', fullName: 'SBI Life Insurance Company', exchange: 'NSE', price: 1756.40 }, { name: 'BRITANNIA', fullName: 'Britannia Industries', exchange: 'NSE', price: 5560.00 }, { name: 'NESTLEIND', fullName: 'Nestle India', exchange: 'NSE', price: 2378.90 }, { name: 'HDFCLIFE', fullName: 'HDFC Life Insurance Company', exchange: 'NSE', price: 752.00 }, { name: 'TATAMOTORS', fullName: 'Tata Motors', exchange: 'NSE', price: 713.75 }, { name: 'TATAELXSI', fullName: 'Tata Elxsi', exchange: 'NSE', price: 6393.50 }, { name: 'APOLLOHOSP', fullName: 'Apollo Hospitals India', exchange: 'NSE', price: 7000.00 }, { name: 'AUROPHARMA', fullName: 'Aurobindo Pharma', exchange: 'NSE', price: 1147.90 }, { name: 'M&M', fullName: 'Mahindra & Mahindra', exchange: 'NSE', price: 3005.90 }, { name: 'GAIL', fullName: 'GAIL (India)', exchange: 'NSE', price: 191.98 }, { name: 'INDUSINDBK', fullName: 'IndusInd Bank', exchange: 'NSE', price: 818.50 }, { name: 'FEDERALBNK', fullName: 'The Federal Bank', exchange: 'NSE', price: 205.60 }, { name: 'IDFCFIRSTB', fullName: 'IDFC First Bank', exchange: 'NSE', price: 70.30 }, { name: 'LUPIN', fullName: 'Lupin', exchange: 'NSE', price: 1997.80 }, { name: 'AMBUJACEM', fullName: 'Ambuja Cements', exchange: 'NSE', price: 543.95 }, { name: 'HINDPETRO', fullName: 'Hindustan Petroleum Corporation', exchange: 'NSE', price: 386.25 }, { name: 'YESBANK', fullName: 'YES Bank', exchange: 'NSE', price: 20.24 }, { name: 'PNB', fullName: 'Punjab National Bank', exchange: 'NSE', price: 106.65 }, { name: 'BANKBARODA', fullName: 'Bank of Baroda', exchange: 'NSE', price: 239.80 }, { name: 'COLPAL', fullName: 'Colgate Palmolive (India)', exchange: 'NSE', price: 2372.90 }, { name: 'HAVELLS', fullName: 'Havells India', exchange: 'NSE', price: 1541.50 }, { name: 'LICHSGFIN', fullName: 'LIC Housing Finance', exchange: 'NSE', price: 600.50 }, { name: 'BATAINDIA', fullName: 'Bata India', exchange: 'NSE', price: 1215.00 }, { name: 'DLF', fullName: 'DLF', exchange: 'NSE', price: 856.00 }, { name: 'TATACONSUM', fullName: 'Tata Consumer Products', exchange: 'NSE', price: 1080.60 }, { name: 'GODREJCP', fullName: 'Godrej Consumer Products', exchange: 'NSE', price: 1187.20 }, { name: 'SRF', fullName: 'SRF', exchange: 'NSE', price: 3108.30 }, { name: 'BOSCHLTD', fullName: 'Bosch Ltd', exchange: 'NSE', price: 31600.00 }, { name: 'MRF', fullName: 'MRF', exchange: 'NSE', price: 137105.00 }, { name: 'PEL', fullName: 'Pidilite Industries', exchange: 'NSE', price: 1132.50 }, { name: 'ADANIPOWER', fullName: 'Adani Power', exchange: 'NSE', price: 570.75 }, { name: 'CESC', fullName: 'CESC', exchange: 'NSE', price: 164.99 }, { name: 'TORNTPHARM', fullName: 'Torrent Pharmaceuticals', exchange: 'NSE', price: 3248.40 }, { name: 'HEROMOTOCO', fullName: 'Hero MotoCorp', exchange: 'NSE', price: 4338.90 }, { name: 'INFIBEAM', fullName: 'Infibeam Avenues', exchange: 'BSE', price: 21.89 }, { name: 'ASTRON', fullName: 'Astron Paper & Board', exchange: 'NSE', price: 18.29 }, { name: 'SIEMENS', fullName: 'Siemens', exchange: 'NSE', price: 3264.00 } ];}
    function runSimulationTick() {
        STOCKS_LIVE_DATA.forEach(stock => {
            if (stock.exchange === 'INDEX') return;
            // Fluctuation is now based on a percentage of the stock's price, not a fixed value
            // E.g., 0.01% of price, so big stocks move more in absolute terms, but all move similarly in percent
            const volatility = 0.0001; // 0.01% per tick, adjust as needed
            const change = (Math.random() - 0.5) * (stock.price * volatility * 2); // -0.01% to +0.01%
            stock.price = Math.max(0.01, stock.price + change);
            stock.change = stock.price - stock.day_open;
            stock.changePct = stock.day_open !== 0 ? (stock.change / stock.day_open) : 0;
        });
        const nifty = getStock('NIFTY 50');
        if (nifty) {
            const volatility = 0.00008; // NIFTY is less volatile
            const change = (Math.random() - 0.5) * (nifty.price * volatility * 2);
            nifty.price = Math.max(0.01, nifty.price + change);
            nifty.change = nifty.price - nifty.day_open;
            nifty.changePct = nifty.day_open !== 0 ? (nifty.change / nifty.day_open) : 0;
        }
        const sensex = getStock('SENSEX');
        if (sensex) {
            const volatility = 0.00007; // SENSEX is even less volatile
            const change = (Math.random() - 0.5) * (sensex.price * volatility * 2);
            sensex.price = Math.max(0.01, sensex.price + change);
            sensex.change = sensex.price - sensex.day_open;
            sensex.changePct = sensex.day_open !== 0 ? (sensex.change / sensex.day_open) : 0;
        }
    }
    async function marketUpdateLoop() {
        STATE.marketTime = getCurrentTimeFormatted();
        const marketStatus = getMarketStatus();
        const currentSecond = new Date().getSeconds();
        if (marketStatus === 'LIVE' && currentSecond === 0) {
            try {
                const liveData = await fetchLiveMarketData();
                console.log('Fetched live data:', liveData); // Debug log
                STOCKS_LIVE_DATA.forEach(stock => {
                    const liveStock = liveData.find(s => s.name === stock.name);
                    if (liveStock) {
                        stock.price = liveStock.price;
                        stock.day_open = liveStock.price;
                        stock.change = 0;
                        stock.changePct = 0;
                    } else {
                        console.warn('No live data for:', stock.name); // Debug log for mismatches
                    }
                });
                // Persist the new base for simulation in state
                STATE.stocks_today = STOCKS_LIVE_DATA.map(s => ({ ...s }));
                console.log('Updated STOCKS_LIVE_DATA:', STOCKS_LIVE_DATA); // Debug log
            } catch (e) {
                console.error("Per-minute live fetch failed, continuing with simulation.", e);
                runSimulationTick();
            }
        } else {
            runSimulationTick();
        }
        updateAllUI();
        saveState();
    }
    
    // --- UI RENDER FUNCTIONS ---
    function renderDashboardView() { 
        views.dashboard.innerHTML = `<div class="space-y-6"><h2 class="text-2xl text-secondary">Hi, <span id="dashboard-username" class="text-primary"></span></h2><div class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div class="bg-secondary p-6 rounded-lg themed-shadow"><div><h2 class="text-lg text-secondary mb-2">Equity</h2><p id="equity-margin-available" class="text-4xl font-light text-primary"></p></div></div><div class="bg-secondary p-6 rounded-lg themed-shadow flex flex-col justify-between"><div><h2 class="text-lg text-secondary mb-2">Manage Funds</h2><p class="text-xs text-secondary">From your linked bank account.</p></div><button id="add-funds-button" class="mt-4 w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"><svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg> Add Funds</button></div></div><div class="bg-secondary p-6 rounded-lg themed-shadow"><h2 class="text-lg font-semibold mb-4 text-primary">Holdings (<span id="holdings-count-dashboard"></span>)</h2><div class="flex justify-between items-center"><div class="w-1/3"><p id="holdings-pnl-dashboard" class="text-3xl font-light"></p><p class="text-xs text-secondary">Total P&L</p></div><div class="w-1/3 text-center"><p id="holdings-daypnl-dashboard" class="text-md"></p><p class="text-xs text-secondary">Day's P&L</p></div><div class="w-1/3 text-right"><p class="text-secondary">Current <span id="holdings-current-dashboard" class="block font-semibold text-primary"></span></p><p class="text-secondary">Investment <span id="holdings-investment-dashboard" class="block font-semibold text-primary"></span></p></div></div></div><div class="grid grid-cols-1"><div class="bg-secondary p-6 rounded-lg themed-shadow"><h2 class="text-lg font-semibold mb-4 text-primary">Market Overview</h2><div class="h-48"><canvas id="niftyChart"></canvas></div></div></div></div>`;
        // Attach add-funds button event
        const addFundsBtn = document.getElementById('add-funds-button');
        if (addFundsBtn) addFundsBtn.addEventListener('click', openFundsModal);
        // Ensure dashboard content is updated
        updateWatchlist();
        updateDashboardData();
        initializeNiftyChart();
    }
    function renderOrdersView() { views.orders.innerHTML = `<div><div class="border-b border-color mb-4"><nav class="-mb-px flex space-x-8"><a href="#" class="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Orders</a></nav></div></div><div class="space-y-8"><div><h2 class="text-xl font-semibold mb-4 text-primary">Open orders (<span id="open-orders-count"></span>)</h2><div class="bg-secondary rounded-lg themed-shadow overflow-hidden"><table class="w-full text-sm"><thead><tr class="bg-primary text-xs uppercase text-secondary"><th class="px-4 py-3 text-left">Time</th><th class="px-4 py-3 text-left">Type</th><th class="px-4 py-3 text-left">Instrument</th><th class="px-4 py-3 text-right">Qty</th><th class="px-4 py-3 text-right">LTP</th><th class="px-4 py-3 text-right">Status</th></tr></thead><tbody id="open-orders-table" class="divide-y border-color"></tbody></table></div></div><div><h2 class="text-xl font-semibold mb-4 text-primary">Executed orders (<span id="executed-orders-count"></span>)</h2><div class="bg-secondary rounded-lg themed-shadow overflow-hidden"><table class="w-full text-sm"><thead><tr class="bg-primary text-xs uppercase text-secondary"><th class="px-4 py-3 text-left">Time</th><th class="px-4 py-3 text-left">Type</th><th class="px-4 py-3 text-left">Instrument</th><th class="px-4 py-3 text-right">Qty.</th><th class="px-4 py-3 text-right">Avg. price</th><th class="px-4 py-3 text-right">Status</th></tr></thead><tbody id="executed-orders-table" class="divide-y border-color"></tbody></table></div></div></div>`; }
    function renderHoldingsView() { views.holdings.innerHTML = `<div class="bg-secondary rounded-lg themed-shadow"><div class="p-6"><h2 class="text-xl font-semibold mb-1 text-primary">Holdings (<span id="holdings-count"></span>)</h2><div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mt-4 border-b border-color pb-4"><div class="border-r border-color"><p class="text-secondary">Total investment</p><p id="holdings-investment" class="text-xl font-semibold text-primary"></p></div><div class="border-r border-color"><p class="text-secondary">Current value</p><p id="holdings-current" class="text-xl font-semibold text-primary"></p></div><div class="border-r border-color"><p class="text-secondary">Day's P&L</p><p id="holdings-day-pnl" class="text-xl font-semibold"></p></div><div><p class="text-secondary">Total P&L</p><p id="holdings-total-pnl" class="text-xl font-semibold"></p></div></div></div><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="bg-primary text-xs uppercase text-secondary"><th class="px-4 py-3 text-left">Instrument</th><th class="px-4 py-3 text-right">Qty.</th><th class="px-4 py-3 text-right">Avg. cost</th><th class="px-4 py-3 text-right">LTP</th><th class="px-4 py-3 text-right">Cur. val</th><th class="px-4 py-3 text-right">P&L</th><th class="px-4 py-3 text-right">Day chg.</th><th class="px-4 py-3 text-center">Actions</th></tr></thead><tbody id="holdings-table" class="divide-y border-color"></tbody></table></div><div id="holdings-portfolio-bar" class="w-full h-3 mt-4"></div></div>`; }
    
    // --- UI UPDATE FUNCTIONS ---
    function updateDashboardData() { const { hD, tI, tCV, dP, tP } = calculateHoldings(); if(document.getElementById('dashboard-username')) document.getElementById('dashboard-username').textContent = getCurrentUser().name.split(' ')[0]; if(document.getElementById('equity-margin-available')) document.getElementById('equity-margin-available').textContent = formatCurrency(STATE.funds.equity); if(document.getElementById('holdings-count-dashboard')) document.getElementById('holdings-count-dashboard').textContent = hD.length; const pnlEl = document.getElementById('holdings-pnl-dashboard'); if(pnlEl){ pnlEl.textContent = formatCurrency(tP); pnlEl.className = `text-3xl font-light ${tP >= 0 ? 'text-positive' : 'text-negative'}`; } const dayPnlEl = document.getElementById('holdings-daypnl-dashboard'); if(dayPnlEl){ dayPnlEl.textContent = `${dP >= 0 ? '+' : ''}${formatCurrency(dP)}`; dayPnlEl.className = `text-md ${dP >= 0 ? 'text-positive' : 'text-negative'}`; } if(document.getElementById('holdings-current-dashboard')) document.getElementById('holdings-current-dashboard').textContent = formatCurrency(tCV); if(document.getElementById('holdings-investment-dashboard')) document.getElementById('holdings-investment-dashboard').textContent = formatCurrency(tI); }
    function updateOrdersData() { if(!document.getElementById('open-orders-count')) return; const openOrders = STATE.orders.filter(o => o.status === 'OPEN'); const executedOrders = STATE.orders.filter(o => o.status !== 'OPEN'); document.getElementById('open-orders-count').textContent = openOrders.length; document.getElementById('executed-orders-count').textContent = executedOrders.length; const openTable = document.getElementById('open-orders-table'); openTable.innerHTML = openOrders.length === 0 ? `<tr><td colspan="6" class="p-4 text-center text-secondary">No open orders</td></tr>` : openOrders.map(o => { const stock = getStock(o.instrument); const ltp = stock ? stock.price.toFixed(2) : 'N/A'; return `<tr class="hover-bg"><td class="p-4 text-secondary">${o.time}</td><td class="p-4 font-bold ${o.type === 'BUY' ? 'text-blue-500' : 'text-red-500'}">${o.type}</td><td class="p-4 font-medium text-primary">${o.instrument}</td><td class="p-4 text-right">${o.quantity}</td><td class="p-4 text-right">${ltp}</td><td class="p-4 text-right text-secondary">${o.status}</td></tr>`; }).join(''); const execTable = document.getElementById('executed-orders-table'); execTable.innerHTML = executedOrders.length === 0 ? `<tr><td colspan="6" class="p-4 text-center text-secondary">No executed orders</td></tr>` : [...executedOrders].reverse().map(o => `<tr class="hover-bg"><td class="p-4 text-secondary">${o.time}</td><td class="p-4 font-bold ${o.type === 'BUY' ? 'text-blue-500' : 'text-red-500'}">${o.type}</td><td class="p-4 font-medium text-primary">${o.instrument}</td><td class="p-4 text-right">${o.quantity}</td><td class="p-4 text-right">${o.price.toFixed(2)}</td><td class="p-4 text-right font-semibold ${o.status === 'COMPLETE' ? 'text-positive' : 'text-negative'}">${o.status}</td></tr>`).join(''); }
    function updateHoldingsData() { if(!document.getElementById('holdings-count')) return; const { hD, tI, tCV, dP, tP } = calculateHoldings(); document.getElementById('holdings-count').textContent = hD.length; document.getElementById('holdings-investment').textContent = formatCurrency(tI); document.getElementById('holdings-current').textContent = formatCurrency(tCV); const dayPnlEl = document.getElementById('holdings-day-pnl'); dayPnlEl.textContent = `${dP >= 0 ? '+' : ''}${formatCurrency(dP)}`; dayPnlEl.className = `text-xl font-semibold ${dP >= 0 ? 'text-positive' : 'text-negative'}`; const totalPnlEl = document.getElementById('holdings-total-pnl'); totalPnlEl.textContent = formatCurrency(tP); totalPnlEl.className = `text-xl font-semibold ${tP >= 0 ? 'text-positive' : 'text-negative'}`; document.getElementById('holdings-table').innerHTML = hD.length === 0 ? `<tr><td colspan="8" class="p-4 text-center text-secondary">No holdings.</td></tr>` : hD.map(h => ` <tr class="hover-bg"> <td class="p-4 font-medium text-primary">${h.n}</td> <td class="p-4 text-right">${h.quantity}</td> <td class="p-4 text-right">${h.avgPrice.toFixed(2)}</td> <td class="p-4 text-right">${h.l.toFixed(2)}</td> <td class="p-4 text-right">${formatCurrency(h.cV)}</td> <td class="p-4 text-right font-medium ${h.p >= 0 ? 'text-positive' : 'text-negative'}">${h.p.toFixed(2)}</td> <td class="p-4 text-right ${h.dC >= 0 ? 'text-positive' : 'text-negative'}">${h.dC.toFixed(2)}</td> <td class="p-4 text-center"> <button data-action="sell" data-stock="${h.n}" class="px-4 py-1 text-sm text-white bg-red-500 hover:bg-red-600 rounded">Sell</button> </td> </tr>`).join(''); document.getElementById('holdings-portfolio-bar').innerHTML = hD.map(h => `<div class="${h.p >= 0 ? 'bg-positive' : 'bg-negative'} h-full float-left" style="width: ${(h.cV / tCV) * 100}%" title="${h.n}"></div>`).join(''); }    
    function updateWatchlist() { const searchInputEl = document.querySelector('aside input[type="text"]'); const searchTerm = searchInputEl ? searchInputEl.value.trim().toLowerCase() : ''; const filteredStocks = searchTerm === '' ? STOCKS_LIVE_DATA : STOCKS_LIVE_DATA.filter(stock => { const ticker = stock.name.toLowerCase(); const stockName = stock.fullName ? stock.fullName.toLowerCase() : ''; return ticker.includes(searchTerm) || stockName.includes(searchTerm); }); watchlistEl.innerHTML = filteredStocks.map(stock => { const priceClass = stock.change >= 0 ? 'text-positive' : 'text-negative'; const isIndex = stock.exchange === 'INDEX'; const actionButtons = isIndex ? '' : `<button data-action="buy" data-stock="${stock.name}" class="px-3 py-1 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-l">B</button><button data-action="sell" data-stock="${stock.name}" class="px-3 py-1 text-sm text-white bg-red-500 hover:bg-red-600">S</button>`; return `<div class="watchlist-item relative border-b border-color group hover-bg"><div class="flex justify-between items-center px-4 py-2"><div class="flex-1 overflow-hidden"><p class="font-semibold text-sm ${priceClass}">${stock.name}</p><p class="text-xs text-secondary">${stock.exchange}</p></div><div class="flex items-center text-right"><p class="text-xs w-24"><span class="${priceClass}">${(stock.changePct || 0).toLocaleString('en-IN', { style: 'percent', minimumFractionDigits: 2 })}</span><span class="block text-primary">${(stock.change || 0).toFixed(2)}</span></p><p class="font-semibold text-sm w-20 text-primary">${stock.price.toFixed(2)}</p></div><div class="action-buttons absolute right-2 bg-secondary themed-shadow-lg rounded-md flex items-center border border-color">${actionButtons}<button data-action="view-chart" data-stock="${stock.name}" class="p-2 text-secondary hover-bg border-l border-color ${isIndex ? 'rounded-l' : ''}"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg></button></div></div></div>`; }).join(''); }
    function updateHeader() {['NIFTY 50', 'SENSEX'].forEach(name => { const s = getStock(name); if(!s) return; const el = document.getElementById(`${name.split(' ')[0].toLowerCase()}-header-value`); if(!el) return; const pC = s.changePct; el.innerHTML = `${s.price.toFixed(2)} <span class="text-xs font-normal">(${(pC || 0).toLocaleString('en-IN', { style: 'percent', minimumFractionDigits: 2 })})</span>`; el.className = `text-sm font-semibold ${s.change >= 0 ? 'text-positive' : 'text-negative'}`; });}
    function initializeNiftyChart() { if (niftyChart) niftyChart.destroy(); if (!STATE.niftyHistory || !STATE.niftyHistory.data) return; const ctx = document.getElementById('niftyChart')?.getContext('2d'); if (!ctx) return; niftyChart = new Chart(ctx, { type: 'line', data: { labels: STATE.niftyHistory.labels, datasets: [{ label: 'NIFTY 50', data: STATE.niftyHistory.data, borderColor: '#3b82f6', borderWidth: 1.5, fill: true, backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.1, pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { display: false }, x: { display: false } }, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } } } }); }
    function updateNiftyChart() { if (!niftyChart) return; const nifty = getStock('NIFTY 50'); if (!nifty || !STATE.niftyHistory.data) return; if (STATE.niftyHistory.data.length >= 375) { STATE.niftyHistory.data.shift(); STATE.niftyHistory.labels.shift(); } STATE.niftyHistory.data.push(nifty.price); STATE.niftyHistory.labels.push(STATE.marketTime); niftyChart.update('none'); }
    function renderSingleStockChart(stockName) { if (singleStockChart) singleStockChart.destroy(); const stock = getStock(stockName); if (!stock) return; const data = Array.from({ length: 90 }, () => (stock.day_open * (1 + (Math.random() - 0.5) * 0.2))); const labels = Array.from({ length: 90 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (89 - i)); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }); const canvas = document.getElementById('single-stock-canvas'); if (!canvas) return; const gridColor = document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'; singleStockChart = new Chart(canvas.getContext('2d'), { type: 'line', data: { labels, datasets: [{ label: stockName, data, borderColor: '#3b82f6', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: gridColor } }, x: { grid: { color: gridColor } } } } }); }
    function openStockChartPanel(stockName) { chartPanelEl.innerHTML = `<div class="chart-panel-header"><h2 class="text-xl font-semibold text-primary">${stockName} Chart</h2><button id="close-chart-panel" class="text-3xl font-light text-secondary hover-bg rounded-full w-8 h-8 flex items-center justify-center">×</button></div><div class="chart-panel-body"><canvas id="single-stock-canvas"></canvas></div>`; document.getElementById('close-chart-panel').addEventListener('click', closeStockChartPanel); requestAnimationFrame(() => { chartPanelEl.classList.add('is-open'); renderSingleStockChart(stockName); }); }
    function closeStockChartPanel() { chartPanelEl.classList.remove('is-open'); if (singleStockChart) { singleStockChart.destroy(); singleStockChart = null; } }

    // --- VIEW, MODAL, & TRANSACTION LOGIC ---
    function switchView(viewName) {
        if (!views[viewName]) return;
        // Always re-render the view for dashboard
        if (viewName === 'dashboard') renderDashboardView();
        else if (viewName === 'orders') renderOrdersView();
        else if (viewName === 'holdings') renderHoldingsView();
        else if (viewName === 'journal') JournalApp.renderJournalView(views.journal);
        else if (viewName === 'profile') ProfileApp.renderProfileView(views.profile);

        Object.values(views).forEach(v => v.classList.add('hidden'));
        views[viewName].classList.remove('hidden');
        updateAllUI();
        document.querySelectorAll('#main-nav .nav-link, #profile-dropdown a[data-view]').forEach(link => {
            link.classList.toggle('nav-link-active', link.dataset.view === viewName)
        });
        STATE.currentView = viewName;
        saveState();
    }

    const closeModal = () => { modalOverlay.style.display = 'none'; modalContainer.style.display = 'none'; };
    function openBuySellModal(action, stockName) { const stock = getStock(stockName); modalContainer.innerHTML = `<div class="bg-secondary rounded-lg themed-shadow-lg p-6 w-full max-w-sm"><div class="flex justify-between items-center mb-4"><h3 class="text-xl font-semibold text-primary">${action.toUpperCase()} ${stock.name}</h3><button id="modal-close" class="text-secondary">×</button></div><p class="text-sm text-secondary mb-2">Price: <span class="font-bold text-primary">${stock.price.toFixed(2)}</span></p><div class="mb-4"><label class="block text-sm font-medium text-secondary">Quantity</label><input type="number" id="modal-quantity" class="mt-1 block w-full p-2 border border-color bg-primary rounded" value="1" min="1"></div><p class="text-sm text-secondary">Total: <span id="modal-total-cost" class="font-bold text-primary"></span></p><div class="flex justify-end space-x-3 mt-4"><button id="modal-cancel" class="px-4 py-2 bg-primary rounded hover-bg">Cancel</button><button id="modal-confirm" class="px-4 py-2 bg-blue-600 text-white rounded">Confirm</button></div></div>`; modalOverlay.style.display = 'block'; modalContainer.style.display = 'block'; const qtyInput = document.getElementById('modal-quantity'); const totalCostEl = document.getElementById('modal-total-cost'); const updateTotal = () => totalCostEl.textContent = formatCurrency((parseInt(qtyInput.value) || 0) * stock.price); qtyInput.oninput = updateTotal; updateTotal(); document.getElementById('modal-confirm').onclick = () => { const qty = parseInt(qtyInput.value); if (qty > 0) (action === 'buy' ? handleBuy : handleSell)(stockName, qty); closeModal(); }; document.getElementById('modal-close').onclick = closeModal; document.getElementById('modal-cancel').onclick = closeModal; }

    function openFundsModal() {
        if (!STATE.bankAccounts || STATE.bankAccounts.length === 0) {
            alert("No bank accounts linked. Please add one from your profile page first.");
            switchView('profile');
            return;
        }
        let selectedAccountIndex = 0;
        const showAccountSelection = () => {
            const accountsHtml = STATE.bankAccounts.map((acc, index) => ` <div data-index="${index}" class="bank-account-item cursor-pointer flex justify-between items-center p-4 border rounded-lg ${index === selectedAccountIndex ? 'border-blue-500' : 'border-color'}"> <div> <p class="font-semibold text-primary">${acc.bankName}</p> <p class="text-sm text-secondary">A/C: ...${acc.accountNumber.slice(-4)}</p> </div> <p class="font-mono text-primary">${formatCurrency(acc.balance)}</p> </div> `).join('');
            modalContainer.innerHTML = ` <div class="bg-secondary rounded-lg themed-shadow-lg p-6 w-full max-w-sm"> <div class="flex justify-between items-center mb-4"><h3 class="text-xl font-semibold text-primary">Add Funds</h3><button id="modal-close" class="text-secondary">×</button></div> <p class="text-sm text-secondary mb-4">Select an account to add funds from:</p> <div class="space-y-3 mb-6">${accountsHtml}</div> <div class="flex justify-end space-x-3"><button id="modal-cancel" class="px-4 py-2 bg-primary rounded hover-bg">Cancel</button><button id="modal-proceed" class="px-4 py-2 bg-blue-600 text-white rounded">Proceed</button></div> </div>`;
            document.querySelectorAll('.bank-account-item').forEach(item => { item.addEventListener('click', (e) => { selectedAccountIndex = parseInt(e.currentTarget.dataset.index, 10); showAccountSelection(); }); });
            document.getElementById('modal-proceed').onclick = showAmountInput;
            document.getElementById('modal-close').onclick = closeModal;
            document.getElementById('modal-cancel').onclick = closeModal;
        };
        const showAmountInput = () => {
            const selectedAccount = STATE.bankAccounts[selectedAccountIndex];
            modalContainer.innerHTML = ` <div class="bg-secondary rounded-lg themed-shadow-lg p-6 w-full max-w-sm"> <div class="flex justify-between items-center mb-4"><h3 class="text-xl font-semibold text-primary">Add Funds</h3><button id="modal-close" class="text-secondary">×</button></div> <div class="mb-4"> <p class="text-sm text-secondary">From: ${selectedAccount.bankName} (...${selectedAccount.accountNumber.slice(-4)})</p> <p class="text-sm text-secondary">Available Balance: <span class="font-bold text-primary">${formatCurrency(selectedAccount.balance)}</span></p> </div> <div class="mb-4"> <label class="block text-sm font-medium text-secondary">Amount to Add (INR)</label> <input type="number" id="modal-amount" class="mt-1 block w-full p-2 border border-color bg-primary rounded" placeholder="Enter amount" min="100"> </div> <div class="flex justify-end space-x-3"><button id="modal-back" class="px-4 py-2 bg-primary rounded hover-bg">Back</button><button id="modal-confirm" class="px-4 py-2 bg-blue-600 text-white rounded">Confirm</button></div> </div>`;
            document.getElementById('modal-confirm').onclick = () => { const amountInput = document.getElementById('modal-amount'); const amount = parseFloat(amountInput.value); if (isNaN(amount) || amount <= 0) { alert('Please enter a valid amount.'); return; } if (amount > selectedAccount.balance) { alert('Insufficient funds in the selected bank account.'); return; } STATE.funds.equity += amount; selectedAccount.balance -= amount; saveState(); closeModal(); updateAllUI(); };
            document.getElementById('modal-back').onclick = showAccountSelection;
            document.getElementById('modal-close').onclick = closeModal;
        };
        showAccountSelection();
        modalOverlay.style.display = 'block';
        modalContainer.style.display = 'block';
    }
    
    // --- TRANSACTION FUNCTIONS ---
    function handleBuy(stockName, quantity) { const orderId = STATE.tradeIdCounter++; const order = { id: orderId, time: STATE.marketTime, type: 'BUY', instrument: stockName, quantity, price: getStock(stockName).price, status: 'OPEN' }; STATE.orders.push(order); updateAllUI(); setTimeout(() => { const stock = getStock(stockName); const cost = stock.price * quantity; const executedOrder = STATE.orders.find(o => o.id === orderId); if (STATE.funds.equity < cost) { executedOrder.status = 'REJECTED'; } else { STATE.funds.equity -= cost; const h = STATE.holdings[stockName]; if (h) { h.avgPrice = ((h.avgPrice * h.quantity) + cost) / (h.quantity + quantity); h.quantity += quantity; } else { STATE.holdings[stockName] = { quantity, avgPrice: stock.price }; } executedOrder.status = 'COMPLETE'; executedOrder.price = stock.price; JournalApp.showJournalPrompt(executedOrder); } updateAllUI(); saveState(); }, 500); }    
    function handleSell(stockName, quantity) { const h = STATE.holdings[stockName]; if (!h || h.quantity < quantity) { alert('Insufficient holdings!'); return; } const orderId = STATE.tradeIdCounter++; const order = { id: orderId, time: STATE.marketTime, type: 'SELL', instrument: stockName, quantity, price: getStock(stockName).price, status: 'OPEN' }; STATE.orders.push(order); updateAllUI(); setTimeout(() => { const stock = getStock(stockName); const value = stock.price * quantity; const executedOrder = STATE.orders.find(o => o.id === orderId); STATE.funds.equity += value; h.quantity -= quantity; const openJournalEntryId = Object.keys(STATE.journal).find(id => { const journalEntry = STATE.journal[id]; const buyOrder = STATE.orders.find(o => o.id == id); return journalEntry.status === 'Open' && buyOrder && buyOrder.instrument === stockName; }); if (openJournalEntryId) { STATE.journal[openJournalEntryId].status = 'Closed'; STATE.journal[openJournalEntryId].sellPrice = executedOrder.price; } if (h.quantity === 0) { delete STATE.holdings[stockName]; } executedOrder.status = 'COMPLETE'; executedOrder.price = stock.price; updateAllUI(); if(STATE.currentView === 'journal') { JournalApp.renderJournalView(views.journal); } saveState(); }, 500); }
    
    // --- ** THE CORRECTED updateAllUI FUNCTION ** ---
    function updateAllUI() {
        updateDashboardData();
        updateOrdersData();
        updateHoldingsData();
        updateHeader();
        updateWatchlist();
        updateNiftyChart();
    }

    // --- REVAMPED INITIALIZATION ---
    async function init() {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        STATE = currentUser.accountData;
        const todayString = new Date().toDateString();
        const isNewDay = !STATE.marketDate || STATE.marketDate !== todayString;

        // --- Robust state initialization for new and existing users ---
        if (!STATE.funds || typeof STATE.funds.equity !== 'number') STATE.funds = { equity: 0, commodity: 0 };
        if (!STATE.journal) STATE.journal = {};
        if (!STATE.orders) STATE.orders = [];
        if (!STATE.holdings) STATE.holdings = {};
        if (!STATE.bankAccounts) STATE.bankAccounts = [];
        if (!STATE.tradeIdCounter) STATE.tradeIdCounter = 1;
        if (STATE.chartPreference === undefined) STATE.chartPreference = 'TradingView';
        if (STATE.instantOrderUpdates === undefined) STATE.instantOrderUpdates = true;
        if (STATE.stickyOrderWindow === undefined) STATE.stickyOrderWindow = false;

        JournalApp.initialize(STATE, saveState, getStock, updateAllUI);
        ProfileApp.initialize(STATE, saveState, formatCurrency, toggleTheme);

        if (isNewDay) {
            STATE.marketDate = todayString;
            STATE.orders = STATE.orders ? STATE.orders.filter(o => o.status === 'OPEN') : [];
            try { STOCKS_MASTER_LIST = await fetchLiveMarketData(); } 
            catch (error) { console.error("Initial fetch failed. Falling back to local data.", error); STOCKS_MASTER_LIST = getFallbackData(); }
            STOCKS_LIVE_DATA = STOCKS_MASTER_LIST.map(s => ({ ...s, day_open: s.price, change: 0, changePct: 0 }));
            if (STATE.holdings) { const validStockNames = new Set(STOCKS_MASTER_LIST.map(s => s.name)); for (const holdingName in STATE.holdings) { if (!validStockNames.has(holdingName)) delete STATE.holdings[holdingName]; } }
            STATE.niftyHistory = { labels: [], data: [] };
        } else {
            STOCKS_LIVE_DATA = STATE.stocks_today;
        }

        STATE.marketTime = getCurrentTimeFormatted();

        applyTheme(localStorage.getItem('theme') || 'light');
        document.getElementById('username-display').textContent = currentUser.name.split(' ')[0].toUpperCase();
        document.getElementById('profile-button').textContent = currentUser.name.charAt(0).toUpperCase();
        document.getElementById('dropdown-username').textContent = currentUser.name;
        document.getElementById('dropdown-email').textContent = currentUser.email;

        // --- EVENT LISTENERS ---
        document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
        document.getElementById('logout-button').addEventListener('click', () => { clearInterval(marketUpdateInterval); sessionStorage.removeItem(SESSION_KEY); window.location.href = 'login.html'; });
        document.getElementById('profile-button').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('profile-dropdown').style.display = 'block'; });
        document.addEventListener('click', (e) => {
            document.getElementById('profile-dropdown').style.display = 'none'; 
            closeStockChartPanel();
            const viewTarget = e.target.closest('a[data-view]');
            if(viewTarget && document.getElementById('profile-dropdown').contains(viewTarget)) {
                switchView(viewTarget.dataset.view);
            }
        });
        chartPanelEl.addEventListener('click', e => e.stopPropagation());
        document.getElementById('main-nav').addEventListener('click', (e) => { if (e.target.dataset.view) switchView(e.target.dataset.view); });
        watchlistEl.addEventListener('click', (e) => { const btn = e.target.closest('button[data-action]'); if (btn) { const { action, stock } = btn.dataset; if (action === 'buy' || action === 'sell') { openBuySellModal(action, stock); } else if (action === 'view-chart') { openStockChartPanel(stock); } } });
        views.holdings.addEventListener('click', (e) => { const btn = e.target.closest('button[data-action]'); if (btn && btn.dataset.action === 'sell') { openBuySellModal('sell', btn.dataset.stock); } });
        const searchInputEl = document.querySelector('aside input[type="text"]');
        if (searchInputEl) { searchInputEl.addEventListener('input', () => { updateWatchlist(); }); }
        
        // --- NEW USER FLOW ---
        if (!STATE.bankAccounts || STATE.bankAccounts.length === 0) {
            alert("Welcome to ZenTrade! Please link a bank account to add funds before you can start trading.");
            switchView('profile');
        } else {
            switchView(STATE.currentView || 'dashboard');
        }
        
        marketUpdateInterval = setInterval(marketUpdateLoop, 1000);
        await marketUpdateLoop(); 
    }

    init().catch(err => { console.error("Fatal error during initialization:", err); document.body.innerHTML = `<div class="text-center p-8"><h1 class="text-2xl font-bold text-red-500">Application Error</h1><p class="text-secondary mt-2">Could not initialize the simulation. Please try refreshing.</p></div>`});
});