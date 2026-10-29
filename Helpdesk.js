// ======================================================
// HELPDESK CONTROLLER
// ======================================================

document.addEventListener('DOMContentLoaded', () => {

    loadTickets();

    const saveBtn =
        document.getElementById(
            'saveResolutionBtn'
        );

    if (saveBtn) {

        saveBtn.addEventListener(
            'click',
            updateTicket
        );

    }

});

// ======================================================
// LOAD ALL TICKETS
// ======================================================

async function loadTickets() {

    const personId =
        sessionStorage.getItem('personId');

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/helpdesk/tickets/${personId}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error
            );

        }

        document.getElementById(
            'openTickets'
        ).innerText =
            data.summary.open;

        document.getElementById(
            'progressTickets'
        ).innerText =
            data.summary.inProgress;

        document.getElementById(
            'resolvedTickets'
        ).innerText =
            data.summary.resolved;

        document.getElementById(
            'closedTickets'
        ).innerText =
            data.summary.closed;

        const tbody =
            document.getElementById(
                'ticketsTableBody'
            );

        tbody.innerHTML = '';

        if (
            !data.tickets ||
            data.tickets.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        No tickets found.
                    </td>
                </tr>
            `;

            return;
        }

        data.tickets.forEach(ticket => {

            let badgeClass =
                'status-open';

            if (
                Number(ticket.ticket_status_id) === 2
            ) {

                badgeClass =
                    'status-progress';

            }

            if (
                Number(ticket.ticket_status_id) === 3
            ) {

                badgeClass =
                    'status-resolved';

            }

            if (
                Number(ticket.ticket_status_id) === 4
            ) {

                badgeClass =
                    'status-closed';

            }

            tbody.innerHTML += `

                <tr>

                    <td>
                        #${ticket.ticket_id}
                    </td>

                    <td>
                        ${ticket.full_name}
                    </td>

                    <td>
                        ${ticket.category_name}
                    </td>

                    <td>
                        ${ticket.subject}
                    </td>

                    <td>

                        <span class="
                            status-badge
                            ${badgeClass}
                        ">

                            ${ticket.status_name}

                        </span>

                    </td>

                    <td>
                        ${ticket.date_logged}
                    </td>

                    <td>

                        <button
                            class="review-btn"
                            onclick="openTicket(${ticket.ticket_id})">

                            Review

                        </button>

                    </td>

                </tr>

            `;

        });

    } catch (err) {

        console.error(err);

        alert(
            'Failed to load tickets.'
        );

    }

}

// ======================================================
// OPEN TICKET
// ======================================================

async function openTicket(ticketId) {

    const personId =
        sessionStorage.getItem('personId');

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/helpdesk/ticket/${ticketId}/${personId}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error
            );

        }

        document.getElementById(
            'ticketId'
        ).value =
            data.ticket.ticket_id;

        document.getElementById(
            'residentName'
        ).value =
            data.ticket.full_name;

        document.getElementById(
            'categoryName'
        ).value =
            data.ticket.category_name;

        document.getElementById(
            'subject'
        ).value =
            data.ticket.subject;

        document.getElementById(
            'bugDetails'
        ).value =
            data.ticket.bug_details;

        document.getElementById(
            'ticketStatusId'
        ).value =
            data.ticket.ticket_status_id;

        document.getElementById(
            'adminSolution'
        ).value =
            data.ticket.admin_solution || '';

        document.getElementById(
            'reviewModal'
        ).style.display =
            'flex';

    } catch (err) {

        console.error(err);

        alert(
            'Failed to load ticket.'
        );

    }

}

// ======================================================
// UPDATE TICKET
// ======================================================

async function updateTicket() {

    const ticketId =
        document.getElementById(
            'ticketId'
        ).value;

    const ticketStatusId =
        document.getElementById(
            'ticketStatusId'
        ).value;

    const adminSolution =
        document.getElementById(
            'adminSolution'
        ).value.trim();

    if (
        Number(ticketStatusId) >= 3 &&
        !adminSolution
    ) {

        alert(
            'Please provide a support response.'
        );

        return;
    }

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/helpdesk/update',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        ticketId,
                        ticketStatusId,
                        adminSolution

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
            'Ticket updated successfully.'
        );

        closeModal();

        loadTickets();

    } catch (err) {

        console.error(err);

        alert(
            'Failed to update ticket.'
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