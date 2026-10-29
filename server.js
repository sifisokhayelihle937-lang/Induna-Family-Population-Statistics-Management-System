const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// ======================================================
// DATABASE CONNECTION
// ======================================================

const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Khayelihle2001@',
    database: 'village_app_db'
});

db.connect((err) => {

    if (err) {
        console.error('Database connection failed:', err.message);
        return;
    }

    console.log('Connected to village_app_db successfully!');
});

// ======================================================
// LOGIN API
// ======================================================

app.post('/api/login', (req, res) => {

    const { username, password } = req.body;

    const sql = `
        SELECT
            u.account_id,
            u.person_id,
            u.password_hash,
            r.role_name,
            s.status_name
        FROM user_accounts u
        JOIN account_roles r
            ON u.role_id = r.role_id
        JOIN user_statuses s
            ON u.status_id = s.status_id
        WHERE u.username = ?
    `;

    db.query(sql, [username], (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid username or password.'
            });
        }

        const user = rows[0];

        if (user.status_name.toLowerCase() !== 'active') {
            return res.status(403).json({
                error: 'Account is not active.'
            });
        }

        if (password !== user.password_hash) {
            return res.status(401).json({
                error: 'Invalid username or password.'
            });
        }

        db.query(
            `
            UPDATE user_accounts
            SET last_login = NOW()
            WHERE account_id = ?
            `,
            [user.account_id]
        );

        res.json({
            success: true,
            accountId: user.account_id,
            personId: user.person_id,
            roleName: user.role_name
        });

    });

});

// ======================================================
// LOAD PROVINCES, CITIES, VILLAGES
// ======================================================

app.get('/api/lookups/regions', (req, res) => {

    db.query(
        'SELECT * FROM provinces',
        (err, provinces) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            db.query(
                'SELECT * FROM cities',
                (err, cities) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    db.query(
                        'SELECT * FROM villages',
                        (err, villages) => {

                            if (err) {
                                return res.status(500).json({
                                    error: err.message
                                });
                            }

                            res.json({
                                provinces,
                                cities,
                                villages
                            });

                        }
                    );

                }
            );

        }
    );

});

// ======================================================
// HOUSEHOLD REGISTRATION
// ======================================================

app.post('/api/register', (req, res) => {

    const data = req.body;

    db.beginTransaction((err) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        // CHECK EXISTING ID NUMBER

        db.query(
            `
            SELECT person_id
            FROM persons
            WHERE id_number = ?
            `,
            [data.idNumber],
            (err, persons) => {

                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({
                            error: err.message
                        });
                    });
                }

                if (persons.length > 0) {
                    return db.rollback(() => {
                        res.status(400).json({
                            error: 'ID Number already exists.'
                        });
                    });
                }

                // CHECK USERNAME

                db.query(
                    `
                    SELECT account_id
                    FROM user_accounts
                    WHERE username = ?
                    `,
                    [data.username],
                    (err, accounts) => {

                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({
                                    error: err.message
                                });
                            });
                        }

                        if (accounts.length > 0) {
                            return db.rollback(() => {
                                res.status(400).json({
                                    error: 'Username already exists.'
                                });
                            });
                        }

                        // PERSON

                        const personSql = `
                            INSERT INTO persons
                            (
                                first_name,
                                last_name,
                                contact,
                                email_address,
                                id_number,
                                date_of_birth,
                                gender_id
                            )
                            VALUES
                            (?, ?, ?, ?, ?, ?, ?)
                        `;

                        db.query(
                            personSql,
                            [
                                data.firstName,
                                data.lastName,
                                data.contact,
                                data.email,
                                data.idNumber,
                                data.dob,
                                data.genderId
                            ],
                            (err, personResult) => {

                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            error: err.message
                                        });
                                    });
                                }

                                const personId =
                                    personResult.insertId;

                                // USER ACCOUNT

                                const accountSql = `
                                    INSERT INTO user_accounts
                                    (
                                        person_id,
                                        role_id,
                                        status_id,
                                        username,
                                        password_hash
                                    )
                                    VALUES
                                    (?, 2, 1, ?, ?)
                                `;

                                db.query(
                                    accountSql,
                                    [
                                        personId,
                                        data.username,
                                        data.password
                                    ],
                                    (err) => {

                                        if (err) {
                                            return db.rollback(() => {
                                                res.status(500).json({
                                                    error: err.message
                                                });
                                            });
                                        }

                                        // LANDPLOT

                                        const landSql = `
                                            INSERT INTO landplots
                                            (
                                                plot_number,
                                                land_size,
                                                location_description,
                                                village_id,
                                                lstatus_id
                                            )
                                            VALUES
                                            (?, ?, ?, ?, 1)
                                        `;

                                        db.query(
                                            landSql,
                                            [
                                                data.plotNo,
                                                data.landSize,
                                                data.locationDesc,
                                                data.villageId
                                            ],
                                            (err, landResult) => {

                                                if (err) {
                                                    return db.rollback(() => {
                                                        res.status(500).json({
                                                            error: err.message
                                                        });
                                                    });
                                                }

                                                const landplotId =
                                                    landResult.insertId;

                                                // HOUSEHOLD

                                                const householdSql = `
                                                    INSERT INTO households
                                                    (
                                                        house_number,
                                                        landplot_id,
                                                        hstatus_id,
                                                        date_joined
                                                    )
                                                    VALUES
                                                    (?, ?, 1, CURDATE())
                                                `;

                                                db.query(
                                                    householdSql,
                                                    [
                                                        data.houseNo,
                                                        landplotId
                                                    ],
                                                    (err, householdResult) => {

                                                        if (err) {
                                                            return db.rollback(() => {
                                                                res.status(500).json({
                                                                    error: err.message
                                                                });
                                                            });
                                                        }

                                                        const householdId =
                                                            householdResult.insertId;

                                                        // RESIDENT

                                                        const residentSql = `
                                                            INSERT INTO residents
                                                            (
                                                                person_id,
                                                                household_id,
                                                                relationship_id,
                                                                rstatus_id,
                                                                date_joined
                                                            )
                                                            VALUES
                                                            (?, ?, 1, 1, CURDATE())
                                                        `;

                                                        db.query(
                                                            residentSql,
                                                            [
                                                                personId,
                                                                householdId
                                                            ],
                                                            (err) => {

                                                                if (err) {
                                                                    return db.rollback(() => {
                                                                        res.status(500).json({
                                                                            error: err.message
                                                                        });
                                                                    });
                                                                }

                                                                // POPULATION STATS

                                                                const populationSql = `
                                                                    INSERT INTO population_stats
                                                                    (
                                                                        village_id,
                                                                        total_population
                                                                    )
                                                                    VALUES
                                                                    (?,1)
                                                                    ON DUPLICATE KEY UPDATE
                                                                    total_population =
                                                                    total_population + 1
                                                                `;

                                                                db.query(
                                                                    populationSql,
                                                                    [data.villageId],
                                                                    (err) => {

                                                                        if (err) {
                                                                            return db.rollback(() => {
                                                                                res.status(500).json({
                                                                                    error: err.message
                                                                                });
                                                                            });
                                                                        }

                                                                        db.commit((err) => {

                                                                            if (err) {
                                                                                return db.rollback(() => {
                                                                                    res.status(500).json({
                                                                                        error: err.message
                                                                                    });
                                                                                });
                                                                            }

                                                                            res.json({
                                                                                success: true,
                                                                                message: 'Household registered successfully.'
                                                                            });

                                                                        });

                                                                    }
                                                                );

                                                            }
                                                        );

                                                    }
                                                );

                                            }
                                        );

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    });

});
// ======================================================
// ADMIN DASHBOARD
// ======================================================

app.get('/api/admin/dashboard/:personId', (req, res) => {

    const personId = req.params.personId;

    const adminSql = `
        SELECT
            p.first_name,
            p.last_name,
            v.village_id,
            v.village_name
        FROM itadmins ia
        JOIN persons p
            ON ia.person_id = p.person_id
        JOIN villages v
            ON ia.village_id = v.village_id
        WHERE ia.person_id = ?
    `;

    db.query(adminSql, [personId], (err, adminRows) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (adminRows.length === 0) {
            return res.status(404).json({
                error: 'Admin not found.'
            });
        }

        const admin = adminRows[0];
        const villageId = admin.village_id;

        // =====================================
        // POPULATION
        // =====================================

        const populationSql = `
            SELECT
                IFNULL(total_population,0) AS total_population
            FROM population_stats
            WHERE village_id = ?
        `;

        // =====================================
        // HOUSEHOLDS
        // =====================================

        const householdSql = `
            SELECT
                COUNT(*) AS total_households
            FROM households h
            JOIN landplots lp
                ON h.landplot_id = lp.landplot_id
            WHERE lp.village_id = ?
        `;

        // =====================================
        // OPEN TICKETS
        // =====================================

        const openTicketsSql = `
    SELECT
        COUNT(*) AS open_tickets

    FROM technical_helpdesk th

    JOIN residents r
        ON th.resident_id = r.resident_id

    JOIN households h
        ON r.household_id = h.household_id

    JOIN landplots lp
        ON h.landplot_id = lp.landplot_id

    WHERE
        lp.village_id = ?
        AND th.ticket_status_id IN (1,2)
`;

        // =====================================
        // RECENT HOUSEHOLDS
        // =====================================

        const recentHouseholdsSql = `
            SELECT
                h.house_number,
                lp.plot_number,
                lp.location_description
            FROM households h
            JOIN landplots lp
                ON h.landplot_id = lp.landplot_id
            WHERE lp.village_id = ?
            ORDER BY h.household_id DESC
            LIMIT 5
        `;

        db.query(
            populationSql,
            [villageId],
            (err, populationRows) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                db.query(
                    householdSql,
                    [villageId],
                    (err, householdRows) => {

                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        db.query(
    openTicketsSql,
    [villageId],
    (err, ticketRows) => {

                                if (err) {
                                    return res.status(500).json({
                                        error: err.message
                                    });
                                }

                                db.query(
                                    recentHouseholdsSql,
                                    [villageId],
                                    (err, recentRows) => {

                                        if (err) {
                                            return res.status(500).json({
                                                error: err.message
                                            });
                                        }

                                        res.json({

                                            adminName:
                                                admin.first_name +
                                                ' ' +
                                                admin.last_name,

                                            villageName:
                                                admin.village_name,

                                            totalPopulation:
                                                populationRows.length > 0
                                                    ? populationRows[0].total_population
                                                    : 0,

                                            totalHouseholds:
                                                householdRows[0].total_households,

                                            openTickets:
                                                ticketRows[0].open_tickets,

                                            recentHouseholds:
                                                recentRows

                                        });

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    });

});
// ======================================================
// LOAD CURRENT INDUNA
// ======================================================

app.get('/api/indunas/current/:personId', (req, res) => {

    const personId = req.params.personId;

    const adminSql = `
        SELECT
            p.first_name,
            p.last_name,
            v.village_id,
            v.village_name
        FROM itadmins ia
        JOIN persons p
            ON ia.person_id = p.person_id
        JOIN villages v
            ON ia.village_id = v.village_id
        WHERE ia.person_id = ?
    `;

    db.query(adminSql, [personId], (err, adminRows) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (adminRows.length === 0) {
            return res.status(404).json({
                error: 'Admin not found.'
            });
        }

        const admin = adminRows[0];

        const indunaSql = `
            SELECT
                i.induna_id,
                i.traditional_name,
                i.date_appointed,
                p.first_name,
                p.last_name,
                p.contact,
                p.email_address,
                us.status_id,
                us.status_name
            FROM indunas i
            JOIN persons p
                ON i.person_id = p.person_id
            JOIN user_accounts ua
                ON p.person_id = ua.person_id
            JOIN user_statuses us
                ON ua.status_id = us.status_id
            WHERE i.village_id = ?
            LIMIT 1
        `;

        db.query(
            indunaSql,
            [admin.village_id],
            (err, indunaRows) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                if (indunaRows.length === 0) {

                    return res.json({
                        adminName:
                            admin.first_name +
                            ' ' +
                            admin.last_name,

                        villageName:
                            admin.village_name,

                        indunaExists: false
                    });
                }

                const induna = indunaRows[0];

                res.json({

                    adminName:
                        admin.first_name +
                        ' ' +
                        admin.last_name,

                    villageName:
                        admin.village_name,

                    indunaExists: true,

                    traditionalName:
                        induna.traditional_name,

                    fullName:
                        induna.first_name +
                        ' ' +
                        induna.last_name,

                    contact:
                        induna.contact,

                    email:
                        induna.email_address,

                    dateAppointed:
                        induna.date_appointed,

                    statusId:
                        induna.status_id,

                    statusName:
                        induna.status_name
                });

            }
        );

    });

});
// ======================================================
// REGISTER NEW INDUNA
// ======================================================

app.post('/api/indunas/assign', (req, res) => {

    const data = req.body;

    const villageSql = `
        SELECT village_id
        FROM itadmins
        WHERE person_id = ?
    `;

    db.query(
        villageSql,
        [data.adminPersonId],
        (err, villageRows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            const villageId =
                villageRows[0].village_id;

            db.beginTransaction((err) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                const personSql = `
                    INSERT INTO persons
                    (
                        first_name,
                        last_name,
                        id_number,
                        contact,
                        email_address,
                        date_of_birth,
                        gender_id
                    )
                    VALUES
                    (?, ?, ?, ?, ?, ?, ?)
                `;

                db.query(
                    personSql,
                    [
                        data.firstName,
                        data.lastName,
                        data.idNumber,
                        data.contact,
                        data.email,
                        data.dateOfBirth,
                        data.genderId
                    ],
                    (err, personResult) => {

                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({
                                    error: err.message
                                });
                            });
                        }

                        const personId =
                            personResult.insertId;

                        const accountSql = `
                            INSERT INTO user_accounts
                            (
                                person_id,
                                role_id,
                                status_id,
                                username,
                                password_hash
                            )
                            VALUES
                            (?, 3, 1, ?, ?)
                        `;

                        db.query(
                            accountSql,
                            [
                                personId,
                                data.username,
                                data.password
                            ],
                            (err) => {

                                if (err) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            error: err.message
                                        });
                                    });
                                }

                                const indunaSql = `
                                    INSERT INTO indunas
                                    (
                                        person_id,
                                        village_id,
                                        date_appointed,
                                        traditional_name
                                    )
                                    VALUES
                                    (
                                        ?,
                                        ?,
                                        CURDATE(),
                                        ?
                                    )
                                `;

                                db.query(
                                    indunaSql,
                                    [
                                        personId,
                                        villageId,
                                        data.traditionalName
                                    ],
                                    (err) => {

                                        if (err) {
                                            return db.rollback(() => {
                                                res.status(500).json({
                                                    error: err.message
                                                });
                                            });
                                        }

                                        db.commit((err) => {

                                            if (err) {
                                                return db.rollback(() => {
                                                    res.status(500).json({
                                                        error: err.message
                                                    });
                                                });
                                            }

                                            res.json({
                                                success: true
                                            });

                                        });

                                    }
                                );

                            }
                        );

                    }
                );

            });

        }
    );

});
// ======================================================
// UPDATE INDUNA STATUS
// ======================================================

app.put('/api/indunas/status', (req, res) => {

    const {
        adminPersonId,
        statusId
    } = req.body;

    const indunaSql = `
        SELECT
            ua.account_id
        FROM itadmins ia
        JOIN indunas i
            ON ia.village_id = i.village_id
        JOIN user_accounts ua
            ON i.person_id = ua.person_id
        WHERE ia.person_id = ?
    `;

    db.query(
        indunaSql,
        [adminPersonId],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (rows.length === 0) {

                return res.status(404).json({
                    error: 'No Induna found.'
                });
            }

            db.query(
                `
                UPDATE user_accounts
                SET status_id = ?
                WHERE account_id = ?
                `,
                [
                    statusId,
                    rows[0].account_id
                ],
                (err) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.json({
                        success: true
                    });

                }
            );

        }
    );

});
// ======================================================
// RESIDENT DASHBOARD
// ======================================================

app.get('/api/resident/dashboard/:personId', (req, res) => {

    const personId = req.params.personId;

    const residentSql = `
        SELECT
            p.first_name,
            p.last_name,
            h.house_number,
            v.village_name,
            h.household_id
        FROM residents r
        JOIN persons p
            ON r.person_id = p.person_id
        JOIN households h
            ON r.household_id = h.household_id
        JOIN landplots lp
            ON h.landplot_id = lp.landplot_id
        JOIN villages v
            ON lp.village_id = v.village_id
        WHERE p.person_id = ?
        LIMIT 1
    `;

    db.query(
        residentSql,
        [personId],
        (err, residentRows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (residentRows.length === 0) {

                return res.status(404).json({
                    error: 'Resident not found.'
                });

            }

            const resident = residentRows[0];

            const householdId =
                resident.household_id;

            const totalMembersSql = `
                SELECT COUNT(*) total_members
                FROM residents
                WHERE household_id = ?
            `;

            const deceasedSql = `
                SELECT COUNT(*) total_deceased
                FROM residents
                WHERE household_id = ?
                AND rstatus_id = 21
            `;

            const relocatedSql = `
                SELECT COUNT(*) total_relocated
                FROM residents
                WHERE household_id = ?
                AND rstatus_id = 41
            `;

            const activitiesSql = `
                SELECT COUNT(*) total_activities
                FROM village_activities
                WHERE household_id = ?
            `;

            const issuesSql = `
                SELECT COUNT(*) total_issues
                FROM technical_helpdesk th
                JOIN residents r
                    ON th.resident_id = r.resident_id
                WHERE r.household_id = ?
            `;

            const activityListSql = `
                SELECT
                    at.display_label,
                    va.description,
                    va.activity_date,
                    ast.act_status_name
                FROM village_activities va
                JOIN activity_types at
                    ON va.activity_type_id = at.activity_type_id
                JOIN activity_statuses ast
                    ON va.activity_status_id = ast.activity_status_id
                WHERE va.household_id = ?
                ORDER BY va.activity_id DESC
                LIMIT 5
            `;

            db.query(
                totalMembersSql,
                [householdId],
                (err, memberRows) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    db.query(
                        deceasedSql,
                        [householdId],
                        (err, deceasedRows) => {

                            if (err) {
                                return res.status(500).json({
                                    error: err.message
                                });
                            }

                            db.query(
                                relocatedSql,
                                [householdId],
                                (err, relocatedRows) => {

                                    if (err) {
                                        return res.status(500).json({
                                            error: err.message
                                        });
                                    }

                                    db.query(
                                        activitiesSql,
                                        [householdId],
                                        (err, activityRows) => {

                                            if (err) {
                                                return res.status(500).json({
                                                    error: err.message
                                                });
                                            }

                                            db.query(
                                                issuesSql,
                                                [householdId],
                                                (err, issueRows) => {

                                                    if (err) {
                                                        return res.status(500).json({
                                                            error: err.message
                                                        });
                                                    }

                                                    db.query(
                                                        activityListSql,
                                                        [householdId],
                                                        (err, activities) => {

                                                            if (err) {
                                                                return res.status(500).json({
                                                                    error: err.message
                                                                });
                                                            }

                                                            res.json({

                                                                fullName:
                                                                    resident.first_name +
                                                                    ' ' +
                                                                    resident.last_name,

                                                                houseNumber:
                                                                    resident.house_number,

                                                                villageName:
                                                                    resident.village_name,

                                                                totalMembers:
                                                                    memberRows[0].total_members,

                                                                totalDeceased:
                                                                    deceasedRows[0].total_deceased,

                                                                totalRelocated:
                                                                    relocatedRows[0].total_relocated,

                                                                reportedActivities:
                                                                    activityRows[0].total_activities,

                                                                reportedIssues:
                                                                    issueRows[0].total_issues,

                                                                activities

                                                            });

                                                        }
                                                    );

                                                }
                                            );

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});
// ======================================================
// LOAD FAMILY MEMBERS
// ======================================================

app.get('/api/members/:personId', (req, res) => {

    const personId = req.params.personId;

    const householdSql = `
        SELECT household_id
        FROM residents
        WHERE person_id = ?
    `;

    db.query(
        householdSql,
        [personId],
        (err, householdRows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (householdRows.length === 0) {

                return res.status(404).json({
                    error: 'Household not found.'
                });

            }

            const householdId =
                householdRows[0].household_id;

            const membersSql = `
                SELECT
                    r.resident_id,
                    p.first_name,
                    p.last_name,
                    p.contact,
                    rr.relationship_name,
                    rs.rstatus_id,
                    rs.rstatus_description,
                    r.date_joined
                FROM residents r
                JOIN persons p
                    ON r.person_id = p.person_id
                JOIN resident_relationships rr
                    ON r.relationship_id = rr.relationship_id
                JOIN resident_statuses rs
                    ON r.rstatus_id = rs.rstatus_id
                WHERE r.household_id = ?
                ORDER BY p.first_name
            `;

            db.query(
                membersSql,
                [householdId],
                (err, members) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.json({
                        members
                    });

                }
            );

        }
    );

});
// ======================================================
// ADD FAMILY MEMBER
// ======================================================

app.post('/api/members/add', (req, res) => {

    const data = req.body;

    const householdSql = `
        SELECT
            r.household_id,
            lp.village_id
        FROM residents r
        JOIN households h
            ON r.household_id = h.household_id
        JOIN landplots lp
            ON h.landplot_id = lp.landplot_id
        WHERE r.person_id = ?
    `;

    db.query(
        householdSql,
        [data.personId],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            if (rows.length === 0) {

                return res.status(404).json({
                    error: 'Household not found.'
                });

            }

            const householdId =
                rows[0].household_id;

            const villageId =
                rows[0].village_id;

            db.query(
                `
                SELECT person_id
                FROM persons
                WHERE id_number = ?
                `,
                [data.idNumber],
                (err, existing) => {

                    if (err) {

                        return res.status(500).json({
                            error: err.message
                        });

                    }

                    if (existing.length > 0) {

                        return res.status(400).json({
                            error:
                                'ID Number already exists.'
                        });

                    }

                    db.beginTransaction(
                        err => {

                            if (err) {

                                return res.status(500).json({
                                    error: err.message
                                });

                            }

                            const personSql = `
                                INSERT INTO persons
                                (
                                    first_name,
                                    last_name,
                                    id_number,
                                    contact,
                                    email_address,
                                    date_of_birth,
                                    gender_id
                                )
                                VALUES
                                (?, ?, ?, ?, ?, ?, ?)
                            `;

                            db.query(
                                personSql,
                                [
                                    data.firstName,
                                    data.lastName,
                                    data.idNumber,
                                    data.contact || null,
                                    data.emailAddress || null,
                                    data.dateOfBirth,
                                    data.genderId
                                ],
                                (err, personResult) => {

                                    if (err) {

                                        return db.rollback(() => {

                                            res.status(500).json({
                                                error: err.message
                                            });

                                        });

                                    }

                                    const newPersonId =
                                        personResult.insertId;

                                    db.query(
                                        `
                                        INSERT INTO residents
                                        (
                                            person_id,
                                            household_id,
                                            relationship_id,
                                            date_joined,
                                            rstatus_id
                                        )
                                        VALUES
                                        (
                                            ?,
                                            ?,
                                            ?,
                                            CURDATE(),
                                            1
                                        )
                                        `,
                                        [
                                            newPersonId,
                                            householdId,
                                            data.relationshipId
                                        ],
                                        (err) => {

                                            if (err) {

                                                return db.rollback(() => {

                                                    res.status(500).json({
                                                        error: err.message
                                                    });

                                                });

                                            }

                                            db.query(
                                                `
                                                UPDATE population_stats
                                                SET total_population =
                                                    total_population + 1
                                                WHERE village_id = ?
                                                `,
                                                [villageId],
                                                (err) => {

                                                    if (err) {

                                                        return db.rollback(() => {

                                                            res.status(500).json({
                                                                error: err.message
                                                            });

                                                        });

                                                    }

                                                    db.commit(
                                                        err => {

                                                            if (err) {

                                                                return db.rollback(() => {

                                                                    res.status(500).json({
                                                                        error: err.message
                                                                    });

                                                                });

                                                            }

                                                            res.json({
                                                                success: true
                                                            });

                                                        }
                                                    );

                                                }
                                            );

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});
// ======================================================
// UPDATE HEAD ACCOUNT STATUS
// ======================================================

app.put(
    '/api/family/account-status',
    (req, res) => {

        const {
            householdId,
            statusId
        } = req.body;

        const sql = `

            UPDATE user_accounts

            SET status_id = ?

            WHERE person_id = (

                SELECT person_id

                FROM residents

                WHERE
                    household_id = ?
                    AND relationship_id = 1

                LIMIT 1

            )

        `;

        db.query(
            sql,
            [
                statusId,
                householdId
            ],
            (err) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }

                res.json({
                    success: true
                });

            }
        );

    }
);


// UPDATE MEMBER STATUS


app.put('/api/members/status', (req, res) => {

    const {
        residentId,
        rstatusId,
        dateLeft,
        relocationDestination
    } = req.body;

    const residentSql = `
        SELECT
            r.rstatus_id,
            lp.village_id
        FROM residents r
        JOIN households h
            ON r.household_id = h.household_id
        JOIN landplots lp
            ON h.landplot_id = lp.landplot_id
        WHERE r.resident_id = ?
    `;

    db.query(
        residentSql,
        [residentId],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            if (rows.length === 0) {

                return res.status(404).json({
                    error: 'Resident not found.'
                });

            }

            const oldStatus =
                rows[0].rstatus_id;

            const villageId =
                rows[0].village_id;

            db.query(
                `
                UPDATE residents
                SET
                    rstatus_id = ?,
                    date_left = ?,
                    relocation_destination = ?
                WHERE resident_id = ?
                `,
                [
                    rstatusId,
                    dateLeft || null,
                    relocationDestination || null,
                    residentId
                ],
                (err) => {

                    if (err) {

                        return res.status(500).json({
                            error: err.message
                        });

                    }

                    // Alive -> Deceased/Relocated

                    if (
                        oldStatus === 1 &&
                        (
                            Number(rstatusId) === 21 ||
                            Number(rstatusId) === 41
                        )
                    ) {

                        db.query(
                            `
                            UPDATE population_stats
                            SET total_population =
                                total_population - 1
                            WHERE village_id = ?
                            `,
                            [villageId]
                        );

                    }

                    // Deceased/Relocated -> Alive

                    if (
                        (
                            oldStatus === 21 ||
                            oldStatus === 41
                        )
                        &&
                        Number(rstatusId) === 1
                    ) {

                        db.query(
                            `
                            UPDATE population_stats
                            SET total_population =
                                total_population + 1
                            WHERE village_id = ?
                            `,
                            [villageId]
                        );

                    }

                    res.json({
                        success: true
                    });

                }
            );

        }
    );

});

// LOAD ACTIVITY TYPES


app.get('/api/activity-types', (req, res) => {

    db.query(
        `
        SELECT
            activity_type_id,
            display_label
        FROM activity_types
        ORDER BY display_label
        `,
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            res.json({
                activityTypes: rows
            });

        }
    );

});

// REPORT ACTIVITY

app.post('/api/activities/report', (req, res) => {

    const {
        personId,
        activityTypeId,
        activityDate,
        description
    } = req.body;

    const householdSql = `
        SELECT household_id
        FROM residents
        WHERE person_id = ?
    `;

    db.query(
        householdSql,
        [personId],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            if (rows.length === 0) {

                return res.status(404).json({
                    error: 'Household not found.'
                });

            }

            const householdId =
                rows[0].household_id;

            const insertSql = `
                INSERT INTO village_activities
                (
                    household_id,
                    person_id,
                    activity_type_id,
                    activity_date,
                    description,
                    date_logged,
                    activity_status_id
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    NOW(),
                    1
                )
            `;

            db.query(
                insertSql,
                [
                    householdId,
                    personId,
                    activityTypeId,
                    activityDate,
                    description
                ],
                (err) => {

                    if (err) {

                        return res.status(500).json({
                            error: err.message
                        });

                    }

                    res.json({
                        success: true
                    });

                }
            );

        }
    );

});
// ======================================================
// LOAD REPORTED ACTIVITIES
// ======================================================

app.get('/api/activities/:personId', (req, res) => {

    const personId = req.params.personId;

    const sql = `
        SELECT
            va.activity_id,
            va.activity_date,
            va.description,
            va.date_logged,
            va.review_comment,
            va.review_date,
            va.activity_status_id,
            at.display_label,
            ast.act_status_name
        FROM village_activities va
        JOIN activity_types at
            ON va.activity_type_id =
               at.activity_type_id
        JOIN activity_statuses ast
            ON va.activity_status_id =
               ast.activity_status_id
        WHERE va.person_id = ?
        ORDER BY va.activity_id DESC
    `;

    db.query(
        sql,
        [personId],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            res.json({
                activities: rows
            });

        }
    );

});


// DELETE ACTIVITY


app.delete(
    '/api/activities/:activityId/:personId',
    (req, res) => {

        const activityId =
            req.params.activityId;

        const personId =
            req.params.personId;

        const sql = `

            DELETE FROM village_activities

            WHERE
                activity_id = ?
                AND person_id = ?
                AND activity_status_id = 1

        `;

        db.query(
            sql,
            [
                activityId,
                personId
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }

                if (
                    result.affectedRows === 0
                ) {

                    return res.status(400).json({
                        error:
                            'Only reported activities can be deleted.'
                    });

                }

                res.json({
                    success: true
                });

            }
        );

    }
);

// LOAD ISSUE CATEGORIES


app.get('/api/issue-categories', (req, res) => {

    db.query(
        `
        SELECT
            issue_category_id,
            category_name
        FROM issue_categories
        ORDER BY category_name
        `,
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            res.json({
                categories: rows
            });

        }
    );

});

// SUBMIT SUPPORT TICKET


app.post('/api/issues/report', (req, res) => {

    const {
        personId,
        issueCategoryId,
        subject,
        bugDetails
    } = req.body;

    const residentSql = `
        SELECT resident_id
        FROM residents
        WHERE person_id = ?
    `;

    db.query(
        residentSql,
        [personId],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            if (rows.length === 0) {

                return res.status(404).json({
                    error: 'Resident not found.'
                });

            }

            const residentId =
                rows[0].resident_id;

            const sql = `
                INSERT INTO technical_helpdesk
                (
                    resident_id,
                    issue_category_id,
                    ticket_status_id,
                    subject,
                    bug_details,
                    date_logged
                )
                VALUES
                (
                    ?,
                    ?,
                    1,
                    ?,
                    ?,
                    NOW()
                )
            `;

            db.query(
                sql,
                [
                    residentId,
                    issueCategoryId,
                    subject,
                    bugDetails
                ],
                (err) => {

                    if (err) {

                        return res.status(500).json({
                            error: err.message
                        });

                    }

                    res.json({
                        success: true
                    });

                }
            );

        }
    );

});

// LOAD MY REPORTED ISSUES


app.get('/api/issues/:personId', (req, res) => {

    const personId = req.params.personId;

    const sql = `
        SELECT
            th.ticket_id,
            th.subject,
            th.bug_details,
            th.admin_solution,
            th.date_logged,
            th.date_resolved,
            th.ticket_status_id,
            ic.category_name,
            ts.status_name
        FROM technical_helpdesk th
        JOIN residents r
            ON th.resident_id = r.resident_id
        JOIN issue_categories ic
            ON th.issue_category_id =
               ic.issue_category_id
        JOIN ticket_statuses ts
            ON th.ticket_status_id =
               ts.ticket_status_id
        WHERE r.person_id = ?
        ORDER BY th.ticket_id DESC
    `;

    db.query(
        sql,
        [personId],
        (err, rows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            res.json({
                issues: rows
            });

        }
    );

});

// DELETE SUPPORT TICKET


app.delete(
    '/api/issues/:ticketId/:personId',
    (req, res) => {

        const ticketId =
            req.params.ticketId;

        const personId =
            req.params.personId;

        const sql = `

            DELETE th

            FROM technical_helpdesk th

            JOIN residents r
                ON th.resident_id =
                   r.resident_id

            WHERE

                th.ticket_id = ?
                AND r.person_id = ?
                AND th.ticket_status_id = 1

        `;

        db.query(
            sql,
            [
                ticketId,
                personId
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }

                if (
                    result.affectedRows === 0
                ) {

                    return res.status(400).json({
                        error:
                        'Only open tickets can be deleted.'
                    });

                }

                res.json({
                    success: true
                });

            }
        );

    }
);

// HELPDESK TICKETS


app.get('/api/helpdesk/tickets/:personId', (req, res) => {

    const personId = req.params.personId;

    const sql = `
        SELECT

            th.ticket_id,
            th.subject,
            th.date_logged,
            th.ticket_status_id,

            ic.category_name,

            ts.status_name,

            CONCAT(
                p.first_name,
                ' ',
                p.last_name
            ) AS full_name

        FROM technical_helpdesk th

        JOIN residents r
            ON th.resident_id = r.resident_id

        JOIN persons p
            ON r.person_id = p.person_id

        JOIN households h
            ON r.household_id = h.household_id

        JOIN landplots lp
            ON h.landplot_id = lp.landplot_id

        JOIN issue_categories ic
            ON th.issue_category_id =
               ic.issue_category_id

        JOIN ticket_statuses ts
            ON th.ticket_status_id =
               ts.ticket_status_id

        WHERE lp.village_id IN (

            SELECT village_id
            FROM itadmins
            WHERE person_id = ?

        )

        ORDER BY th.ticket_id DESC
    `;

    db.query(
        sql,
        [personId],
        (err, tickets) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    error: err.message
                });

            }

            let open = 0;
            let inProgress = 0;
            let resolved = 0;
            let closed = 0;

            tickets.forEach(ticket => {

                if (Number(ticket.ticket_status_id) === 1)
                    open++;

                if (Number(ticket.ticket_status_id) === 2)
                    inProgress++;

                if (Number(ticket.ticket_status_id) === 3)
                    resolved++;

                if (Number(ticket.ticket_status_id) === 4)
                    closed++;

            });

            res.json({

                summary: {
                    open,
                    inProgress,
                    resolved,
                    closed
                },

                tickets

            });

        }
    );

});

// SINGLE HELPDESK TICKET


app.get(
    '/api/helpdesk/ticket/:ticketId/:personId',
    (req, res) => {

        const ticketId =
            req.params.ticketId;

        const personId =
            req.params.personId;

        const sql = `

            SELECT

                th.ticket_id,
                th.subject,
                th.bug_details,
                th.admin_solution,
                th.ticket_status_id,
                th.date_logged,
                th.date_resolved,

                ic.category_name,

                CONCAT(
                    p.first_name,
                    ' ',
                    p.last_name
                ) AS full_name

            FROM technical_helpdesk th

            JOIN residents r
                ON th.resident_id = r.resident_id

            JOIN persons p
                ON r.person_id = p.person_id

            JOIN households h
                ON r.household_id = h.household_id

            JOIN landplots lp
                ON h.landplot_id = lp.landplot_id

            JOIN itadmins ia
                ON lp.village_id = ia.village_id

            JOIN issue_categories ic
                ON th.issue_category_id =
                   ic.issue_category_id

            WHERE
                th.ticket_id = ?
                AND ia.person_id = ?

        `;

        db.query(
            sql,
            [ticketId, personId],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }

                if (rows.length === 0) {

                    return res.status(404).json({
                        error:'Ticket not found'
                    });

                }

                res.json({
                    ticket: rows[0]
                });

            }
        );

    }
);

// UPDATE HELPDESK TICKET


app.put('/api/helpdesk/update', (req, res) => {

    const {
        ticketId,
        ticketStatusId,
        adminSolution
    } = req.body;

    
    // VALIDATION
    

    if (
        (
            Number(ticketStatusId) === 3 ||
            Number(ticketStatusId) === 4
        )
        &&
        !adminSolution
    ) {

        return res.status(400).json({
            error:
                'Support response is required.'
        });

    }

    const sql = `
        UPDATE technical_helpdesk

        SET

            ticket_status_id = ?,

            admin_solution = ?,

            date_resolved =

                CASE

                    WHEN ? IN (3,4)

                    THEN NOW()

                    ELSE date_resolved

                END

        WHERE ticket_id = ?
    `;

    db.query(
        sql,
        [
            ticketStatusId,
            adminSolution,
            ticketStatusId,
            ticketId
        ],
        (err) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            res.json({
                success: true,
                message:
                    'Ticket updated successfully.'
            });

        }
    );

});


// INDUNA DASHBOARD


app.get('/api/induna/dashboard/:personId', (req, res) => {

    const personId = req.params.personId;

    const indunaSql = `
        SELECT
            p.first_name,
            p.last_name,
            v.village_id,
            v.village_name
        FROM indunas i
        JOIN persons p
            ON i.person_id = p.person_id
        JOIN villages v
            ON i.village_id = v.village_id
        WHERE i.person_id = ?
    `;

    db.query(
        indunaSql,
        [personId],
        (err, indunaRows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            if (indunaRows.length === 0) {

                return res.status(404).json({
                    error: 'Induna not found.'
                });

            }

            const induna =
                indunaRows[0];

            const villageId =
                induna.village_id;

            // ==========================
            // TOTAL FAMILIES
            // ==========================

            const familiesSql = `
                SELECT
                    COUNT(*) AS total_families
                FROM households h
                JOIN landplots lp
                    ON h.landplot_id = lp.landplot_id
                WHERE lp.village_id = ?
            `;

            // ==========================
            // TOTAL RESIDENTS
            // ==========================

            const residentsSql = `
                SELECT
                    COUNT(*) AS total_residents
                FROM residents r
                JOIN households h
                    ON r.household_id = h.household_id
                JOIN landplots lp
                    ON h.landplot_id = lp.landplot_id
                WHERE lp.village_id = ?
                AND r.rstatus_id = 1
            `;

            // ==========================
            // REPORTED ACTIVITIES
            // ==========================

            const activitiesCountSql = `
                SELECT
                    COUNT(*) AS reported_activities
                FROM village_activities va
                JOIN households h
                    ON va.household_id = h.household_id
                JOIN landplots lp
                    ON h.landplot_id = lp.landplot_id
                WHERE lp.village_id = ?
                AND va.activity_status_id = 1
            `;

            // ==========================
            // RECENT ACTIVITIES
            // ==========================

            const recentActivitiesSql = `
                SELECT

                    va.activity_id,

                    h.house_number,

                    at.display_label,

                    va.activity_date,

                    va.activity_status_id,

                    ast.act_status_name

                FROM village_activities va

                JOIN households h
                    ON va.household_id =
                       h.household_id

                JOIN landplots lp
                    ON h.landplot_id =
                       lp.landplot_id

                JOIN activity_types at
                    ON va.activity_type_id =
                       at.activity_type_id

                JOIN activity_statuses ast
                    ON va.activity_status_id =
                       ast.activity_status_id

                WHERE lp.village_id = ?

                ORDER BY va.activity_id DESC

                LIMIT 10
            `;

            db.query(
                familiesSql,
                [villageId],
                (err, familyRows) => {

                    if (err) {

                        return res.status(500).json({
                            error: err.message
                        });

                    }

                    db.query(
                        residentsSql,
                        [villageId],
                        (err, residentRows) => {

                            if (err) {

                                return res.status(500).json({
                                    error: err.message
                                });

                            }

                            db.query(
                                activitiesCountSql,
                                [villageId],
                                (err, activityRows) => {

                                    if (err) {

                                        return res.status(500).json({
                                            error: err.message
                                        });

                                    }

                                    db.query(
                                        recentActivitiesSql,
                                        [villageId],
                                        (err, activities) => {

                                            if (err) {

                                                return res.status(500).json({
                                                    error: err.message
                                                });

                                            }

                                            res.json({

                                                indunaName:
                                                    induna.first_name +
                                                    ' ' +
                                                    induna.last_name,

                                                villageName:
                                                    induna.village_name,

                                                totalFamilies:
                                                    familyRows[0].total_families,

                                                totalResidents:
                                                    residentRows[0].total_residents,

                                                reportedActivities:
                                                    activityRows[0].reported_activities,

                                                activities

                                            });

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});

// LOAD VILLAGE HOUSEHOLDS


app.get('/api/families/:personId', (req, res) => {

    const personId = req.params.personId;

    const sql = `

        SELECT

            h.household_id,

            h.house_number,

            CONCAT(
                p.first_name,
                ' ',
                p.last_name
            ) AS head_name,

            COUNT(r2.resident_id) AS family_size

        FROM indunas i

        JOIN landplots lp
            ON i.village_id = lp.village_id

        JOIN households h
            ON lp.landplot_id = h.landplot_id

        JOIN residents r
            ON h.household_id = r.household_id
            AND r.relationship_id = 1

        JOIN persons p
            ON r.person_id = p.person_id

        LEFT JOIN residents r2
            ON h.household_id = r2.household_id

        WHERE i.person_id = ?

        GROUP BY
            h.household_id,
            h.house_number,
            p.first_name,
            p.last_name

        ORDER BY h.house_number

    `;

    db.query(
        sql,
        [personId],
        (err, households) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            res.json({
                households
            });

        }
    );

});

// LOAD HOUSEHOLD DETAILS


app.get(
    '/api/family/:householdId/:personId',
    (req, res) => {

        const householdId =
            req.params.householdId;

        const personId =
            req.params.personId;

        const householdSql = `

            SELECT

                h.household_id,

                h.house_number,

                CONCAT(
                    p.first_name,
                    ' ',
                    p.last_name
                ) AS current_head

            FROM households h

            JOIN landplots lp
                ON h.landplot_id =
                   lp.landplot_id

            JOIN indunas i
                ON lp.village_id =
                   i.village_id

            JOIN residents r
                ON h.household_id =
                   r.household_id

            JOIN persons p
                ON r.person_id =
                   p.person_id

            WHERE
                h.household_id = ?
                AND i.person_id = ?
                AND r.relationship_id = 1

        `;

        db.query(
            householdSql,
            [householdId, personId],
            (err, householdRows) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }

                if (
                    householdRows.length === 0
                ) {

                    return res.status(403).json({
                        error:
                        'Household not found or access denied.'
                    });

                }

                const household =
                    householdRows[0];

                const membersSql = `

                    SELECT

    r.resident_id,

    CONCAT(
        p.first_name,
        ' ',
        p.last_name
    ) AS full_name,

    rr.relationship_name,

    rs.rstatus_description,

    r.relocation_destination,

    r.date_joined,

    r.relationship_id,

    r.rstatus_id

                    FROM residents r

                    JOIN persons p
                        ON r.person_id =
                           p.person_id

                    JOIN resident_relationships rr
                        ON r.relationship_id =
                           rr.relationship_id

                    JOIN resident_statuses rs
                        ON r.rstatus_id =
                           rs.rstatus_id

                    WHERE
                        r.household_id = ?

                    ORDER BY
                        p.first_name

                `;

                db.query(
                    membersSql,
                    [householdId],
                    (err, members) => {

                        if (err) {

                            return res.status(500).json({
                                error: err.message
                            });

                        }

                        const eligibleHeads =
                            members.filter(
                                member =>
                                    Number(member.rstatus_id) === 1 &&
                                    Number(member.relationship_id) !== 1
                            );

                        res.json({

                            household,

                            members,

                            eligibleHeads

                        });

                    }
                );

            }
        );

    }
);
// ======================================================
// CHANGE HOUSEHOLD HEAD
// ======================================================

app.put(
    '/api/family/change-head',
    (req, res) => {

        const {

            householdId,
            newHeadId,
            reason,
            personId

        } = req.body;

        const verifySql = `

            SELECT
                h.household_id

            FROM households h

            JOIN landplots lp
                ON h.landplot_id =
                   lp.landplot_id

            JOIN indunas i
                ON lp.village_id =
                   i.village_id

            WHERE
                h.household_id = ?
                AND i.person_id = ?

        `;

        db.query(
            verifySql,
            [householdId, personId],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }

                if (
                    rows.length === 0
                ) {

                    return res.status(403).json({
                        error:
                        'Access denied.'
                    });

                }

                const currentHeadSql = `

                    SELECT resident_id

                    FROM residents

                    WHERE
                        household_id = ?
                        AND relationship_id = 1

                `;

                db.query(
                    currentHeadSql,
                    [householdId],
                    (err, headRows) => {

                        if (err) {

                            return res.status(500).json({
                                error: err.message
                            });

                        }

                        if (
                            headRows.length === 0
                        ) {

                            return res.status(404).json({
                                error:
                                'Current head not found.'
                            });

                        }

                        const currentHeadId =
                            headRows[0].resident_id;

                        db.beginTransaction(
                            err => {

                                if (err) {

                                    return res.status(500).json({
                                        error: err.message
                                    });

                                }

                                db.query(
                                    `
                                    UPDATE residents
                                    SET relationship_id = 2
                                    WHERE resident_id = ?
                                    `,
                                    [currentHeadId],
                                    (err) => {

                                        if (err) {

                                            return db.rollback(() => {

                                                res.status(500).json({
                                                    error: err.message
                                                });

                                            });

                                        }

                                        db.query(
                                            `
                                            UPDATE residents
                                            SET relationship_id = 1
                                            WHERE resident_id = ?
                                            `,
                                            [newHeadId],
                                            (err) => {

                                                if (err) {

                                                    return db.rollback(() => {

                                                        res.status(500).json({
                                                            error: err.message
                                                        });

                                                    });

                                                }

                                                db.commit(
                                                    err => {

                                                        if (err) {

                                                            return db.rollback(() => {

                                                                res.status(500).json({
                                                                    error: err.message
                                                                });

                                                            });

                                                        }

                                                        res.json({
                                                            success: true,
                                                            reason
                                                        });

                                                    }
                                                );

                                            }
                                        );

                                    }
                                );

                            }
                        );

                    }
                );

            }
        );

    }
);
// ======================================================
// LOAD VILLAGE ACTIVITIES
// ======================================================

app.get('/api/activity-reviews/:personId', (req, res) => {

    const personId = req.params.personId;

    console.log(
        'ACTIVITY ROUTE HIT:',
        personId
    );

    const sql = `

        SELECT

            va.activity_id,

            h.house_number,

            CONCAT(
                p.first_name,
                ' ',
                p.last_name
            ) AS full_name,

            at.display_label,

            va.activity_date,

            va.activity_status_id,

            ast.act_status_name

        FROM village_activities va

        INNER JOIN households h
            ON va.household_id =
               h.household_id

        INNER JOIN landplots lp
            ON h.landplot_id =
               lp.landplot_id

        INNER JOIN indunas i
            ON lp.village_id =
               i.village_id

        INNER JOIN persons p
            ON va.person_id =
               p.person_id

        INNER JOIN activity_types at
            ON va.activity_type_id =
               at.activity_type_id

        INNER JOIN activity_statuses ast
            ON va.activity_status_id =
               ast.activity_status_id

        WHERE i.person_id = ?

        ORDER BY
            va.date_logged DESC

    `;

    db.query(
        sql,
        [personId],
        (err, activities) => {

            if (err) {

                console.log(
                    'ACTIVITY LIST ERROR:',
                    err
                );

                return res.status(500).json({
                    error: err.message
                });

            }

            res.json({
                activities
            });

        }
    );

});


// ======================================================
// LOAD SINGLE ACTIVITY
// ======================================================

app.get(
    '/api/activity-review/:activityId/:personId',
    (req, res) => {

        const activityId =
            req.params.activityId;

        const personId =
            req.params.personId;

        const sql = `

            SELECT

                va.activity_id,

                h.house_number,

                CONCAT(
                    p.first_name,
                    ' ',
                    p.last_name
                ) AS full_name,

                at.display_label,

                va.activity_date,

                va.description,

                va.review_comment,

                va.activity_status_id,

                ast.act_status_name

            FROM village_activities va

            INNER JOIN households h
                ON va.household_id =
                   h.household_id

            INNER JOIN landplots lp
                ON h.landplot_id =
                   lp.landplot_id

            INNER JOIN indunas i
                ON lp.village_id =
                   i.village_id

            INNER JOIN persons p
                ON va.person_id =
                   p.person_id

            INNER JOIN activity_types at
                ON va.activity_type_id =
                   at.activity_type_id

            INNER JOIN activity_statuses ast
                ON va.activity_status_id =
                   ast.activity_status_id

            WHERE
                va.activity_id = ?
                AND i.person_id = ?

        `;

        db.query(
            sql,
            [activityId, personId],
            (err, rows) => {

                if (err) {

                    console.log(
                        'ACTIVITY DETAILS ERROR:',
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });

                }

                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({
                        error:
                        'Activity not found.'
                    });

                }

                res.json({
                    activity: rows[0]
                });

            }
        );

    }
);


// ======================================================
// UPDATE ACTIVITY REVIEW
// ======================================================

app.put(
    '/api/activity-review/update',
    (req, res) => {

        const {
            activityId,
            activityStatusId,
            reviewComment,
            personId
        } = req.body;

        if (
            (
                Number(activityStatusId) === 2 ||
                Number(activityStatusId) === 3
            )
            &&
            !reviewComment
        ) {

            return res.status(400).json({
                error:
                'Review comment is required.'
            });

        }

        const sql = `

            UPDATE village_activities

            SET

                activity_status_id = ?,

                review_comment = ?,

                review_date = NOW(),

                reviewed_by = ?

            WHERE activity_id = ?

        `;

        db.query(
            sql,
            [
                activityStatusId,
                reviewComment,
                personId,
                activityId
            ],
            (err) => {

                if (err) {

                    console.log(
                        'ACTIVITY UPDATE ERROR:',
                        err
                    );

                    return res.status(500).json({
                        error: err.message
                    });

                }

                res.json({

                    success: true,

                    message:
                        'Activity reviewed successfully.'

                });

            }
        );

    }
);

// ======================================================
// VILLAGE STATISTICS
// ======================================================

app.get('/api/statistics/:personId', (req, res) => {

    const personId =
        req.params.personId;

    const villageSql = `

        SELECT village_id

        FROM indunas

        WHERE person_id = ?

    `;

    db.query(
        villageSql,
        [personId],
        (err, villageRows) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }

            if (
                villageRows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        'Induna not found.'
                });

            }

            const villageId =
                villageRows[0].village_id;

            const summarySql = `

                SELECT

                    (
                        SELECT COUNT(*)

                        FROM residents r

                        JOIN households h
                            ON r.household_id =
                               h.household_id

                        JOIN landplots lp
                            ON h.landplot_id =
                               lp.landplot_id

                        WHERE
                            lp.village_id = ?

                    ) AS totalResidents,

                    (
                        SELECT COUNT(*)

                        FROM households h

                        JOIN landplots lp
                            ON h.landplot_id =
                               lp.landplot_id

                        WHERE
                            lp.village_id = ?

                    ) AS totalHouseholds,

                    (
                        SELECT COUNT(*)

                        FROM residents r

                        JOIN households h
                            ON r.household_id =
                               h.household_id

                        JOIN landplots lp
                            ON h.landplot_id =
                               lp.landplot_id

                        WHERE
                            lp.village_id = ?
                            AND r.rstatus_id = 41

                    ) AS totalRelocated,

                    (
                        SELECT COUNT(*)

                        FROM residents r

                        JOIN households h
                            ON r.household_id =
                               h.household_id

                        JOIN landplots lp
                            ON h.landplot_id =
                               lp.landplot_id

                        WHERE
                            lp.village_id = ?
                            AND r.rstatus_id = 21

                    ) AS totalDeceased,

                    (
                        SELECT COUNT(*)

                        FROM residents r

                        JOIN households h
                            ON r.household_id =
                               h.household_id

                        JOIN landplots lp
                            ON h.landplot_id =
                               lp.landplot_id

                        WHERE
                            lp.village_id = ?
                            AND r.rstatus_id = 21

                    ) AS totalFunerals,

                    (
                        SELECT COUNT(*)

                        FROM village_activities va

                        JOIN households h
                            ON va.household_id =
                               h.household_id

                        JOIN landplots lp
                            ON h.landplot_id =
                               lp.landplot_id

                        WHERE
                            lp.village_id = ?
                            AND va.activity_type_id = 1

                    ) AS totalMarriages

            `;

            db.query(
                summarySql,
                [
                    villageId,
                    villageId,
                    villageId,
                    villageId,
                    villageId,
                    villageId
                ],
                (err, summaryRows) => {

                    if (err) {

                        return res.status(500).json({
                            error: err.message
                        });

                    }

                    const summary =
                        summaryRows[0];

                    const genderSql = `

                        SELECT

                            g.gender_name AS gender,

                            COUNT(*) AS count

                        FROM residents r

                        JOIN persons p
                            ON r.person_id =
                               p.person_id

                        JOIN genders g
                            ON p.gender_id =
                               g.gender_id

                        JOIN households h
                            ON r.household_id =
                               h.household_id

                        JOIN landplots lp
                            ON h.landplot_id =
                               lp.landplot_id

                        WHERE
                            lp.village_id = ?

                        GROUP BY
                            g.gender_name

                    `;

                    db.query(
                        genderSql,
                        [villageId],
                        (err, genderStats) => {

                            if (err) {

                                return res.status(500).json({
                                    error: err.message
                                });

                            }

                            const ageSql = `

                                SELECT

                                    CASE

                                        WHEN
                                            TIMESTAMPDIFF(
                                                YEAR,
                                                p.date_of_birth,
                                                CURDATE()
                                            )
                                            BETWEEN 0 AND 17
                                        THEN '0-17'

                                        WHEN
                                            TIMESTAMPDIFF(
                                                YEAR,
                                                p.date_of_birth,
                                                CURDATE()
                                            )
                                            BETWEEN 18 AND 35
                                        THEN '18-35'

                                        WHEN
                                            TIMESTAMPDIFF(
                                                YEAR,
                                                p.date_of_birth,
                                                CURDATE()
                                            )
                                            BETWEEN 36 AND 59
                                        THEN '36-59'

                                        ELSE '60+'

                                    END AS age_group,

                                    COUNT(*) AS count

                                FROM residents r

                                JOIN persons p
                                    ON r.person_id =
                                       p.person_id

                                JOIN households h
                                    ON r.household_id =
                                       h.household_id

                                JOIN landplots lp
                                    ON h.landplot_id =
                                       lp.landplot_id

                                WHERE
                                    lp.village_id = ?

                                GROUP BY
                                    age_group

                            `;

                            db.query(
                                ageSql,
                                [villageId],
                                (err, ageStats) => {

                                    if (err) {

                                        return res.status(500).json({
                                            error:
                                                err.message
                                        });

                                    }

                                    res.json({

                                        totalResidents:
                                            summary.totalResidents,

                                        totalHouseholds:
                                            summary.totalHouseholds,

                                        totalRelocated:
                                            summary.totalRelocated,

                                        totalDeceased:
                                            summary.totalDeceased,

                                        totalFunerals:
                                            summary.totalFunerals,

                                        totalMarriages:
                                            summary.totalMarriages,

                                        genderStats,

                                        ageStats:
                                            ageStats.map(
                                                item => ({
                                                    group:
                                                        item.age_group,
                                                    count:
                                                        item.count
                                                })
                                            )

                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});
// ======================================================
// FORGOT PASSWORD - VERIFY ACCOUNT
// ======================================================

app.post(
    '/api/forgot-password/verify',
    (req, res) => {

        const {
            username,
            email
        } = req.body;

        const sql = `

            SELECT

                ua.account_id

            FROM user_accounts ua

            INNER JOIN persons p
                ON ua.person_id =
                   p.person_id

            WHERE

                ua.username = ?
                AND p.email_address = ?

        `;

        db.query(
            sql,
            [
                username,
                email
            ],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }

                if (
                    rows.length === 0
                ) {

                    return res.status(400).json({

                        verified: false,

                        error:
                            'Username and email do not match.'

                    });

                }

                res.json({

                    verified: true

                });

            }
        );

    }
);

// ======================================================
// FORGOT PASSWORD - RESET PASSWORD
// ======================================================

app.put(
    '/api/forgot-password/reset',
    (req, res) => {

        const {
            username,
            email,
            newPassword
        } = req.body;

        if (
            !username ||
            !email ||
            !newPassword
        ) {

            return res.status(400).json({
                error:
                    'All fields are required.'
            });

        }

        const verifySql = `

            SELECT

                ua.account_id

            FROM user_accounts ua

            INNER JOIN persons p
                ON ua.person_id =
                   p.person_id

            WHERE

                ua.username = ?
                AND p.email_address = ?

        `;

        db.query(
            verifySql,
            [
                username,
                email
            ],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        error: err.message
                    });

                }

                if (
                    rows.length === 0
                ) {

                    return res.status(400).json({
                        error:
                            'Username and email do not match.'
                    });

                }

                const updateSql = `

                    UPDATE user_accounts

                    SET

                        password_hash = ?

                    WHERE

                        username = ?

                `;

                db.query(
                    updateSql,
                    [
                        newPassword,
                        username
                    ],
                    (err, result) => {

                        if (err) {

                            return res.status(500).json({
                                error: err.message
                            });

                        }

                        if (
                            result.affectedRows === 0
                        ) {

                            return res.status(404).json({
                                error:
                                    'Account not found.'
                            });

                        }

                        res.json({

                            success: true,

                            message:
                                'Password reset successfully.'

                        });

                    }
                );

            }
        );

    }
);
// ======================================================
// GET PROFILE
// ======================================================

app.get('/api/profile/:personId', (req, res) => {

    const personId = req.params.personId;

    const sql = `

        SELECT

            p.person_id,
            p.first_name,
            p.last_name,
            p.id_number,
            p.contact,
            p.email_address,
            p.date_of_birth,

            ua.username,

            ar.role_name,

            i.traditional_name,

            COALESCE(
                v_induna.village_name,
                v_admin.village_name
            ) AS village_name

        FROM persons p

        INNER JOIN user_accounts ua
            ON p.person_id = ua.person_id

        INNER JOIN account_roles ar
            ON ua.role_id = ar.role_id

        LEFT JOIN indunas i
            ON p.person_id = i.person_id

        LEFT JOIN villages v_induna
            ON i.village_id = v_induna.village_id

        LEFT JOIN itadmins ita
            ON p.person_id = ita.person_id

        LEFT JOIN villages v_admin
            ON ita.village_id = v_admin.village_id

        WHERE p.person_id = ?

    `;

    db.query(
        sql,
        [personId],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: err.message
                });

            }

            if (results.length === 0) {

                return res.status(404).json({
                    error: 'Profile not found.'
                });

            }

            const profile =
                results[0];

            res.json({

                person_id:
                    profile.person_id,

                first_name:
                    profile.first_name,

                last_name:
                    profile.last_name,

                id_number:
                    profile.id_number,

                contact:
                    profile.contact,

                email_address:
                    profile.email_address,

                date_of_birth:
                    profile.date_of_birth,

                username:
                    profile.username,

                role_name:
                    profile.role_name,

                traditional_name:
                    profile.traditional_name,

                village_name:
                    profile.village_name

            });

        }

    );

});
// ======================================================
// UPDATE PROFILE
// ======================================================

app.put(
    '/api/profile/update',
    (req, res) => {

        const {

            personId,
            firstName,
            lastName,
            contact,
            emailAddress

        } = req.body;

        const sql = `

            UPDATE persons

            SET

                first_name = ?,
                last_name = ?,
                contact = ?,
                email_address = ?

            WHERE

                person_id = ?

        `;

        db.query(
            sql,
            [

                firstName,
                lastName,
                contact,
                emailAddress,
                personId

            ],
            (err) => {

                if (err) {

                    console.log(err);

                    return res.status(500).json({
                        error: err.message
                    });

                }

                res.json({

                    success: true,

                    message:
                        'Profile updated successfully.'

                });

            }
        );

    }
);
// ======================================================
// CHANGE PASSWORD
// ======================================================

app.put(
    '/api/profile/change-password',
    (req, res) => {

        const {

            personId,
            currentPassword,
            newPassword

        } = req.body;

        const verifySql = `

            SELECT

                password_hash

            FROM user_accounts

            WHERE

                person_id = ?

        `;

        db.query(
            verifySql,
            [personId],
            (err, rows) => {

                if (err) {

                    console.log(err);

                    return res.status(500).json({
                        error: err.message
                    });

                }

                if (rows.length === 0) {

                    return res.status(404).json({
                        error:
                            'Account not found.'
                    });

                }

                if (
                    rows[0].password_hash !==
                    currentPassword
                ) {

                    return res.status(400).json({
                        error:
                            'Current password is incorrect.'
                    });

                }

                const updateSql = `

                    UPDATE user_accounts

                    SET

                        password_hash = ?

                    WHERE

                        person_id = ?

                `;

                db.query(
                    updateSql,
                    [
                        newPassword,
                        personId
                    ],
                    (err) => {

                        if (err) {

                            console.log(err);

                            return res.status(500).json({
                                error: err.message
                            });

                        }

                        res.json({

                            success: true,

                            message:
                                'Password changed successfully.'

                        });

                    }
                );

            }
        );

    }
);
// ======================================================
// SERVER STATUS
// ======================================================

app.get('/api/status', (req, res) => {

    res.json({
        success: true,
        database: 'village_app_db',
        status: 'Running'
    });

});


// ======================================================
// SERVER START
// ======================================================

const PORT = 3000;

app.listen(
    PORT,
    '0.0.0.0',
    () => {

        console.log(
            `Server running at http://192.168.0.33:${PORT}`
        );

    }
);
