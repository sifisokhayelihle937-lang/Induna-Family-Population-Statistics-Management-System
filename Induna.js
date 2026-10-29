// ======================================================
// INDUNA DASHBOARD CONTROLLER
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

    loadDashboard(personId);

    setupMenus();

});

// ======================================================
// LOAD DASHBOARD
// ======================================================

async function loadDashboard(personId) {

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/induna/dashboard/${personId}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Failed to load dashboard.'
            );

        }

        // =====================================
        // PROFILE
        // =====================================

        document.getElementById(
            'indunaName'
        ).innerText =
            data.indunaName;

        document.getElementById(
            'welcomeName'
        ).innerText =
            data.indunaName;

        document.getElementById(
            'assignedVillage'
        ).innerText =
            data.villageName;

        document.getElementById(
            'villageName'
        ).innerText =
            data.villageName;

        // =====================================
        // CARDS
        // =====================================

        document.getElementById(
            'totalFamilies'
        ).innerText =
            data.totalFamilies || 0;

        document.getElementById(
            'totalResidents'
        ).innerText =
            data.totalResidents || 0;

        document.getElementById(
            'reportedActivities'
        ).innerText =
            data.reportedActivities || 0;

        // =====================================
        // RECENT ACTIVITIES
        // =====================================

        const tbody =
            document.getElementById(
                'activitiesTableBody'
            );

        tbody.innerHTML = '';

        if (
            !data.activities ||
            data.activities.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No activity reports found.
                    </td>
                </tr>
            `;

            return;

        }

        data.activities.forEach(
            activity => {

                let badgeClass =
                    'status-reported';

                if (
                    Number(activity.activity_status_id) === 2
                ) {

                    badgeClass =
                        'status-approved';

                }

                if (
                    Number(activity.activity_status_id) === 3
                ) {

                    badgeClass =
                        'status-rejected';

                }

                tbody.innerHTML += `

                    <tr>

                        <td>
                            ${activity.house_number}
                        </td>

                        <td>
                            ${activity.display_label}
                        </td>

                        <td>
                            ${formatDate(activity.activity_date)}
                        </td>

                        <td>

                            <span class="
                                status-badge
                                ${badgeClass}
                            ">

                                ${activity.act_status_name}

                            </span>

                        </td>

                        <td>

                            <button
                                class="review-btn"
                                onclick="reviewActivity(${activity.activity_id})">

                                Review

                            </button>

                        </td>

                    </tr>

                `;

            }
        );

    } catch (err) {

        console.error(err);

        alert(
            'Failed to load dashboard.'
        );

    }

}

// ======================================================
// MENU TOGGLES
// ======================================================

function setupMenus() {

    const familiesMenu =
        document.getElementById(
            'familiesMenu'
        );

    if (familiesMenu) {

        familiesMenu.addEventListener(
            'click',
            (e) => {

                e.preventDefault();

                document
                    .getElementById(
                        'familiesSubmenu'
                    )
                    .classList.toggle(
                        'show'
                    );

            }
        );

    }

    const activitiesMenu =
        document.getElementById(
            'activitiesMenu'
        );

    if (activitiesMenu) {

        activitiesMenu.addEventListener(
            'click',
            (e) => {

                e.preventDefault();

                document
                    .getElementById(
                        'activitiesSubmenu'
                    )
                    .classList.toggle(
                        'show'
                    );

            }
        );

    }

}

// ======================================================
// REVIEW ACTIVITY
// ======================================================

function reviewActivity(activityId) {

    sessionStorage.setItem(
        'activityId',
        activityId
    );

    window.location.href =
        'ActivityReviews.html';

}

// ======================================================
// DATE FORMAT
// ======================================================

function formatDate(dateString) {

    const date =
        new Date(dateString);

    return date.toLocaleDateString(
        'en-ZA',
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }
    );

}

// ======================================================
// LOGOUT
// ======================================================

function logout() {

    sessionStorage.clear();

    window.location.href =
        'login.html';

}