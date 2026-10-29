// ======================================================
// RESIDENT DASHBOARD CONTROLLER
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

    loadResidentDashboard(personId);

    // ====================================
    // MEMBERS MENU
    // ====================================

    const membersMenu =
        document.getElementById('membersMenu');

    if (membersMenu) {

        membersMenu.addEventListener(
            'click',
            (e) => {

                e.preventDefault();

                document
                    .getElementById('membersSubmenu')
                    .classList.toggle('show');

            }
        );
    }

    // ====================================
    // ACTIVITIES MENU
    // ====================================

    const activitiesMenu =
        document.getElementById('activitiesMenu');

    if (activitiesMenu) {

        activitiesMenu.addEventListener(
            'click',
            (e) => {

                e.preventDefault();

                document
                    .getElementById('activitiesSubmenu')
                    .classList.toggle('show');

            }
        );
    }

    // ====================================
    // ISSUES MENU
    // ====================================

    const issuesMenu =
        document.getElementById('issuesMenu');

    if (issuesMenu) {

        issuesMenu.addEventListener(
            'click',
            (e) => {

                e.preventDefault();

                document
                    .getElementById('issuesSubmenu')
                    .classList.toggle('show');

            }
        );
    }

});

// ======================================================
// LOAD DASHBOARD DATA
// ======================================================

async function loadResidentDashboard(personId) {

    try {

        const response = await fetch(
            `http://localhost:3000/api/resident/dashboard/${personId}`
        );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Unable to load dashboard.'
            );
        }

        // PROFILE

        document.getElementById('residentName').innerText =
            data.fullName;

        document.getElementById('welcomeName').innerText =
            data.fullName;

        document.getElementById('householdNumber').innerText =
            data.houseNumber;

        document.getElementById('villageName').innerText =
            data.villageName;

        // CARDS

        document.getElementById('totalMembers').innerText =
            data.totalMembers;

        document.getElementById('totalDeceased').innerText =
            data.totalDeceased;

        document.getElementById('totalRelocated').innerText =
            data.totalRelocated;

        document.getElementById('reportedActivities').innerText =
            data.reportedActivities;

        document.getElementById('reportedIssues').innerText =
            data.reportedIssues;

        // ACTIVITIES

        const container =
            document.getElementById('activitiesContainer');

        if (
            data.activities &&
            data.activities.length > 0
        ) {

            container.innerHTML = '';

            data.activities.forEach(activity => {

                container.innerHTML += `

                    <div class=

                        <h3>
                            ${activity.display_label}
                        </h3>

                        <p>
                            ${activity.description}
                        </p>

                        <div class="activity-meta">

                            <span>
                                📍 ${data.villageName}
                            </span>

                            <span>
                                📅 ${activity.activity_date}
                            </span>

                        </div>

                        <span class="activity-status">

                            ${activity.act_status_name}

                        </span>

                    </div>

                `;

            });

        }

    } catch (err) {

        console.error(err);

        alert(
            'Failed to load resident dashboard.'
        );

    }

}

// ======================================================
// LOGOUT
// ======================================================

function logout() {

    sessionStorage.clear();

    window.location.href =
        'login.html';

}