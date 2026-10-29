// ======================================================
// ITADMIN DASHBOARD CONTROLLER
// ======================================================

document.addEventListener('DOMContentLoaded', async () => {

    const personId = sessionStorage.getItem('personId');

    if (!personId) {

        alert('Session expired. Please login again.');

        window.location.href = 'login.html';

        return;
    }

    try {

        const response = await fetch(
            `http://localhost:3000/api/admin/dashboard/${personId}`
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || 'Unable to load dashboard.'
            );
        }

        // =====================================
        // ADMIN PROFILE
        // =====================================

        document.getElementById('adminName').innerText =
            data.adminName;

        document.getElementById('welcomeName').innerText =
            data.adminName;

        document.getElementById('assignedVillage').innerText =
            data.villageName;

        document.getElementById('villageName').innerText =
            data.villageName;

        // =====================================
        // STATISTICS
        // =====================================

        document.getElementById('totalPopulation').innerText =
            data.totalPopulation;

        document.getElementById('totalHouseholds').innerText =
            data.totalHouseholds;

        document.getElementById('openTickets').innerText =
            data.openTickets || 0;

        // =====================================
        // RECENT HOUSEHOLDS
        // =====================================

        const container =
            document.getElementById('householdContainer');

        if (
            data.recentHouseholds &&
            data.recentHouseholds.length > 0
        ) {

            container.innerHTML = '';

            data.recentHouseholds.forEach(
                household => {

                    container.innerHTML += `
                        <div class=

                            <h3>
                                ${household.house_number}
                            </h3>

                            <p>
                                Plot:
                                ${household.plot_number}
                            </p>

                            <p>
                                ${household.location_description}
                            </p>

                        </div>
                    `;
                }
            );
        }

    } catch (err) {

        console.error(err);

        alert(
            'Failed to load dashboard information.'
        );
    }

    // =====================================
    // INDUNAS SUBMENU
    // =====================================

    const indunasMenu =
        document.getElementById('indunasMenu');

    if (indunasMenu) {

        indunasMenu.addEventListener(
            'click',
            (e) => {

                e.preventDefault();

                document
                    .getElementById('indunasSubmenu')
                    .classList.toggle('show');
            }
        );
    }

    // =====================================
    // HELPDESK SUBMENU
    // =====================================

    const helpdeskMenu =
        document.getElementById('helpdeskMenu');

    if (helpdeskMenu) {

        helpdeskMenu.addEventListener(
            'click',
            (e) => {

                e.preventDefault();

                document
                    .getElementById('helpdeskSubmenu')
                    .classList.toggle('show');
            }
        );
    }

});

// ======================================================
// LOGOUT
// ======================================================

function logout() {

    sessionStorage.clear();

    window.location.href = 'login.html';

}