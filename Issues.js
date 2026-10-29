// ======================================================
// ISSUES CONTROLLER
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

    loadIssueCategories();
    loadIssues(personId);

    const issueForm =
        document.getElementById('issueForm');

    if (issueForm) {

        issueForm.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();

                await submitIssue(
                    personId
                );

            }
        );

    }

});

// ======================================================
// LOAD ISSUE CATEGORIES
// ======================================================

async function loadIssueCategories() {

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/issue-categories'
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
                'issueCategoryId'
            );

        dropdown.innerHTML =
            '<option value="">Select Category</option>';

        data.categories.forEach(
            category => {

                dropdown.innerHTML += `
                    <option value="${category.issue_category_id}">
                        ${category.category_name}
                    </option>
                `;

            }
        );

    } catch (err) {

        console.error(err);

        alert(
            'Failed to load issue categories.'
        );

    }

}

// ======================================================
// SUBMIT ISSUE
// ======================================================

async function submitIssue(personId) {

    const issueCategoryId =
        document.getElementById(
            'issueCategoryId'
        ).value;

    const subject =
        document.getElementById(
            'subject'
        ).value.trim();

    const bugDetails =
        document.getElementById(
            'bugDetails'
        ).value.trim();

    // ==========================================
    // VALIDATION
    // ==========================================

    if (
        !issueCategoryId ||
        !subject ||
        !bugDetails
    ) {

        alert(
            'Please complete all required fields.'
        );

        return;
    }

    if (subject.length < 5) {

        alert(
            'Subject must contain at least 5 characters.'
        );

        return;
    }

    if (bugDetails.length < 10) {

        alert(
            'Issue description must contain at least 10 characters.'
        );

        return;
    }

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/issues/report',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        personId,

                        issueCategoryId,

                        subject,

                        bugDetails

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
            'Support ticket submitted successfully.'
        );

        document
            .getElementById(
                'issueForm'
            )
            .reset();

        loadIssues(
            personId
        );

    } catch (err) {

        console.error(err);

        alert(
            'Failed to submit issue.'
        );

    }

}

// ======================================================
// LOAD MY ISSUES
// ======================================================

async function loadIssues(personId) {

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/issues/${personId}`
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
                'issuesContainer'
            );

        container.innerHTML = '';

        if (
            !data.issues ||
            data.issues.length === 0
        ) {

            container.innerHTML = `

                <div class="issue-card">

                    <h3>
                        No Issues Found
                    </h3>

                    <p>
                        Support tickets submitted by
                        this household will appear here.
                    </p>

                </div>

            `;

            return;
        }

        data.issues.forEach(
            issue => {

                let statusClass =
                    'status-open';

                if (
                    issue.ticket_status_id === 2
                ) {

                    statusClass =
                        'status-progress';

                }

                if (
                    issue.ticket_status_id === 3
                ) {

                    statusClass =
                        'status-resolved';

                }

                if (
                    issue.ticket_status_id === 4
                ) {

                    statusClass =
                        'status-closed';

                }

                container.innerHTML += `

                    <div class="issue-card">

                        <h3>
                            ${issue.subject}
                        </h3>

                        <p class="issue-description">

                            ${issue.bug_details}

                        </p>

                        <div class="issue-meta">

                            <span>
                                📂 ${issue.category_name}
                            </span>

                            <span>
                                📅 ${issue.date_logged}
                            </span>

                        </div>

                        <span class="status-badge ${statusClass}">

                            ${issue.status_name}

                        </span>
                        ${
    Number(issue.ticket_status_id) === 1

    ? `

        <div class="issue-actions">

            <button
                class="delete-btn"
                onclick="deleteTicket(${issue.ticket_id})">

                Delete Ticket

            </button>

        </div>

      `

    : ''

}

                        ${
                            issue.admin_solution
                            ?
                            `
                            <div class="admin-solution">

                                <h4>
                                    Support Response
                                </h4>

                                <p>

                                    ${issue.admin_solution}

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
            'Failed to load support tickets.'
        );

    }

}
// ======================================================
// DELETE TICKET
// ======================================================

async function deleteTicket(
    ticketId
) {

    const personId =
        sessionStorage.getItem(
            'personId'
        );

    const confirmDelete =
        confirm(
            'Are you sure you want to delete this ticket?'
        );

    if (!confirmDelete) {

        return;

    }

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/issues/${ticketId}/${personId}`,
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
            'Ticket deleted successfully.'
        );

        loadIssues(
            personId
        );

    }

    catch (err) {

        console.error(err);

        alert(
            'Failed to delete ticket.'
        );

    }

}