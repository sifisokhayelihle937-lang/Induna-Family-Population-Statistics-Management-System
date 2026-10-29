// ======================================================
// INDUNA MANAGEMENT CONTROLLER
// ======================================================

document.addEventListener('DOMContentLoaded', () => {

    const personId = sessionStorage.getItem('personId');

    if (!personId) {

        alert('Session expired. Please login again.');
        window.location.href = 'login.html';
        return;
    }

    loadCurrentInduna(personId);

    // ==========================================
    // REGISTER INDUNA
    // ==========================================

    const form =
        document.getElementById('assignIndunaForm');

    if (form) {

        form.addEventListener('submit', async (e) => {

            e.preventDefault();

            const password =
                document.getElementById('password').value;

            const confirmPassword =
                document.getElementById('confirmPassword').value;

            const idNumber =
                document.getElementById('idNumber').value.trim();

            const contact =
                document.getElementById('contact').value.trim();

            const email =
                document.getElementById('email').value.trim();

            const username =
                document.getElementById('username').value.trim();

            const firstName =
                document.getElementById('firstName').value.trim();

            const lastName =
                document.getElementById('lastName').value.trim();

            const traditionalName =
                document.getElementById('traditionalName').value.trim();

            const genderId =
                document.getElementById('genderId').value;

            const dateOfBirth =
                document.getElementById('dateOfBirth').value;

// ==========================================
// VALIDATIONS
// ==========================================

if (
    !traditionalName ||
    !firstName ||
    !lastName ||
    !contact ||
    !email ||
    !genderId ||
    !dateOfBirth ||
    !idNumber ||
    !username ||
    !password ||
    !confirmPassword
) {

    alert(
        'Please complete all required fields.'
    );

    return;

}

// ==========================================
// NAME VALIDATION
// ==========================================

if (
    !/^[A-Za-z\s]+$/.test(firstName)
) {

    alert(
        'First Name may only contain letters.'
    );

    return;

}

if (
    !/^[A-Za-z\s]+$/.test(lastName)
) {

    alert(
        'Last Name may only contain letters.'
    );

    return;

}

if (
    !/^[A-Za-z\s]+$/.test(traditionalName)
) {

    alert(
        'Traditional Name may only contain letters.'
    );

    return;

}

// ==========================================
// ID NUMBER
// ==========================================

if (
    !/^\d{13}$/.test(idNumber)
) {

    alert(
        'ID Number must contain exactly 13 digits.'
    );

    return;

}

// ==========================================
// CONTACT
// ==========================================

if (
    !/^0\d{9}$/.test(contact)
) {

    alert(
        'Contact Number must contain 10 digits and start with 0.'
    );

    return;

}

// ==========================================
// EMAIL
// ==========================================

const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (
    !emailPattern.test(email)
) {

    alert(
        'Please enter a valid email address.'
    );

    return;

}

// ==========================================
// DATE OF BIRTH
// ==========================================

const dob =
    new Date(dateOfBirth);

const today =
    new Date();

if (
    dob > today
) {

    alert(
        'Date of Birth cannot be in the future.'
    );

    return;

}

const age =
    today.getFullYear()
    -
    dob.getFullYear();

if (
    age < 18
) {

    alert(
        'Induna must be at least 18 years old.'
    );

    return;

}

// ==========================================
// USERNAME
// ==========================================

if (
    username.length < 4
) {

    alert(
        'Username must be at least 4 characters.'
    );

    return;

}

if (
    !/^[A-Za-z0-9_]+$/.test(username)
) {

    alert(
        'Username can only contain letters, numbers and underscore.'
    );

    return;

}

// ==========================================
// PASSWORD
// ==========================================

if (
    password.length < 8
) {

    alert(
        'Password must be at least 8 characters.'
    );

    return;

}

if (
    !/[A-Z]/.test(password)
) {

    alert(
        'Password must contain at least one uppercase letter.'
    );

    return;

}

if (
    !/[a-z]/.test(password)
) {

    alert(
        'Password must contain at least one lowercase letter.'
    );

    return;

}

if (
    !/[0-9]/.test(password)
) {

    alert(
        'Password must contain at least one number.'
    );

    return;

}

// ==========================================
// CONFIRM PASSWORD
// ==========================================

if (
    password !== confirmPassword
) {

    alert(
        'Passwords do not match.'
    );

    return;

}

            const payload = {

                adminPersonId: personId,

                traditionalName:
                    traditionalName,

                firstName:
                    firstName,

                lastName:
                    lastName,

                contact:
                    contact,

                email:
                    email,

                genderId:
                    genderId,

                dateOfBirth:
                    dateOfBirth,

                idNumber:
                    idNumber,

                username:
                    username,

                password:
                    password
            };

            try {

                const response = await fetch(
                    'http://localhost:3000/api/indunas/assign',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    }
                );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(data.error);
                    return;
                }

                alert(
                    'Induna registered successfully.'
                );

                location.reload();

            } catch (err) {

                console.error(err);

                alert(
                    'Failed to register Induna.'
                );
            }

        });

    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    const updateBtn =
        document.getElementById('updateStatusBtn');

    if (updateBtn) {

        updateBtn.addEventListener('click', async () => {

            const statusId =
                document.getElementById('statusId').value;

            try {

                const response = await fetch(
                    'http://localhost:3000/api/indunas/status',
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            adminPersonId: personId,
                            statusId: statusId
                        })
                    }
                );

                const data =
                    await response.json();

                if (!response.ok) {

                    alert(data.error);
                    return;
                }

                alert(
                    'Status updated successfully.'
                );

                location.reload();

            } catch (err) {

                console.error(err);

                alert(
                    'Failed to update status.'
                );
            }

        });

    }

});

// ======================================================
// LOAD CURRENT INDUNA
// ======================================================

async function loadCurrentInduna(personId) {

    try {

        const response = await fetch(
            `http://localhost:3000/api/indunas/current/${personId}`
        );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Failed to load Induna information.'
            );
        }

        document.getElementById(
            'adminName'
        ).innerText =
            data.adminName;

        document.getElementById(
            'villageCardName'
        ).innerText =
            data.villageName;

        document.getElementById(
            'villageName'
        ).value =
            data.villageName;

        if (data.indunaExists) {

            document.getElementById(
                'currentIndunaCard'
            ).innerText =
                data.traditionalName;

            document.getElementById(
                'currentStatusCard'
            ).innerText =
                data.statusName;

            document.getElementById(
                'traditionalNameDisplay'
            ).innerText =
                data.traditionalName;

            document.getElementById(
                'fullNameDisplay'
            ).innerText =
                data.fullName;

            document.getElementById(
                'contactDisplay'
            ).innerText =
                data.contact;

            document.getElementById(
                'emailDisplay'
            ).innerText =
                data.email;

            document.getElementById(
                'appointedDisplay'
            ).innerText =
                data.dateAppointed;

            document.getElementById(
                'statusDisplay'
            ).innerText =
                data.statusName;

            document.getElementById(
                'statusId'
            ).value =
                data.statusId;

        } else {

            document.getElementById(
                'currentIndunaCard'
            ).innerText =
                'Not Assigned';

            document.getElementById(
                'currentStatusCard'
            ).innerText =
                'N/A';

        }

    } catch (err) {

        console.error(err);

        alert(
            'Failed to load Induna information.'
        );

    }

}

// ======================================================
// LOGOUT
// ======================================================

function logout() {

    sessionStorage.clear();

    window.location.href = 'login.html';

}
