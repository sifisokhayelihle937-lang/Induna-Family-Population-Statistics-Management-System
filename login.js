
// LOGIN CONTROLLER


document.addEventListener('DOMContentLoaded', () => {

    const loginForm =
        document.getElementById('loginForm');

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener(
        'submit',
        async (e) => {

            e.preventDefault();

            const usernameInput =
                document.getElementById('username')
                    .value
                    .trim();

            const passwordInput =
                document.getElementById('password')
                    .value;

            const loginButton =
                document.getElementById('loginBtn');

            loginButton.innerText =
                'Signing In...';

            loginButton.disabled =
                true;

            try {

                const response =
                    await fetch(
                        'http://localhost:3000/api/login',
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type': 'application/json'
                            },

                            body: JSON.stringify({
                                username: usernameInput,
                                password: passwordInput
                            })
                        }
                    );

                const data =
                    await response.json();

                if (response.ok) {

                  
                    // SESSION STORAGE
                   

                    sessionStorage.setItem(
                        'accountId',
                        data.accountId
                    );

                    sessionStorage.setItem(
                        'personId',
                        data.personId
                    );

                    sessionStorage.setItem(
                        'roleName',
                        data.roleName
                    );

                    const role =
                        data.roleName.toLowerCase();

                    
                    // REDIRECT BY ROLE
                    

                    if (role === 'itadmin') {

                        window.location.href =
                            'Admin.html';

                    }
                    else if (role === 'induna') {

                        window.location.href =
                            'Induna.html';

                    }
                    else if (role === 'resident') {

                        window.location.href =
                            'Resident.html';

                    }
                    else {

                        alert(
                            'Unknown user role.'
                        );

                        loginButton.innerText =
                            'Sign In';

                        loginButton.disabled =
                            false;
                    }

                } else {

                    alert(
                        data.error ||
                        'Login failed.'
                    );

                    loginButton.innerText =
                        'Sign In';

                    loginButton.disabled =
                        false;
                }

            } catch (err) {

                console.error(
                    'Login Error:',
                    err
                );

                alert(
                    'Failed to connect to backend server.'
                );

                loginButton.innerText =
                    'Sign In';

                loginButton.disabled =
                    false;
            }

        }
    );

});