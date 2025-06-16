// --- journal.js ---

window.JournalApp = (function () {
    // --- PRIVATE STATE & HELPERS ---
    // MODIFIED: Added updateAllUIRef
    let stateRef, saveStateRef, getStockRef, updateAllUIRef;

    const formatPnl = (pnl) => {
        const pnlStr = pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const pnlClass = pnl >= 0 ? 'text-positive' : 'text-negative';
        return `<span class="${pnlClass}">${pnl >= 0 ? '+' : ''}${pnlStr}</span>`;
    };

    // --- CORE RENDERING FUNCTIONS ---
    function renderJournalView(container) {
        container.innerHTML = `
            <div class="space-y-8">
                <div>
                    <h2 class="text-2xl font-semibold text-primary mb-4">Trade-Mind Insights</h2>
                    <div id="journal-insights-container" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-secondary rounded-lg themed-shadow p-6">
                            <h3 class="text-lg font-semibold text-primary mb-4">Your Trading Habits</h3>
                            <div id="habit-insights-content" class="space-y-3"></div>
                        </div>
                        <div class="bg-secondary rounded-lg themed-shadow p-6">
                            <h3 class="text-lg font-semibold text-primary mb-4">Your Most Profitable Rationale</h3>
                            <div id="profit-insights-content" class="space-y-3"></div>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 class="text-2xl font-semibold text-primary mb-4">Trade Logbook</h2>
                    <div class="bg-secondary rounded-lg themed-shadow overflow-hidden">
                        <table class="w-full text-sm">
                            <thead class="bg-primary text-xs uppercase text-secondary">
                                <tr>
                                    <th class="px-4 py-3 text-left">Instrument</th>
                                    <th class="px-4 py-3 text-left">Rationale</th>
                                    <th class="px-4 py-3 text-center">Conviction</th>
                                    <th class="px-4 py-3 text-right">Outcome</th>
                                </tr>
                            </thead>
                            <tbody id="journal-logbook-table" class="divide-y border-color"></tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        
        updateJournalInsights();
        updateJournalLogbook();
    }

    function updateJournalLogbook() {
        const tableBody = document.getElementById('journal-logbook-table');
        if (!tableBody) return;

        const logbookEntries = Object.entries(stateRef.journal || {})
            .map(([orderId, journalEntry]) => {
                const buyOrder = stateRef.orders.find(o => o.id == orderId);
                if (!buyOrder) return '';

                let outcomeHtml;
                if (journalEntry.status === 'Closed') {
                    const finalPnl = (journalEntry.sellPrice - journalEntry.buyPrice) * journalEntry.quantity;
                    outcomeHtml = `P&L: ${formatPnl(finalPnl)}`;
                } else {
                    const initialInvestment = journalEntry.buyPrice * journalEntry.quantity;
                    const investmentStr = initialInvestment.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
                    outcomeHtml = `<span class="text-secondary">BUY: ${investmentStr}</span>`;
                }

                return `
                    <tr class="hover-bg">
                        <td class="p-4 font-medium text-primary">${buyOrder.instrument} <span class="text-xs text-secondary">(${journalEntry.quantity} @ ${journalEntry.buyPrice.toFixed(2)})</span></td>
                        <td class="p-4 text-secondary">${journalEntry.rationale}</td>
                        <td class="p-4 text-center text-yellow-400">${'★'.repeat(journalEntry.conviction)}${'☆'.repeat(5 - journalEntry.conviction)}</td>
                        <td class="p-4 text-right font-mono">${outcomeHtml}</td>
                    </tr>`;
            })
            .reverse()
            .join('');

        tableBody.innerHTML = logbookEntries || `<tr><td colspan="4" class="p-6 text-center text-secondary">Buy a stock to start your journal!</td></tr>`;
    }

    function updateJournalInsights() {
        const habitContainer = document.getElementById('habit-insights-content');
        const profitContainer = document.getElementById('profit-insights-content');
        if (!habitContainer || !profitContainer) return;
        if (Object.keys(stateRef.journal || {}).length === 0) {
            habitContainer.innerHTML = `<div class="text-secondary text-center pt-8">Your habits will appear here as you log trades.</div>`;
            profitContainer.innerHTML = `<div class="text-secondary text-center pt-8">Your profitability will be calculated when you sell.</div>`;
            return;
        }
        const rationaleCounts = {};
        Object.values(stateRef.journal).forEach(entry => { rationaleCounts[entry.rationale] = (rationaleCounts[entry.rationale] || 0) + 1; });
        const maxCount = Math.max(...Object.values(rationaleCounts), 1);
        habitContainer.innerHTML = Object.entries(rationaleCounts).map(([rationale, count]) => `<div class="flex items-center"><span class="w-28 text-sm text-secondary">${rationale}</span><div class="flex-1 bg-primary rounded-full h-4 mr-2"><div class="bg-blue-500 h-4 rounded-full" style="width: ${(count / maxCount) * 100}%"></div></div><span class="w-12 text-right font-mono text-sm text-primary">${count}</span></div>`).join('');
        const pnlByRationale = {};
        let closedTrades = 0;
        Object.values(stateRef.journal).filter(j => j.status === 'Closed').forEach(entry => {
            closedTrades++;
            const finalPnl = (entry.sellPrice - entry.buyPrice) * entry.quantity;
            pnlByRationale[entry.rationale] = (pnlByRationale[entry.rationale] || 0) + finalPnl;
        });
        if (closedTrades > 0) {
            const maxPnl = Math.max(...Object.values(pnlByRationale).map(Math.abs), 1);
            profitContainer.innerHTML = Object.entries(pnlByRationale).map(([rationale, pnl]) => `<div class="flex items-center"><span class="w-28 text-sm text-secondary">${rationale}</span><div class="flex-1 bg-primary rounded-full h-4 mr-2"><div class="${pnl >= 0 ? 'bg-positive' : 'bg-negative'} h-4 rounded-full" style="width: ${(Math.abs(pnl) / maxPnl) * 100}%"></div></div><span class="w-20 text-right font-mono text-sm">${formatPnl(pnl, true)}</span></div>`).join('');
        } else {
            profitContainer.innerHTML = `<div class="text-secondary text-center pt-8">Sell a stock to see your profitable rationales.</div>`;
        }
    }

    // --- POST-TRADE PROMPT LOGIC ---
    function showJournalPrompt(order) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        const toastId = `toast-${order.id}`;
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = 'bg-secondary themed-shadow-lg rounded-lg p-4 w-full transition-all transform translate-x-full opacity-0 animate-slide-in';
        toast.innerHTML = `<h4 class="font-bold text-primary">Log your ${order.instrument} ${order.type}</h4> <p class="text-xs text-secondary mb-3">How are you feeling about this trade?</p> <div class="mb-3"> <p class="text-sm font-medium text-secondary">Rationale</p> <div id="rationale-tags-${order.id}" class="flex flex-wrap gap-2 mt-1"> <button class="journal-tag">Technical</button> <button class="journal-tag">Fundamental</button> <button class="journal-tag">News-Driven</button> <button class="journal-tag">Gut Feeling</button> <button class="journal-tag">FOMO</button> </div> </div> <div class="mb-3"> <p class="text-sm font-medium text-secondary">Conviction</p> <div id="conviction-stars-${order.id}" class="flex items-center text-2xl text-gray-400"> <span class="star cursor-pointer" data-value="1">★</span> <span class="star cursor-pointer" data-value="2">★</span> <span class="star cursor-pointer" data-value="3">★</span> <span class="star cursor-pointer" data-value="4">★</span> <span class="star cursor-pointer" data-value="5">★</span> </div> </div> <div class="flex justify-end space-x-2 mt-4"> <button id="skip-btn-${order.id}" class="px-3 py-1 text-sm bg-primary rounded hover-bg">Skip</button> <button id="save-btn-${order.id}" class="px-3 py-1 text-sm bg-blue-600 text-white rounded opacity-50 cursor-not-allowed" disabled>Save</button> </div>`;
        toastContainer.appendChild(toast);
        let selectedRationale, selectedConviction;
        const saveBtn = document.getElementById(`save-btn-${order.id}`);
        const checkCanSave = () => { if (selectedRationale && selectedConviction) { saveBtn.disabled = false; saveBtn.classList.remove('opacity-50', 'cursor-not-allowed'); } };
        const rationaleTags = document.getElementById(`rationale-tags-${order.id}`);
        rationaleTags.addEventListener('click', (e) => { if (e.target.classList.contains('journal-tag')) { [...rationaleTags.children].forEach(c => c.classList.remove('journal-tag-selected')); e.target.classList.add('journal-tag-selected'); selectedRationale = e.target.textContent; checkCanSave(); } });
        const stars = document.getElementById(`conviction-stars-${order.id}`);
        stars.addEventListener('mouseover', (e) => { if (e.target.classList.contains('star')) { const v = e.target.dataset.value; [...stars.children].forEach((s, i) => s.style.color = i < v ? '#f59e0b' : '#9ca3af'); } });
        stars.addEventListener('mouseout', () => { [...stars.children].forEach((s, i) => s.style.color = i < (selectedConviction || 0) ? '#f59e0b' : '#9ca3af'); });
        stars.addEventListener('click', (e) => { if (e.target.classList.contains('star')) { selectedConviction = e.target.dataset.value; checkCanSave(); } });
        const closeToast = () => { toast.classList.add('animate-slide-out'); toast.addEventListener('animationend', () => toast.remove()); };
        
        saveBtn.addEventListener('click', () => {
            stateRef.journal[order.id] = { rationale: selectedRationale, conviction: parseInt(selectedConviction), status: 'Open', buyPrice: order.price, quantity: order.quantity };
            saveStateRef();
            // --- THE FIX ---
            // This tells the main app to re-render all UI components, ensuring the journal updates immediately.
            if (updateAllUIRef) {
                updateAllUIRef();
            }
            closeToast();
        });
        document.getElementById(`skip-btn-${order.id}`).addEventListener('click', closeToast);
    }

    return {
        // MODIFIED: Accept the new function
        initialize: (mainState, mainSaveState, mainGetStock, mainUpdateAllUI) => { 
            stateRef = mainState; 
            saveStateRef = mainSaveState; 
            getStockRef = mainGetStock; 
            updateAllUIRef = mainUpdateAllUI; // Store it
        },
        renderJournalView,
        showJournalPrompt,
    };
})();

document.head.insertAdjacentHTML('beforeend', `<style> .journal-tag { background-color: var(--bg-primary); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 999px; font-size: 0.8rem; transition: all 0.2s ease; } .journal-tag:hover { border-color: #3b82f6; } .journal-tag-selected { background-color: #3b82f6; color: white; border-color: #3b82f6; } @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } .animate-slide-in { animation: slide-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; } @keyframes slide-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(110%); opacity: 0; } } .animate-slide-out { animation: slide-out 0.3s ease-in forwards; } </style>`);