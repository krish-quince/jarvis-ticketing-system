import pool from "../config/db.js";

export const getSummary = async (req, res) => {
    try {
        const isSuperAdmin = req.user && Number(req.user.roleId) === 4;
        const targetCompanyCode = isSuperAdmin ? (req.query.companyCode || null) : req.user.companyCode;

        let query = `
            SELECT 
                COUNT(*)::int as "totalTickets",
                COUNT(CASE WHEN s.status_name = 'New' THEN 1 END)::int as "openTickets",
                COUNT(CASE WHEN s.status_name = 'In Progress' THEN 1 END)::int as "inProgressTickets",
                COUNT(CASE WHEN s.status_name = 'Closed' THEN 1 END)::int as "closedTickets",
                COUNT(CASE WHEN p.priority_name = 'Critical' THEN 1 END)::int as "urgentTickets"
            FROM tickets t
            LEFT JOIN ticket_statuses s ON s.status_id = t.status_id
            LEFT JOIN ticket_priorities p ON p.priority_id = t.priority_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        if (targetCompanyCode) {
            query += ` AND t.company_code = $${paramIndex}`;
            params.push(targetCompanyCode);
            paramIndex++;
        }

        const isStandardAdminOrSuper = req.user && (Number(req.user.roleId) === 1 || Number(req.user.roleId) === 4);

        if (!isStandardAdminOrSuper) {
            query += ` AND (t.assigned_to_user_code = $${paramIndex} OR t.raised_by_user_code = $${paramIndex + 1} OR t.department_id = $${paramIndex + 2})`;
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
