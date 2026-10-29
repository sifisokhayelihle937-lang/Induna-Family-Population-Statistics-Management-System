// ======================================================
// VILLAGE STATISTICS
// ======================================================

let genderChart = null;
let ageChart = null;

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const personId =
            sessionStorage.getItem(
                'personId'
            );

        if (!personId) {

            alert(
                'Session expired. Please login again.'
            );

            window.location.href =
                'login.html';

            return;

        }

        loadStatistics();

    }
);

// ======================================================
// LOAD STATISTICS
// ======================================================

async function loadStatistics() {

    const personId =
        sessionStorage.getItem(
            'personId'
        );

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/statistics/${personId}`
            );

        const data =
            await response.json();

        console.log(
            'Statistics:',
            data
        );

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Failed to load statistics.'
            );

        }

        loadSummaryCards(data);

        buildGenderChart(
            data.genderStats || []
        );

        buildAgeChart(
            data.ageStats || []
        );

    }

    catch (error) {

        console.error(
            error
        );

        alert(
            error.message ||
            'Failed to load statistics.'
        );

    }

}

// ======================================================
// LOAD SUMMARY CARDS
// ======================================================

function loadSummaryCards(data) {

    document.getElementById(
        'totalResidents'
    ).textContent =
        data.totalResidents || 0;

    document.getElementById(
        'totalHouseholds'
    ).textContent =
        data.totalHouseholds || 0;

    document.getElementById(
        'totalRelocated'
    ).textContent =
        data.totalRelocated || 0;

    document.getElementById(
        'totalDeceased'
    ).textContent =
        data.totalDeceased || 0;

    document.getElementById(
        'totalFunerals'
    ).textContent =
        data.totalFunerals || 0;

    document.getElementById(
        'totalMarriages'
    ).textContent =
        data.totalMarriages || 0;

}

// ======================================================
// GENDER CHART
// ======================================================

function buildGenderChart(
    genderStats
) {

    const canvas =
        document.getElementById(
            'genderChart'
        );

    if (!canvas) {

        return;

    }

    const labels =
        genderStats.map(
            item => item.gender
        );

    const values =
        genderStats.map(
            item => item.count
        );

    if (genderChart) {

        genderChart.destroy();

    }

    genderChart =
        new Chart(
            canvas,
            {

                type: 'pie',

                data: {

                    labels: labels,

                    datasets: [

                        {

                            data: values,

                            backgroundColor: [

                                '#0b5aa2',
                                '#16a34a',
                                '#f59e0b',
                                '#dc2626'

                            ]

                        }

                    ]

                },

                options: {

                    responsive: true,

                    plugins: {

                        legend: {

                            position:
                                'bottom'

                        }

                    }

                }

            }
        );

}

// ======================================================
// AGE CHART
// ======================================================

function buildAgeChart(
    ageStats
) {

    const canvas =
        document.getElementById(
            'ageChart'
        );

    if (!canvas) {

        return;

    }

    const labels =
        ageStats.map(
            item => item.group
        );

    const values =
        ageStats.map(
            item => item.count
        );

    if (ageChart) {

        ageChart.destroy();

    }

    ageChart =
        new Chart(
            canvas,
            {

                type: 'bar',

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                'Residents',

                            data: values,

                            backgroundColor:
                                '#0b5aa2'

                        }

                    ]

                },

                options: {

                    responsive: true,

                    scales: {

                        y: {

                            beginAtZero: true

                        }

                    }

                }

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