// ======================================================
// HOUSEHOLD REGISTRATION CONTROLLER
// ======================================================

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('residentSignupForm');
    const registerBtn = document.getElementById('registerBtn');

    const provinceSelect = document.getElementById('provinceId');
    const citySelect = document.getElementById('cityId');
    const villageSelect = document.getElementById('villageId');

    let allCities = [];
    let allVillages = [];

    // ==========================================
    // LOAD LOOKUPS
    // ==========================================

    async function loadLookups() {

        try {

            const response = await fetch(
                'http://localhost:3000/api/lookups/regions'
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            provinceSelect.innerHTML =
                '<option value="">Select Province</option>';

            citySelect.innerHTML =
                '<option value="">Select City</option>';

            villageSelect.innerHTML =
                '<option value="">Select Village</option>';

            data.provinces.forEach(province => {

                provinceSelect.innerHTML += `
                    <option value="${province.province_id}">
                        ${province.province_name}
                    </option>
                `;
            });

            allCities = data.cities;
            allVillages = data.villages;

        } catch (err) {

            console.error(err);

            alert(
                'Failed to load Province, City and Village records.'
            );
        }
    }

    loadLookups();

    // ==========================================
    // PROVINCE CASCADE
    // ==========================================

    provinceSelect.addEventListener('change', () => {

        const provinceId =
            parseInt(provinceSelect.value);

        citySelect.innerHTML =
            '<option value="">Select City</option>';

        villageSelect.innerHTML =
            '<option value="">Select Village</option>';

        const filteredCities =
            allCities.filter(
                city =>
                    city.province_id === provinceId
            );

        filteredCities.forEach(city => {

            citySelect.innerHTML += `
                <option value="${city.city_id}">
                    ${city.city_name}
                </option>
            `;
        });
    });

    // ==========================================
    // CITY CASCADE
    // ==========================================

    citySelect.addEventListener('change', () => {

        const cityId =
            parseInt(citySelect.value);

        villageSelect.innerHTML =
            '<option value="">Select Village</option>';

        const filteredVillages =
            allVillages.filter(
                village =>
                    village.city_id === cityId
            );

        filteredVillages.forEach(village => {

            villageSelect.innerHTML += `
                <option value="${village.village_id}">
                    ${village.village_name}
                </option>
            `;
        });
    });

    // ==========================================
    // FORM SUBMIT
    // ==========================================

    form.addEventListener('submit', async (e) => {

        e.preventDefault();

        const password =
            document.getElementById('password').value;

        const confirmPassword =
            document.getElementById('confirmPassword').value;

        const idNumber =
            document.getElementById('idNumber').value.trim();

        // ======================================
// VALIDATIONS
// ======================================

const firstName =
    document.getElementById(
        'firstName'
    ).value.trim();

const lastName =
    document.getElementById(
        'lastName'
    ).value.trim();

const contact =
    document.getElementById(
        'contact'
    ).value.trim();

const email =
    document.getElementById(
        'email'
    ).value.trim();

const username =
    document.getElementById(
        'username'
    ).value.trim();

const dob =
    document.getElementById(
        'dob'
    ).value;

const houseNo =
    document.getElementById(
        'houseNo'
    ).value.trim();

const plotNo =
    document.getElementById(
        'plotNo'
    ).value.trim();

const landSize =
    document.getElementById(
        'landSize'
    ).value;

// ======================================
// REQUIRED FIELDS
// ======================================

if (

    !firstName ||
    !lastName ||
    !contact ||
    !email ||
    !dob ||
    !idNumber ||
    !username ||
    !password ||
    !confirmPassword ||
    !houseNo ||
    !plotNo ||
    !landSize ||
    !villageSelect.value

) {

    alert(
        'Please complete all required fields.'
    );

    return;

}

// ======================================
// NAME VALIDATION
// ======================================

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

// ======================================
// SOUTH AFRICAN ID
// ======================================

if (
    !/^\d{13}$/.test(idNumber)
) {

    alert(
        'ID Number must contain exactly 13 digits.'
    );

    return;

}

// ======================================
// CONTACT NUMBER
// ======================================

if (
    !/^0\d{9}$/.test(contact)
) {

    alert(
        'Contact Number must start with 0 and contain 10 digits.'
    );

    return;

}

// ======================================
// EMAIL
// ======================================

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

// ======================================
// AGE VALIDATION
// ======================================

const birthDate =
    new Date(dob);

const today =
    new Date();

if (
    birthDate > today
) {

    alert(
        'Date of Birth cannot be in the future.'
    );

    return;

}

const age =
    today.getFullYear()
    -
    birthDate.getFullYear();

if (
    age < 18
) {

    alert(
        'Head of Household must be at least 18 years old.'
    );

    return;

}

// ======================================
// USERNAME
// ======================================

if (
    username.length < 4
) {

    alert(
        'Username must be at least 4 characters.'
    );

    return;

}

if (
    !/^[A-Za-z0-9_]+$/
        .test(username)
) {

    alert(
        'Username may only contain letters, numbers and underscore.'
    );

    return;

}

// ======================================
// PASSWORD
// ======================================

if (
    password.length < 8
) {

    alert(
        'Password must contain at least 8 characters.'
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

// ======================================
// CONFIRM PASSWORD
// ======================================

if (
    password !== confirmPassword
) {

    alert(
        'Passwords do not match.'
    );

    return;

}

// ======================================
// LAND SIZE
// ======================================

if (
    Number(landSize) <= 0
) {

    alert(
        'Land Size must be greater than zero.'
    );

    return;

}

        registerBtn.disabled = true;
        registerBtn.innerText =
            'Registering Household...';

        const payload = {

            firstName:
                document.getElementById('firstName').value.trim(),

            lastName:
                document.getElementById('lastName').value.trim(),

            contact:
                document.getElementById('contact').value.trim(),

            email:
                document.getElementById('email').value.trim(),

            genderId:
                parseInt(
                    document.getElementById('genderId').value
                ),

            dob:
                document.getElementById('dob').value,

            idNumber:
                idNumber,

            username:
                document.getElementById('username').value.trim(),

            password:
                password,

            relationshipId:
                1,

            villageId:
                parseInt(villageSelect.value),

            houseNo:
                document.getElementById('houseNo').value.trim(),

            plotNo:
                document.getElementById('plotNo').value.trim(),

            landSize:
                parseFloat(
                    document.getElementById('landSize').value
                ),

            locationDesc:
                document.getElementById('locationDesc').value.trim()
        };

        try {

            const response = await fetch(
                'http://localhost:3000/api/register',
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

            if (response.ok) {

                alert(
                    'Household registered successfully.'
                );

                window.location.href =
                    'login.html';

            } else {

                alert(data.error);
            }

        } catch (err) {

            console.error(err);

            alert(
                'Unable to connect to the server.'
            );

        } finally {

            registerBtn.disabled = false;

            registerBtn.innerText =
                'Register Household';
        }
    });
});