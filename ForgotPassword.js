// ======================================================
// FORGOT PASSWORD
// ======================================================

let accountVerified = false;

// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        document
            .getElementById('verifyBtn')
            .addEventListener(
                'click',
                verifyAccount
            );

        document
            .getElementById('resetBtn')
            .addEventListener(
                'click',
                resetPassword
            );

    }
);

// ======================================================
// VERIFY ACCOUNT
// ======================================================

async function verifyAccount() {

    const username =
        document
            .getElementById('username')
            .value
            .trim();

    const email =
        document
            .getElementById('email')
            .value
            .trim();

    if (!username || !email) {

        alert(
            'Please enter username and email.'
        );

        return;

    }

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/forgot-password/verify',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        username,
                        email

                    })

                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error
            );

            return;

        }

        accountVerified = true;

        document
            .getElementById('resetSection')
            .classList
            .remove('hidden');

        alert(
            'Account verified successfully.'
        );

    }

    catch (err) {

        console.error(err);

        alert(
            'Verification failed.'
        );

    }

}

// ======================================================
// RESET PASSWORD
// ======================================================

async function resetPassword() {

    if (!accountVerified) {

        alert(
            'Please verify your account first.'
        );

        return;

    }

    const username =
        document
            .getElementById('username')
            .value
            .trim();

    const email =
        document
            .getElementById('email')
            .value
            .trim();

    const newPassword =
        document
            .getElementById('newPassword')
            .value;

    const confirmPassword =
        document
            .getElementById('confirmPassword')
            .value;

    if (
        !newPassword ||
        !confirmPassword
    ) {

        alert(
            'Please enter both password fields.'
        );

        return;

    }

    if (
        newPassword !==
        confirmPassword
    ) {

        alert(
            'Passwords do not match.'
        );

        return;

    }

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/forgot-password/reset',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        username,
                        email,
                        newPassword

                    })

                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error
            );

            return;

        }

        alert(
            'Password reset successfully.'
        );

        window.location.href =
            'login.html';

    }

    catch (err) {

        console.error(err);

        alert(
            'Failed to reset password.'
        );

    }

}