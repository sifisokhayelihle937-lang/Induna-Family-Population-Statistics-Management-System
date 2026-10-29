// ======================================================
// MEMBERS CONTROLLER
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

    loadMembers(personId);

    // ==========================================
    // ADD MEMBER
    // ==========================================

    const memberForm =
        document.getElementById('memberForm');

    if (memberForm) {

        memberForm.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();

                await saveMember(personId);

            }
        );

    }

    // ==========================================
    // STATUS DROPDOWN
    // ==========================================

    const rstatusId =
        document.getElementById('rstatusId');

    if (rstatusId) {

        rstatusId.addEventListener(
            'change',
            toggleStatusFields
        );

    }

    // ==========================================
    // UPDATE STATUS
    // ==========================================

    const updateStatusBtn =
        document.getElementById('updateStatusBtn');

    if (updateStatusBtn) {

        updateStatusBtn.addEventListener(
            'click',
            updateResidentStatus
        );

    }

});

// ======================================================
// LOAD FAMILY MEMBERS
// ======================================================

async function loadMembers(personId) {

    try {

        const response = await fetch(
            `http://localhost:3000/api/members/${personId}`
        );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Failed to load members.'
            );

        }

        const tbody =
            document.getElementById(
                'membersTableBody'
            );

        tbody.innerHTML = '';

        if (
            !data.members ||
            data.members.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No family members found.
                    </td>
                </tr>
            `;

            return;
        }

        data.members.forEach(member => {

            let badgeClass =
                'status-alive';

            if (
                member.rstatus_id === 21
            ) {

                badgeClass =
                    'status-deceased';

            }

            if (
                member.rstatus_id === 41
            ) {

                badgeClass =
                    'status-relocated';

            }

            tbody.innerHTML += `

                <tr>

                    <td>
                        ${member.first_name}
                        ${member.last_name}
                    </td>

                    <td>
                        ${member.relationship_name}
                    </td>

                    <td>
                        ${member.contact || '-'}
                    </td>

                    <td>

                        <span class="
                            status-badge
                            ${badgeClass}
                        ">

                            ${member.rstatus_description}

                        </span>

                    </td>

                    <td>
                        ${member.date_joined}
                    </td>

                    <td>

                        <button
                            class="action-btn edit-btn"
                            onclick="openStatusModal(
                                ${member.resident_id},
                                ${member.rstatus_id}
                            )">

                            Update Status

                        </button>

                    </td>

                </tr>

            `;

        });

    } catch (err) {

        console.error(err);

        alert(
            'Failed to load family members.'
        );

    }

}

// ======================================================
// SAVE MEMBER
// ======================================================

async function saveMember(personId) {

    const firstName =
        document.getElementById('firstName')
        .value.trim();

    const lastName =
        document.getElementById('lastName')
        .value.trim();

    const idNumber =
        document.getElementById('idNumber')
        .value.trim();

    const contact =
        document.getElementById('contact')
        .value.trim();

    const emailAddress =
        document.getElementById('emailAddress')
        .value.trim();

    const dateOfBirth =
        document.getElementById('dateOfBirth')
        .value;

    const genderId =
        document.getElementById('genderId')
        .value;

    const relationshipId =
        document.getElementById('relationshipId')
        .value;

    // ======================================
    // VALIDATION
    // ======================================

    if (
        !firstName ||
        !lastName ||
        !idNumber ||
        !dateOfBirth ||
        !genderId ||
        !relationshipId
    ) {

        alert(
            'Please complete all required fields.'
        );

        return;
    }

    if (!/^\d{13}$/.test(idNumber)) {

        alert(
            'ID Number must contain 13 digits.'
        );

        return;
    }

    if (
        contact &&
        !/^\d{10}$/.test(contact)
    ) {

        alert(
            'Contact Number must contain 10 digits.'
        );

        return;
    }

    const payload = {

        personId,

        firstName,

        lastName,

        idNumber,

        contact,

        emailAddress,

        dateOfBirth,

        genderId,

        relationshipId

    };

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/members/add',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(payload)
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(data.error);

            return;
        }

        alert(
            'Family member added successfully.'
        );

        location.reload();

    } catch (err) {

        console.error(err);

        alert(
            'Failed to save family member.'
        );

    }

}

// ======================================================
// OPEN STATUS MODAL
// ======================================================

function openStatusModal(
    residentId,
    currentStatus
) {

    document.getElementById(
        'residentId'
    ).value =
        residentId;

    document.getElementById(
        'rstatusId'
    ).value =
        currentStatus;

    toggleStatusFields();

    document.getElementById(
        'statusModal'
    ).style.display =
        'flex';

}

// ======================================================
// SHOW / HIDE FIELDS
// ======================================================

function toggleStatusFields() {

    const statusId =
        parseInt(
            document.getElementById(
                'rstatusId'
            ).value
        );

    const relocationGroup =
        document.getElementById(
            'relocationGroup'
        );

    const dateLeftGroup =
        document.getElementById(
            'dateLeftGroup'
        );

    relocationGroup.style.display =
        'none';

    dateLeftGroup.style.display =
        'none';

    if (statusId === 41) {

        relocationGroup.style.display =
            'block';

        dateLeftGroup.style.display =
            'block';

    }

    if (statusId === 21) {

        dateLeftGroup.style.display =
            'block';

    }

}

// ======================================================
// UPDATE STATUS
// ======================================================

async function updateResidentStatus() {

    const residentId =
        document.getElementById(
            'residentId'
        ).value;

    const rstatusId =
        document.getElementById(
            'rstatusId'
        ).value;

    const dateLeft =
        document.getElementById(
            'dateLeft'
        ).value;

    const relocationDestination =
        document.getElementById(
            'relocationDestination'
        ).value.trim();

    if (
        Number(rstatusId) === 41 &&
        !relocationDestination
    ) {

        alert(
            'Relocation destination is required.'
        );

        return;
    }

    if (
        (
            Number(rstatusId) === 21 ||
            Number(rstatusId) === 41
        )
        &&
        !dateLeft
    ) {

        alert(
            'Please provide date left.'
        );

        return;
    }

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/members/status',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({

                            residentId,

                            rstatusId,

                            dateLeft,

                            relocationDestination

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
            'Member status updated successfully.'
        );

        location.reload();

    } catch (err) {

        console.error(err);

        alert(
            'Failed to update member status.'
        );

    }

}

// ======================================================
// CLOSE MODAL
// ======================================================

window.addEventListener('click', (e) => {

    const modal =
        document.getElementById(
            'statusModal'
        );

    if (e.target === modal) {

        modal.style.display =
            'none';

    }

});