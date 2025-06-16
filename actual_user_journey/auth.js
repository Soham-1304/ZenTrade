document.addEventListener('DOMContentLoaded', () => {
    const USER_DB_KEY = 'kite_simulation_users';
    const SESSION_KEY = 'kite_simulation_session';

    const getUsers = () => JSON.parse(localStorage.getItem(USER_DB_KEY)) || [];
    const saveUsers = (users) => localStorage.setItem(USER_DB_KEY, JSON.stringify(users));

    // --- Sign Up Logic ---
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const errorEl = document.getElementById('signup-error');
            errorEl.classList.add('hidden'); // Hide previous errors

            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const mobile = document.getElementById('signup-mobile').value;
            const pin = document.getElementById('signup-pin').value;

            // Simple Validation
            if (!/^\d{10}$/.test(mobile)) {
                errorEl.textContent = 'Mobile number must be 10 digits.';
                errorEl.classList.remove('hidden');
                return;
            }
            if (!/^\d{4}$/.test(pin)) {
                errorEl.textContent = 'PIN must be exactly 4 digits.';
                errorEl.classList.remove('hidden');
                return;
            }

            const users = getUsers();
            if (users.find(u => u.mobile === mobile)) {
                errorEl.textContent = 'A user with this mobile number already exists.';
                errorEl.classList.remove('hidden');
                return;
            }
            
            // --- FIX: Create a new user with the correct data structure ---
            const newUser = {
                name, email, mobile, pin,
                accountData: {
                    funds: { equity: 0, commodity: 0 }, // Start with 0 funds
                    bankAccounts: [], // Start with an empty bank accounts array
                    holdings: {},
                    orders: [],
                    journal: {},
                    tradeIdCounter: 1,
                    currentView: 'dashboard'
                }
            };
            users.push(newUser);
            saveUsers(users);
            
            alert('Account created successfully! Please log in.');
            window.location.href = 'login.html'; // Redirect to the login page (assuming index.html is login)
        });
    }

    // --- Login Logic ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const errorEl = document.getElementById('login-error');
            const mobile = document.getElementById('login-mobile').value;
            const pin = document.getElementById('login-pin').value;

            const users = getUsers();
            const user = users.find(u => u.mobile === mobile);

            if (user && user.pin === pin) {
                sessionStorage.setItem(SESSION_KEY, mobile);
                window.location.href = 'dashboard.html';
            } else {
                errorEl.textContent = 'Invalid mobile number or PIN.';
                errorEl.classList.remove('hidden');
            }
        });
    }
});