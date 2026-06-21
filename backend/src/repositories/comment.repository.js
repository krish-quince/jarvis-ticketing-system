import pool from "../config/db.js";

export const createComment = async (
    ticketId,
    userCode,
    commentText
) => {
    const result = await pool.query(
        `
        INSERT INTO ticket_comments
        (
            ticket_id,
            commented_by_user_code,
            comment_text
        )
        VALUES($1,$2,$3)
        RETURNING *
        `,
        [ticketId, userCode, commentText]
    );

    return result.rows[0];
};

const ensureCommentAttachmentsTable = async (database = pool) => {
    await database.query(`
        CREATE TABLE IF NOT EXISTS comment_attachments (
            attachment_id BIGSERIAL PRIMARY KEY,
            comment_id BIGINT NOT NULL REFERENCES ticket_comments(comment_id) ON DELETE CASCADE,
            file_name VARCHAR(255) NOT NULL,
            stored_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(150),
            file_size BIGINT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await database.query(`
        CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment
        ON comment_attachments (comment_id)
    `);
};

export const createCommentWithAttachments = async (
    ticketId,
    userCode,
    commentText,
    files,
) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        await ensureCommentAttachmentsTable(client);

        const commentResult = await client.query(
            `
            INSERT INTO ticket_comments
            (
                ticket_id,
                commented_by_user_code,
                comment_text
            )
            VALUES($1,$2,$3)
            RETURNING *
            `,
            [ticketId, userCode, commentText],
        );
        const comment = commentResult.rows[0];

        const attachments = [];
        for (const file of files) {
            const attachmentResult = await client.query(
                `
                INSERT INTO comment_attachments
                    (comment_id, file_name, stored_name, mime_type, file_size)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
                `,
                [
                    comment.comment_id,
                    file.originalname,
                    file.filename,
                    file.mimetype,
                    file.size,
                ],
            );
            attachments.push(attachmentResult.rows[0]);
        }

        await client.query("COMMIT");
        return { ...comment, attachments };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const getCommentsByTicketId = async (
    ticketId,
    companyCode
) => {
    await ensureCommentAttachmentsTable();

    const result = await pool.query(
        `
        SELECT
            tc.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'attachment_id', ca.attachment_id,
                        'file_name', ca.file_name,
                        'mime_type', ca.mime_type,
                        'file_size', ca.file_size,
                        'url', '/uploads/comments/' || ca.stored_name
                    )
                ) FILTER (WHERE ca.attachment_id IS NOT NULL),
                '[]'::json
            ) AS attachments
        FROM ticket_comments tc
        INNER JOIN tickets t
            ON t.ticket_id = tc.ticket_id
        LEFT JOIN comment_attachments ca
            ON ca.comment_id = tc.comment_id
        WHERE tc.ticket_id = $1
        AND t.company_code = $2
        GROUP BY tc.comment_id
        ORDER BY tc.created_at ASC
        `,
        [ticketId, companyCode]
    );

    return result.rows;
};

export const getTicketById = async (
    ticketId,
    companyCode
) => {
    const result = await pool.query(
        `
        SELECT
            ticket_id,
            assigned_to_user_code,
            raised_by_user_code,
            department_id
        FROM tickets
        WHERE ticket_id = $1
        AND company_code = $2
        `,
        [ticketId, companyCode]
    );

    return result.rows[0];
};
