import pool from "./db.js";

export const initializeDatabase = async () => {
  console.log("Initializing database schema...");
  const client = await pool.connect();
  try {
    // 1. Ensure is_recurring exists on tickets
    await client.query(`
      ALTER TABLE public.tickets 
      ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
    `);

    // 1.b. Ensure created_by_user_code and ticket_source exist on tickets
    await client.query(`
      ALTER TABLE public.tickets 
      ADD COLUMN IF NOT EXISTS created_by_user_code VARCHAR(50) DEFAULT null;
    `);
    await client.query(`
      ALTER TABLE public.tickets 
      ADD COLUMN IF NOT EXISTS ticket_source VARCHAR(30) DEFAULT 'WebApp';
    `);

    // 2. Create ticket_recurrence table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.ticket_recurrence (
          recurrence_id BIGSERIAL PRIMARY KEY,
          ticket_id BIGINT NOT NULL,
          recurrence_type VARCHAR(30) NOT NULL,
          interval_value INT DEFAULT 1,
          start_date TIMESTAMP NOT NULL,
          next_run TIMESTAMP NOT NULL,
          end_date TIMESTAMP NULL,
          reopen_original BOOLEAN DEFAULT FALSE,
          copy_assignee BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_recurrence_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id) ON DELETE CASCADE
      );
    `);

    // 3. Create user_column_preferences table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_column_preferences (
          preference_id BIGSERIAL PRIMARY KEY,
          user_code VARCHAR(50) NOT NULL,
          page_name VARCHAR(100) NOT NULL,
          column_key VARCHAR(100) NOT NULL,
          is_visible BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_user_page_column UNIQUE (user_code, page_name, column_key)
      );
    `);

    console.log("Database schema initialized successfully.");
  } catch (error) {
    console.error("Error initializing database schema:", error);
    throw error;
  } finally {
    client.release();
  }
};
