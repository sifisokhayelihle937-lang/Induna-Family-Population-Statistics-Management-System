// ======================================================
// PROFILE MANAGEMENT
// ======================================================

document.addEventListener('DOMContentLoaded', () => {

    const personId =
        sessionStorage.getItem('personId');

    if (!personId) {

        alert(
            'Session expired. Please login again.'
        );

        window.location.href =
            'login.html';

        return;

    }

    loadProfile();

    const saveBtn =
        document.getElementById(
            'saveProfileBtn'
        );

    if (saveBtn) {

        saveBtn.addEventListener(
            'click',
            saveProfile
        );

    }

    const passwordBtn =
        document.getElementById(
            'changePasswordBtn'
        );

    if (passwordBtn) {

        passwordBtn.addEventListener(
            'click',
            changePassword
        );

    }

});

// ======================================================
// LOAD PROFILE
// ======================================================

async function loadProfile() {

    const personId =
        sessionStorage.getItem(
            'personId'
        );

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/profile/${personId}`
            );

        const data =
            await response.json();

        console.log(data);

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Failed to load profile.'
            );

        }

        document.getElementById(
            'firstName'
        ).value =
            data.first_name || '';

        document.getElementById(
            'lastName'
        ).value =
            data.last_name || '';

        document.getElementById(
            'idNumber'
        ).value =
            data.id_number || '';

        document.getElementById(
            'contactNumber'
        ).value =
            data.contact || '';

        document.getElementById(
            'emailAddress'
        ).value =
            data.email_address || '';

        document.getElementById(
            'dateOfBirth'
        ).value =
            data.date_of_birth || '';

        document.getElementById(
            'username'
        ).value =
            data.username || '';

        document.getElementById(
            'roleName'
        ).value =
            data.role_name || '';

        // =====================================
        // INDUNA
        // =====================================

        if (
            data.role_name === 'Induna'
        ) {

            document
                .getElementById(
                    'traditionalNameSection'
                )
                .classList
                .remove(
                    'hidden'
                );

            document
                .getElementById(
                    'villageSection'
                )
                .classList
                .remove(
                    'hidden'
                );

            document
                .getElementById(
                    'traditionalName'
                )
                .value =
                    data.traditional_name || '';

            document
                .getElementById(
                    'villageName'
                )
                .value =
                    data.village_name || '';

        }

        // =====================================
        // IT ADMIN
        // =====================================

        if (
            data.role_name === 'ITAdmin'
        ) {

            document
                .getElementById(
                    'villageSection'
                )
                .classList
                .remove(
                    'hidden'
                );

            document
                .getElementById(
                    'villageName'
                )
                .value =
                    data.village_name || '';

        }

    }

    catch (err) {

        console.error(
            'PROFILE LOAD ERROR:',
            err
        );

        alert(
            'Failed to load profile.'
        );

    }

}

// ======================================================
// SAVE PROFILE
// ======================================================

async function saveProfile() {

    const personId =
        sessionStorage.getItem(
            'personId'
        );

    const firstName =
        document
            .getElementById(
                'firstName'
            )
            .value
            .trim();

    const lastName =
        document
            .getElementById(
                'lastName'
            )
            .value
            .trim();

    const contact =
        document
            .getElementById(
                'contactNumber'
            )
            .value
            .trim();

    const emailAddress =
        document
            .getElementById(
                'emailAddress'
            )
            .value
            .trim();

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/profile/update',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        personId,
                        firstName,
                        lastName,
                        contact,
                        emailAddress

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
            'Profile updated successfully.'
        );

    }

    catch (err) {

        console.error(err);

        alert(
            'Failed to update profile.'
        );

    }

}

// ======================================================
// CHANGE PASSWORD
// ======================================================

async function changePassword() {

    const personId =
        sessionStorage.getItem(
            'personId'
        );

    const currentPassword =
        document
            .getElementById(
                'currentPassword'
            )
            .value;

    const newPassword =
        document
            .getElementById(
                'newPassword'
            )
            .value;

    const confirmPassword =
        document
            .getElementById(
                'confirmPassword'
            )
            .value;

    if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
    ) {

        alert(
            'Please complete all password fields.'
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
                'http://localhost:3000/api/profile/change-password',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        personId,
                        currentPassword,
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
            'Password changed successfully.'
        );

        document.getElementById(
            'currentPassword'
        ).value = '';

        document.getElementById(
            'newPassword'
        ).value = '';

        document.getElementById(
            'confirmPassword'
        ).value = '';

    }

    catch (err) {

        console.error(err);

        alert(
            'Failed to change password.'
        );

    }

}