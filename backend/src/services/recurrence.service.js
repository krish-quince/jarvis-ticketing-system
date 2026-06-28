import pool from "../config/db.js";
import * as historyService from "./history.service.js";

// Helper to calculate the next run date
export const calculateNextRun = (recurrenceType, intervalValue, currentRun) => {
  const current = new Date(currentRun);
  const interval = Number(intervalValue) || 1;

  switch (recurrenceType) {
    case "ONCE":
      return null; // Runs only once
    case "DAILY": {
      const next = new Date(current);
      next.setDate(next.getDate() + interval);
      return next;
    }
    case "DAILY_WORKDAYS": {
      // Add interval days, skipping Saturdays (6) and Sundays (0)
      const next = new Date(current);
      for (let i = 0; i < interval; i++) {
        do {
          next.setDate(next.getDate() + 1);
        } while (next.getDay() === 0 || next.getDay() === 6);
      }
      return next;
    }
    case "WEEKLY": {
      const next = new Date(current);
      next.setDate(next.getDate() + 7 * interval);
      return next;
    }
    case "MONTHLY":
    case "MONTHLY_ON_DAY_X": {
      const next = new Date(current);
      next.setMonth(next.getMonth() + interval);
      return next;
    }
    case "YEARLY": {
      const next = new Date(current);
      next.setFullYear(next.getFullYear() + interval);
      return next;
    }
    default:
      return null;
  }
};

export const getRecurrence = async (ticketId, companyCode) => {
  // Verify ticket exists and belongs to company
  const ticketRes = await pool.query(
    "SELECT ticket_id FROM public.tickets WHERE ticket_id = $1 AND company_code = $2",
    [ticketId, companyCode]
  );
  if (ticketRes.rows.length === 0) {
    throw new Error("Ticket not found.");
  }

  const result = await pool.query(
    "SELECT * FROM public.ticket_recurrence WHERE ticket_id = $1 AND is_active = true",
    [ticketId]
  );
  return result.rows[0] || null;
};

export const createRecurrence = async (ticketId, data, user) => {
  // Verify ticket exists and belongs to company
  const ticketRes = await pool.query(
    "SELECT ticket_id FROM public.tickets WHERE ticket_id = $1 AND company_code = $2",
    [ticketId, user.companyCode]
  );
  if (ticketRes.rows.length === 0) {
    throw new Error("Ticket not found.");
  }

  // Check if an active recurrence already exists
  const existingRes = await pool.query(
    "SELECT recurrence_id FROM public.ticket_recurrence WHERE ticket_id = $1 AND is_active = true",
    [ticketId]
  );
  if (existingRes.rows.length > 0) {
    throw new Error("Only one active recurrence per ticket.");
  }

  const startDate = new Date(data.start_date);
  const nextRun = startDate; // First run is at the start date

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert recurrence configuration
    const result = await client.query(
      `
      INSERT INTO public.ticket_recurrence (
        ticket_id, recurrence_type, interval_value, start_date, next_run, 
        end_date, reopen_original, copy_assignee, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *
      `,
      [
        ticketId,
        data.recurrence_type,
        data.interval_value || 1,
        startDate,
        nextRun,
        data.end_date ? new Date(data.end_date) : null,
        data.reopen_original || false,
        data.copy_assignee || false
      ]
    );

    // Set is_recurring to true on ticket
    await client.query(
      "UPDATE public.tickets SET is_recurring = true WHERE ticket_id = $1",
      [ticketId]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const updateRecurrence = async (ticketId, data, user) => {
  // Verify ticket exists and belongs to company
  const ticketRes = await pool.query(
    "SELECT ticket_id FROM public.tickets WHERE ticket_id = $1 AND company_code = $2",
    [ticketId, user.companyCode]
  );
  if (ticketRes.rows.length === 0) {
    throw new Error("Ticket not found.");
  }

  const existingRes = await pool.query(
    "SELECT * FROM public.ticket_recurrence WHERE ticket_id = $1 AND is_active = true",
    [ticketId]
  );
  if (existingRes.rows.length === 0) {
    throw new Error("Recurrence configuration not found.");
  }

  const existingRec = existingRes.rows[0];
  const newStartDate = new Date(data.start_date);

  // If start_date changes, recalculate next_run
  let nextRun = existingRec.next_run;
  if (new Date(existingRec.start_date).getTime() !== newStartDate.getTime()) {
    nextRun = newStartDate;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE public.ticket_recurrence
      SET recurrence_type = $1,
          interval_value = $2,
          start_date = $3,
          next_run = $4,
          end_date = $5,
          reopen_original = $6,
          copy_assignee = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE ticket_id = $8 AND is_active = true
      RETURNING *
      `,
      [
        data.recurrence_type,
        data.interval_value || 1,
        newStartDate,
        nextRun,
        data.end_date ? new Date(data.end_date) : null,
        data.reopen_original || false,
        data.copy_assignee || false,
        ticketId
      ]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deleteRecurrence = async (ticketId, user) => {
  // Verify ticket exists and belongs to company
  const ticketRes = await pool.query(
    "SELECT ticket_id FROM public.tickets WHERE ticket_id = $1 AND company_code = $2",
    [ticketId, user.companyCode]
  );
  if (ticketRes.rows.length === 0) {
    throw new Error("Ticket not found.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Deactivate recurrence configuration
    await client.query(
      "UPDATE public.ticket_recurrence SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = $1",
      [ticketId]
    );

    // Set is_recurring to false on ticket
    await client.query(
      "UPDATE public.tickets SET is_recurring = false WHERE ticket_id = $1",
      [ticketId]
    );

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Scheduler Runner
export const runRecurringTicketsJob = async () => {
  // Get all active recurrence configurations whose next_run time is reached
  const activeRecsRes = await pool.query(
    `SELECT * FROM public.ticket_recurrence 
     WHERE is_active = true 
     AND next_run <= NOW()`
  );
  const activeRecs = activeRecsRes.rows;

  if (activeRecs.length === 0) {
    return;
  }

  console.log(`Processing ${activeRecs.length} recurring ticket configurations...`);

  for (const rec of activeRecs) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Load original ticket
      const ticketRes = await client.query(
        "SELECT * FROM public.tickets WHERE ticket_id = $1",
        [rec.ticket_id]
      );
      if (ticketRes.rows.length === 0) {
        // Ticket deleted, deactivate recurrence
        await client.query(
          "UPDATE public.ticket_recurrence SET is_active = false WHERE recurrence_id = $1",
          [rec.recurrence_id]
        );
        await client.query("COMMIT");
        continue;
      }

      const origTicket = ticketRes.rows[0];

      if (!rec.reopen_original) {
        // --- CREATE A NEW TICKET ---
        
        // Find default/New status ID for the company
        const statusRes = await client.query(
          `SELECT status_id FROM public.ticket_statuses 
           WHERE company_code = $1 AND is_default = true AND is_active = true 
           LIMIT 1`,
          [origTicket.company_code]
        );
        let targetStatusId = statusRes.rows[0]?.status_id;
        if (!targetStatusId) {
          // Fallback to first available status or 1
          const statusFallback = await client.query(
            "SELECT status_id FROM public.ticket_statuses WHERE company_code = $1 ORDER BY display_order ASC LIMIT 1",
            [origTicket.company_code]
          );
          targetStatusId = statusFallback.rows[0]?.status_id || 1;
        }

        // Determine assignee fields
        const assignedTo = rec.copy_assignee ? origTicket.assigned_to_user_code : null;
        const allocatedTo = rec.copy_assignee ? origTicket.allocated_to_user_code : null;

        // Insert new ticket
        const newTicketRes = await client.query(
          `
          INSERT INTO public.tickets (
            company_code, subject, description, category_id, subcategory_id, 
            priority_id, status_id, raised_by_user_code, department_id, 
            user_code, assigned_to_user_code, allocated_to_user_code, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
          RETURNING *
          `,
          [
            origTicket.company_code,
            origTicket.subject,
            origTicket.description,
            origTicket.category_id,
            origTicket.subcategory_id,
            origTicket.priority_id,
            targetStatusId,
            origTicket.raised_by_user_code,
            origTicket.department_id,
            origTicket.user_code,
            assignedTo,
            allocatedTo
          ]
        );
        const newTicket = newTicketRes.rows[0];

        // Copy Attachments
        await client.query(
          `
          INSERT INTO public.ticket_attachments (ticket_id, file_name, file_path, uploaded_by_user_code)
          SELECT $1, file_name, file_path, uploaded_by_user_code
          FROM public.ticket_attachments
          WHERE ticket_id = $2
          `,
          [newTicket.ticket_id, origTicket.ticket_id]
        );

        // Copy Tags
        await client.query(
          `
          INSERT INTO public.ticket_tags (ticket_id, tag_id)
          SELECT $1, tag_id
          FROM public.ticket_tags
          WHERE ticket_id = $2
          `,
          [newTicket.ticket_id, origTicket.ticket_id]
        );

        // Copy Freeform Tags
        await client.query(
          `
          INSERT INTO public.ticket_freeform_tags (ticket_id, company_code, tag_message, user_code)
          SELECT $1, company_code, tag_message, user_code
          FROM public.ticket_freeform_tags
          WHERE ticket_id = $2
          `,
          [newTicket.ticket_id, origTicket.ticket_id]
        );

        // Log creation in ticket history
        await historyService.createHistory(
          newTicket.ticket_id,
          "Created",
          "",
          "Ticket Created by Scheduler",
          "SYSTEM",
          client
        );

      } else {
        // --- REOPEN ORIGINAL TICKET ---
        
        // Find default or first non-closed status for company
        const inProgressRes = await client.query(
          `SELECT status_id FROM public.ticket_statuses 
           WHERE company_code = $1 AND LOWER(status_name) = 'in progress' AND is_active = true 
           LIMIT 1`,
          [origTicket.company_code]
        );
        
        let targetStatusId = null;
        if (inProgressRes.rows.length > 0) {
          targetStatusId = inProgressRes.rows[0].status_id;
        } else {
          const defaultRes = await client.query(
            `SELECT status_id FROM public.ticket_statuses 
             WHERE company_code = $1 AND is_default = true AND is_active = true 
             LIMIT 1`,
            [origTicket.company_code]
          );
          if (defaultRes.rows.length > 0) {
            targetStatusId = defaultRes.rows[0].status_id;
          } else {
            const fallbackRes = await client.query(
              `SELECT status_id FROM public.ticket_statuses 
               WHERE company_code = $1 AND is_closed_status = false AND is_active = true 
               ORDER BY display_order ASC 
               LIMIT 1`,
              [origTicket.company_code]
            );
            targetStatusId = fallbackRes.rows[0]?.status_id || origTicket.status_id;
          }
        }

        // Update original ticket
        await client.query(
          `
          UPDATE public.tickets
          SET status_id = $1,
              resolution_date = NULL,
              resolved_by_user_code = NULL,
              update_timestamp = NOW()
          WHERE ticket_id = $2
          `,
          [targetStatusId, origTicket.ticket_id]
        );

        // Log history of reopen
        await historyService.createHistory(
          origTicket.ticket_id,
          "Status",
          String(origTicket.status_id),
          String(targetStatusId),
          "SYSTEM",
          client
        );

        await historyService.createHistory(
          origTicket.ticket_id,
          "Reopened",
          "",
          "Ticket Reopened by Scheduler",
          "SYSTEM",
          client
        );
      }

      // --- CALCULATE NEXT RUN ---
      let nextRun = calculateNextRun(rec.recurrence_type, rec.interval_value, rec.next_run);
      let isActive = rec.is_active;

      // Check if past end date or if type was ONCE (runs only once)
      if (rec.recurrence_type === "ONCE") {
        isActive = false;
        nextRun = null;
      } else if (rec.end_date && nextRun) {
        const endDt = new Date(rec.end_date);
        if (nextRun.getTime() > endDt.getTime()) {
          isActive = false;
          nextRun = null;
        }
      }

      // Update recurrence schedule
      await client.query(
        `
        UPDATE public.ticket_recurrence
        SET next_run = $1,
            is_active = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE recurrence_id = $3
        `,
        [nextRun, isActive, rec.recurrence_id]
      );

      // If recurrence is deactivated, make sure tickets.is_recurring is also set to false
      if (!isActive) {
        await client.query(
          "UPDATE public.tickets SET is_recurring = false WHERE ticket_id = $1",
          [origTicket.ticket_id]
        );
      }

      await client.query("COMMIT");
      console.log(`Successfully processed recurrence_id: ${rec.recurrence_id} for ticket_id: ${rec.ticket_id}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Error processing recurrence_id: ${rec.recurrence_id}`, err);
    } finally {
      client.release();
    }
  }
};
