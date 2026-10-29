// ======================================================
// ACTIVITY MANAGEMENT
// ======================================================

document.addEventListener('DOMContentLoaded', () => {

    const personId = sessionStorage.getItem('personId');

    if (!personId) {

        alert('Session expired. Please login again.');

        window.location.href = 'login.html';

        return;

    }

    loadActivities();

    const saveBtn =
        document.getElementById('saveReviewBtn');

    if (saveBtn) {

        saveBtn.addEventListener(
            'click',
            saveReview
        );

    }

});

// ======================================================
// LOAD ACTIVITIES
// ======================================================

async function loadActivities() {

    const personId =
        sessionStorage.getItem('personId');

    console.log(
        'PERSON ID:',
        personId
    );

    try {

        const response = await fetch(
            `http://localhost:3000/api/activity-reviews/${personId}`
        );

        const data =
            await response.json();

        console.log(
            'ACTIVITIES:',
            data
        );

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Failed to load activities.'
            );

        }

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
                    <td colspan="6">
                        No activities found.
                    </td>
                </tr>
            `;

            return;

        }

        data.activities.forEach(activity => {

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
                        ${activity.full_name}
                    </td>

                    <td>
                        ${activity.display_label}
                    </td>

                    <td>
                        ${activity.activity_date}
                    </td>

                    <td>

                        <span
                            class="status-badge ${badgeClass}">

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

        });

    } catch (err) {

        console.error(
            'LOAD ACTIVITIES ERROR:',
            err
        );

        alert(
            err.message
        );

    }

}

// ======================================================
// REVIEW ACTIVITY
// ======================================================

async function reviewActivity(activityId) {

    const personId =
        sessionStorage.getItem('personId');

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/activity-review/${activityId}/${personId}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Failed to load activity.'
            );

        }

        document.getElementById(
            'activityId'
        ).value =
            data.activity.activity_id;

        document.getElementById(
            'houseNumber'
        ).value =
            data.activity.house_number;

        document.getElementById(
            'residentName'
        ).value =
            data.activity.full_name;

        document.getElementById(
            'activityType'
        ).value =
            data.activity.display_label;

        document.getElementById(
            'activityDate'
        ).value =
            data.activity.activity_date;

        document.getElementById(
            'activityDescription'
        ).value =
            data.activity.description || '';

        document.getElementById(
            'activityStatusId'
        ).value =
            data.activity.activity_status_id;

        document.getElementById(
            'reviewComment'
        ).value =
            data.activity.review_comment || '';

        document.getElementById(
            'reviewModal'
        ).style.display =
            'flex';

    } catch (err) {

        console.error(
            'ACTIVITY DETAILS ERROR:',
            err
        );

        alert(
            err.message
        );

    }

}

// ======================================================
// SAVE REVIEW
// ======================================================

async function saveReview() {

    const personId =
        sessionStorage.getItem('personId');

    const activityId =
        document.getElementById(
            'activityId'
        ).value;

    const activityStatusId =
        document.getElementById(
            'activityStatusId'
        ).value;

    const reviewComment =
        document.getElementById(
            'reviewComment'
        ).value.trim();

    if (
        Number(activityStatusId) >= 2 &&
        !reviewComment
    ) {

        alert(
            'Please provide a review comment.'
        );

        return;

    }

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/activity-review/update',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        activityId,
                        activityStatusId,
                        reviewComment,
                        personId

                    })

                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Failed to save review.'
            );

        }

        alert(
            'Activity reviewed successfully.'
        );

        closeModal();

        loadActivities();

    } catch (err) {

        console.error(
            'SAVE REVIEW ERROR:',
            err
        );

        alert(
            err.message
        );

    }

}

// ======================================================
// CLOSE MODAL
// ======================================================

function closeModal() {

    document.getElementById(
        'reviewModal'
    ).style.display =
        'none';

}

// ======================================================
// CLICK OUTSIDE MODAL
// ======================================================

window.addEventListener(
    'click',
    (e) => {

        const modal =
            document.getElementById(
                'reviewModal'
            );

        if (
            e.target === modal
        ) {

            closeModal();

        }

    }
);

// ======================================================
// LOGOUT
// ======================================================

function logout() {

    sessionStorage.clear();

    window.location.href =
        'login.html';

}