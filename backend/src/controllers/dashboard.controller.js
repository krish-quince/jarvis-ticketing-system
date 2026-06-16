import pool from "../config/db.js";

export const getSummary = async (req, res) => {
    try {
        const companyCode = req.user.companyCode;

        let query = `
            SELECT 
                COUNT(*)::int as "totalTickets",
                COUNT(CASE WHEN s.status_name = 'Open' THEN 1 END)::int as "openTickets",
                COUNT(CASE WHEN s.status_name = 'In Progress' THEN 1 END)::int as "inProgressTickets",
                COUNT(CASE WHEN s.status_name = 'Closed' THEN 1 END)::int as "closedTickets",
                COUNT(CASE WHEN p.priority_name = 'Critical' THEN 1 END)::int as "urgentTickets"
            FROM tickets t
            LEFT JOIN ticket_statuses s ON s.status_id = t.status_id
            LEFT JOIN ticket_priorities p ON p.priority_id = t.priority_id
            WHERE t.company_code = $1
        `;
        const params = [companyCode];

        if (req.user && Number(req.user.roleId) !== 1) {
            query += ` AND (t.assigned_to_user_code = $2 OR t.raised_by_user_code = $3 OR t.department_id = $4)`;
            params.push(req.user.userCode, req.user.userCode, req.user.departmentId);
        }

        const result = await pool.query(query, params);

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
