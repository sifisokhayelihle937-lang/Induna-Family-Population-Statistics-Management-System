// ======================================================
// ACTIVITIES CONTROLLER
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

    loadActivityTypes();
    loadActivities(personId);

    const activityForm =
        document.getElementById('activityForm');

    if (activityForm) {

        activityForm.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();

                await submitActivity(
                    personId
                );

            }
        );

    }

});

// ======================================================
// LOAD ACTIVITY TYPES
// ======================================================

async function loadActivityTypes() {

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/activity-types'
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error
            );

        }

        const dropdown =
            document.getElementById(
                'activityTypeId'
            );

        dropdown.innerHTML =
            '<option value="">Select Activity Type</option>';

        data.activityTypes.forEach(
            type => {

                dropdown.innerHTML += `
                    <option value="${type.activity_type_id}">
                        ${type.display_label}
                    </option>
                `;

            }
        );

    } catch (err) {

        console.error(err);

        alert(
            'Failed to load activity types.'
        );

    }

}

// ======================================================
// SUBMIT ACTIVITY
// ======================================================

async function submitActivity(personId) {

    const activityTypeId =
        document.getElementById(
            'activityTypeId'
        ).value;

    const activityDate =
        document.getElementById(
            'activityDate'
        ).value;

    const description =
        document.getElementById(
            'description'
        ).value.trim();

    // ==========================
    // VALIDATION
    // ==========================

    if (
        !activityTypeId ||
        !activityDate ||
        !description
    ) {

        alert(
            'Please complete all required fields.'
        );

        return;
    }

    if (description.length < 10) {

        alert(
            'Description must contain at least 10 characters.'
        );

        return;
    }

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/activities/report',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({

                            personId,

                            activityTypeId,

                            activityDate,

                            description

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
            'Activity submitted successfully.'
        );

        document
            .getElementById(
                'activityForm'
            )
            .reset();

        loadActivities(
            personId
        );

    } catch (err) {

        console.error(err);

        alert(
            'Failed to submit activity.'
        );

    }

}

// ======================================================
// LOAD ACTIVITIES
// ======================================================

async function loadActivities(personId) {

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/activities/${personId}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error
            );

        }

        const container =
            document.getElementById(
                'activitiesContainer'
            );

        container.innerHTML = '';

        if (
            !data.activities ||
            data.activities.length === 0
        ) {

            container.innerHTML = `

                <div class="activity-card">

                    <h3>
                        No Activities Found
                    </h3>

                    <p>
                        Activities reported by this household
                        will appear here.
                    </p>

                </div>

            `;

            return;
        }

        data.activities.forEach(
            activity => {

                let statusClass =
                    'status-reported';

                if (
                    activity.activity_status_id === 2
                ) {

                    statusClass =
                        'status-approved';

                }

                if (
                    activity.activity_status_id === 3
                ) {

                    statusClass =
                        'status-rejected';

                }

                container.innerHTML += `

                    <div class="activity-card">

                        <h3>
                            ${activity.display_label}
                        </h3>

                        <p class="activity-description">

                            ${activity.description}

                        </p>

                        <div class="activity-meta">

                            <span>
                                📅 ${activity.activity_date}
                            </span>

                            <span>
                                Logged:
                                ${activity.date_logged}
                            </span>

                        </div>

                        <span class="status-badge ${statusClass}">

                            ${activity.act_status_name}

                        </span>
                        ${
    Number(activity.activity_status_id) === 1

    ? `

        <div class="activity-actions">

            <button
                class="delete-btn"
                onclick="deleteActivity(${activity.activity_id})">

                Delete Activity

            </button>

        </div>

      `

    : ''

}

                        ${
                            activity.review_comment
                            ?
                            `
                            <div class="review-comment">

                                <h4>
                                    Induna Feedback
                                </h4>

                                <p>

                                    ${activity.review_comment}

                                </p>

                            </div>
                            `
                            :
                            ''
                        }

                    </div>

                `;

            }
        );

    } catch (err) {

        console.error(err);

        alert(
            'Failed to load activities.'
        );

    }

}
// ======================================================
// DELETE ACTIVITY
// ======================================================

async function deleteActivity(
    activityId
) {

    const personId =
        sessionStorage.getItem(
            'personId'
        );

    const confirmDelete =
        confirm(
            'Are you sure you want to delete this activity?'
        );

    if (!confirmDelete) {

        return;

    }

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/activities/${activityId}/${personId}`,
                {
                    method: 'DELETE'
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
            'Activity deleted successfully.'
        );

        loadActivities(
            personId
        );

    }

    catch (err) {

        console.error(err);

        alert(
            'Failed to delete activity.'
        );

    }

}