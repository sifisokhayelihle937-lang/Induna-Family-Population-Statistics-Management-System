// ======================================================
// FAMILY MANAGEMENT
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

    loadHouseholds();

    const saveBtn =
        document.getElementById(
            'saveHeadChangeBtn'
        );

    if (saveBtn) {

        saveBtn.addEventListener(
            'click',
            saveHeadChange
        );

    }

});

// ======================================================
// LOAD HOUSEHOLDS
// ======================================================

async function loadHouseholds() {

    const personId =
        sessionStorage.getItem('personId');

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/families/${personId}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error
            );

        }

        const tbody =
            document.getElementById(
                'householdsTableBody'
            );

        tbody.innerHTML = '';

        if (
            !data.households ||
            data.households.length === 0
        ) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No households found.
                    </td>
                </tr>
            `;

            return;
        }

        data.households.forEach(
            household => {

                tbody.innerHTML += `
                    <tr>

                        <td>
                            ${household.house_number}
                        </td>

                        <td>
                            ${household.head_name}
                        </td>

                        <td>
                            ${household.family_size}
                        </td>

                        <td>

                            <span class="status-badge status-active">

                                Active

                            </span>

                        </td>

                        <td>

    <button
        class="view-btn"
        onclick="viewHousehold(${household.household_id})">

        View

    </button>

    <button
        class="update-btn"
        onclick="openStatusModal(${household.household_id})">

        Update

    </button>

</td>

                    </tr>
                `;

            }
        );

    } catch (err) {

        console.error(err);

        alert(
            'Failed to load households.'
        );

    }

}

// ======================================================
// VIEW HOUSEHOLD
// ======================================================

async function viewHousehold(
    householdId
) {

    const personId =
        sessionStorage.getItem(
            'personId'
        );

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/family/${householdId}/${personId}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error
            );

        }

        document.getElementById(
            'householdId'
        ).value =
            data.household.household_id;

        document.getElementById(
            'houseNumber'
        ).value =
            data.household.house_number;

        document.getElementById(
            'currentHead'
        ).value =
            data.household.current_head;

        loadMembers(
            data.members
        );

        loadEligibleHeads(
            data.eligibleHeads
        );

        document.getElementById(
            'householdModal'
        ).style.display =
            'flex';

    } catch (err) {

        console.error(err);

        alert(
            'Failed to load household.'
        );

    }

}

// ======================================================
// LOAD MEMBERS
// ======================================================

function loadMembers(
    members
) {

    const tbody =
        document.getElementById(
            'membersTableBody'
        );

    tbody.innerHTML = '';

    if (
        !members ||
        members.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    No members found.
                </td>
            </tr>
        `;

        return;
    }

    members.forEach(
        member => {

            tbody.innerHTML += `
                <tr>

                    <td>
                        ${member.full_name}
                    </td>

                    <td>
                        ${member.relationship_name}
                    </td>

                   <td>

    ${
        member.rstatus_id == 41

        ? `<span class="status-badge status-relocated">
                Relocated
           </span>
           <br>
           <small>
                ${member.relocation_destination || 'Unknown Destination'}
           </small>`

        : member.rstatus_id == 21

        ? `<span class="status-badge status-deceased">
                Deceased
           </span>`

        : `<span class="status-badge status-active">
                Active
           </span>`
    }

</td>

                    <td>
                        ${member.date_joined}
                    </td>

                </tr>
            `;

        }
    );

}

// ======================================================
// LOAD ELIGIBLE HEADS
// ======================================================

function loadEligibleHeads(
    eligibleHeads
) {

    const dropdown =
        document.getElementById(
            'newHeadId'
        );

    dropdown.innerHTML = `
        <option value="">
            Select Member
        </option>
    `;

    if (
        !eligibleHeads
    ) {

        return;
    }

    eligibleHeads.forEach(
        member => {

            dropdown.innerHTML += `
                <option value="${member.resident_id}">
                    ${member.full_name}
                </option>
            `;

        }
    );

}

// ======================================================
// SAVE HEAD CHANGE
// ======================================================

async function saveHeadChange() {

    const householdId =
        document.getElementById(
            'householdId'
        ).value;

    const newHeadId =
        document.getElementById(
            'newHeadId'
        ).value;

    const reason =
        document.getElementById(
            'changeReason'
        ).value;

    const personId =
        sessionStorage.getItem(
            'personId'
        );

    if (!newHeadId) {

        alert(
            'Please select the new head.'
        );

        return;
    }

    if (!reason) {

        alert(
            'Please select a reason.'
        );

        return;
    }

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/family/change-head',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        householdId,
                        newHeadId,
                        reason,
                        personId

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
            'Head of household updated successfully.'
        );

        closeModal();

        loadHouseholds();

    } catch (err) {

        console.error(err);

        alert(
            'Failed to update household.'
        );

    }

}

// ======================================================
// CLOSE MODAL
// ======================================================

function closeModal() {

    document.getElementById(
        'householdModal'
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
                'householdModal'
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
// ======================================================
// ACCOUNT STATUS MODAL
// ======================================================

function openStatusModal(
    householdId
) {

    document.getElementById(
        'statusHouseholdId'
    ).value =
        householdId;

    document.getElementById(
        'statusModal'
    ).style.display =
        'flex';

}

function closeStatusModal() {

    document.getElementById(
        'statusModal'
    ).style.display =
        'none';

}
// ======================================================
// SAVE ACCOUNT STATUS
// ======================================================

async function saveAccountStatus() {

    const householdId =
        document.getElementById(
            'statusHouseholdId'
        ).value;

    const statusId =
        document.getElementById(
            'accountStatus'
        ).value;

    try {

        const response =
            await fetch(
                'http://localhost:3000/api/family/account-status',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                        'application/json'
                    },

                    body: JSON.stringify({

                        householdId,
                        statusId

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
            'Account status updated successfully.'
        );

        closeStatusModal();

    }

    catch (err) {

        console.error(err);

        alert(
            'Failed to update account status.'
        );

    }

}