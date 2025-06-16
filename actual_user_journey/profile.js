// --- profile.js ---

window.ProfileApp = (function () {
    // --- PRIVATE STATE & HELPERS ---
    let stateRef, saveStateRef, formatCurrencyRef, toggleThemeRef;

    const renderProfileView = (container) => {
        const currentUser = JSON.parse(localStorage.getItem('kite_simulation_users')).find(u => u.mobile === sessionStorage.getItem('kite_simulation_session'));
        
        // --- Initialize state for new settings if they don't exist ---
        if (stateRef.chartPreference === undefined) stateRef.chartPreference = 'TradingView';
        if (stateRef.instantOrderUpdates === undefined) stateRef.instantOrderUpdates = true;
        if (stateRef.stickyOrderWindow === undefined) stateRef.stickyOrderWindow = false;
        if (!stateRef.bankAccounts) stateRef.bankAccounts = [];
        if (!stateRef.pan) stateRef.pan = `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`;
        if (!stateRef.dematBO) stateRef.dematBO = `1200000000${Math.floor(100000 + Math.random() * 900000)}`;

        const currentTheme = document.documentElement.classList.contains('dark') ? 'Dark' : 'Default';

        container.innerHTML = `
            <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left Column -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Profile Header -->
                    <div>
                        <h2 class="text-2xl font-semibold text-primary mb-4">Profile</h2>
                        <div class="bg-secondary p-6 rounded-lg themed-shadow flex items-center space-x-6">
                            <div class="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">${currentUser.name.charAt(0).toUpperCase()}</div>
                            <div>
                                <h3 class="text-xl font-bold text-primary">${currentUser.name}</h3>
                                <p class="text-sm text-secondary">${currentUser.email}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Account Details -->
                    <div class="bg-secondary p-6 rounded-lg themed-shadow">
                        <h3 class="text-xl font-semibold text-primary mb-6">Account</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                            <div class="flex justify-between border-b border-color pb-2"><span class="text-secondary">Support code</span><span class="font-medium text-primary">123456</span></div>
                            <div class="flex justify-between border-b border-color pb-2"><span class="text-secondary">PAN</span><span class="font-medium text-primary">${stateRef.pan}</span></div>
                            <div class="flex justify-between border-b border-color pb-2"><span class="text-secondary">E-mail</span><span class="font-medium text-primary">${currentUser.email}</span></div>
                            <div class="flex justify-between border-b border-color pb-2"><span class="text-secondary">Phone</span><span class="font-medium text-primary">${currentUser.mobile}</span></div>
                            <div class="flex justify-between border-b border-color pb-2"><span class="text-secondary">Demat (BO)</span><span class="font-medium text-primary">${stateRef.dematBO}</span></div>
                            <div class="flex justify-between border-b border-color pb-2"><span class="text-secondary">Segments</span><span class="font-medium text-primary">NFO, MF, CDS, MCX, BSE, NSE</span></div>
                            <div class="flex justify-between border-b border-color pb-2"><span class="text-secondary">Demat authorisation</span><span class="font-medium text-primary">POA</span></div>
                        </div>
                    </div>

                    <!-- Bank Accounts -->
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-xl font-semibold text-primary">Bank Accounts</h2>
                            <button id="add-account-btn" class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Link New Account</button>
                        </div>
                        <div id="bank-accounts-container" class="bg-secondary p-6 rounded-lg themed-shadow space-y-4"></div>
                    </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-8">
                    <!-- Settings -->
                    <div class="bg-secondary p-6 rounded-lg themed-shadow">
                        <h3 class="text-xl font-semibold text-primary mb-6">Settings</h3>
                        <div class="space-y-6 text-sm">
                            <div>
                                <p class="font-medium text-primary mb-2">Chart</p>
                                <div class="flex space-x-4">
                                    <label class="flex items-center"><input type="radio" name="chart-pref" value="ChartIQ" class="mr-2" ${stateRef.chartPreference === 'ChartIQ' ? 'checked' : ''}> ChartIQ</label>
                                    <label class="flex items-center"><input type="radio" name="chart-pref" value="TradingView" class="mr-2" ${stateRef.chartPreference === 'TradingView' ? 'checked' : ''}> TradingView</label>
                                </div>
                            </div>
                            <div>
                                <p class="font-medium text-primary mb-2">Theme</p>
                                <div class="flex space-x-4">
                                    <label class="flex items-center"><input type="radio" name="theme-pref" value="Default" class="mr-2" ${currentTheme === 'Default' ? 'checked' : ''}> Default</label>
                                    <label class="flex items-center"><input type="radio" name="theme-pref" value="Dark" class="mr-2" ${currentTheme === 'Dark' ? 'checked' : ''}> Dark</label>
                                </div>
                            </div>
                            <div class="flex justify-between items-center">
                                <label for="instant-updates-toggle" class="font-medium text-primary">Instant order updates</label>
                                <label class="switch"><input type="checkbox" id="instant-updates-toggle" ${stateRef.instantOrderUpdates ? 'checked' : ''}><span class="slider round"></span></label>
                            </div>
                            <div class="flex justify-between items-center">
                                <label for="sticky-window-toggle" class="font-medium text-primary">Sticky order window</label>
                                <label class="switch"><input type="checkbox" id="sticky-window-toggle" ${stateRef.stickyOrderWindow ? 'checked' : ''}><span class="slider round"></span></label>
                            </div>
                        </div>
                    </div>
                     <!-- Sessions -->
                    <div class="bg-secondary p-6 rounded-lg themed-shadow">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-semibold text-primary">Sessions</h3>
                            <button id="clear-sessions-btn" class="text-xs text-blue-500 hover:underline">Clear all</button>
                        </div>
                        <ul class="list-disc list-inside text-sm text-secondary"><li>Kite web</li></ul>
                    </div>
                </div>
            </div>`;
        
        renderBankAccounts();
        addEventListeners();
    };

    const renderBankAccounts = () => { /* This function remains unchanged */ const container = document.getElementById('bank-accounts-container'); if (!container) return; if (stateRef.bankAccounts.length === 0) { container.innerHTML = `<p class="text-secondary text-center">No bank accounts linked. Click 'Link New Account' to get started.</p>`; return; } container.innerHTML = stateRef.bankAccounts.map((acc, index) => ` <div class="flex justify-between items-center p-4 border border-color rounded-lg hover-bg"> <div> <p class="font-semibold text-primary">${acc.bankName}</p> <p class="text-sm text-secondary">A/C: *******${acc.accountNumber.slice(-4)}</p> </div> <div class="text-right"> <p class="font-mono text-primary">${formatCurrencyRef(acc.balance)}</p> <button data-index="${index}" class="unlink-account-btn text-xs text-red-500 hover:underline">Unlink</button> </div> </div> `).join(''); document.querySelectorAll('.unlink-account-btn').forEach(btn => { btn.addEventListener('click', (e) => { const indexToRemove = parseInt(e.target.dataset.index, 10); if (confirm('Are you sure you want to unlink this account?')) { stateRef.bankAccounts.splice(indexToRemove, 1); saveStateRef(); renderBankAccounts(); } }); }); };
    
    const showAddAccountForm = () => { /* This function remains unchanged */ const container = document.getElementById('bank-accounts-container'); container.innerHTML = ` <div id="add-account-form" class="p-4 border border-blue-500 rounded-lg space-y-4"> <h4 class="font-semibold text-primary">Link Bank Account</h4> <div> <label class="block text-sm font-medium text-secondary">Bank Name</label> <input type="text" id="new-bank-name" placeholder="e.g., ICICI Bank" class="mt-1 block w-full p-2 border border-color bg-primary rounded"> </div> <div> <label class="block text-sm font-medium text-secondary">Account Number</label> <input type="text" id="new-account-number" placeholder="Enter 12-digit number" class="mt-1 block w-full p-2 border border-color bg-primary rounded"> </div> <div> <label class="block text-sm font-medium text-secondary">IFSC Code</label> <input type="text" id="new-ifsc-code" placeholder="e.g., ICIC0001234" class="mt-1 block w-full p-2 border border-color bg-primary rounded"> </div> <div class="flex justify-end space-x-3"> <button id="cancel-add-account" class="px-4 py-2 bg-primary rounded hover-bg">Cancel</button> <button id="confirm-add-account" class="px-4 py-2 bg-blue-600 text-white rounded">Link Account</button> </div> </div> `; document.getElementById('add-account-btn').style.display = 'none'; document.getElementById('confirm-add-account').addEventListener('click', () => { const bankName = document.getElementById('new-bank-name').value.trim(); const accountNumber = document.getElementById('new-account-number').value.trim(); const ifsc = document.getElementById('new-ifsc-code').value.trim(); if (bankName && accountNumber.length === 12 && /^\d+$/.test(accountNumber) && ifsc) { const newAccount = { bankName, accountNumber, ifsc, balance: Math.floor(Math.random() * (500000 - 10000 + 1)) + 10000 }; stateRef.bankAccounts.push(newAccount); saveStateRef(); document.getElementById('add-account-btn').style.display = 'block'; renderBankAccounts(); } else { alert('Please fill all fields correctly. Account number must be 12 digits.'); } }); document.getElementById('cancel-add-account').addEventListener('click', () => { document.getElementById('add-account-btn').style.display = 'block'; renderBankAccounts(); }); };

    const addEventListeners = () => {
        document.getElementById('add-account-btn').addEventListener('click', showAddAccountForm);
        document.getElementById('clear-sessions-btn').addEventListener('click', () => alert('All other sessions would be cleared. This is the only active session.'));

        // Chart preference
        document.querySelectorAll('input[name="chart-pref"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                stateRef.chartPreference = e.target.value;
                saveStateRef();
            });
        });

        // Theme preference
        document.querySelectorAll('input[name="theme-pref"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const currentTheme = document.documentElement.classList.contains('dark') ? 'Dark' : 'Default';
                if(e.target.value !== currentTheme) {
                    toggleThemeRef();
                }
            });
        });
        
        // Toggles
        document.getElementById('instant-updates-toggle').addEventListener('change', (e) => {
            stateRef.instantOrderUpdates = e.target.checked;
            saveStateRef();
        });
        document.getElementById('sticky-window-toggle').addEventListener('change', (e) => {
            stateRef.stickyOrderWindow = e.target.checked;
            saveStateRef();
        });
    };

    return {
        initialize: (mainState, mainSaveState, mainFormatCurrency, mainToggleTheme) => {
            stateRef = mainState;
            saveStateRef = mainSaveState;
            formatCurrencyRef = mainFormatCurrency;
            toggleThemeRef = mainToggleTheme; // Capture the theme toggle function
        },
        renderProfileView,
    };
})();

// Inject CSS for toggle switches
document.head.insertAdjacentHTML('beforeend', `
<style>
.switch{position:relative;display:inline-block;width:34px;height:20px}.switch input{opacity:0;width:0;height:0}.slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:#ccc;transition:.4s}.slider:before{position:absolute;content:"";height:12px;width:12px;left:4px;bottom:4px;background-color:#fff;transition:.4s}input:checked+.slider{background-color:#2196F3}input:focus+.slider{box-shadow:0 0 1px #2196F3}input:checked+.slider:before{transform:translateX(14px)}.slider.round{border-radius:34px}.slider.round:before{border-radius:50%}
</style>`);