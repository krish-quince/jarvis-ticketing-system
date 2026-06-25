BEGIN;

-- 1. Create a temp table to hold existing ticket data
CREATE TEMP TABLE temp_tickets AS SELECT * FROM public.tickets;

-- 2. Drop foreign key constraints on tables that reference tickets
ALTER TABLE ONLY public.ticket_attachments DROP CONSTRAINT IF EXISTS fk_attachment_ticket;
ALTER TABLE ONLY public.ticket_comments DROP CONSTRAINT IF EXISTS fk_comment_ticket;
ALTER TABLE ONLY public.ticket_history DROP CONSTRAINT IF EXISTS fk_history_ticket;
ALTER TABLE ONLY public.ticket_time_entries DROP CONSTRAINT IF EXISTS ticket_time_entries_ticket_id_fkey;

-- 3. Drop the tickets table (this also drops the owned sequence)
DROP TABLE IF EXISTS public.tickets CASCADE;

-- 4. Re-create the sequence
CREATE SEQUENCE IF NOT EXISTS public.tickets_ticket_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- 5. Re-create the tickets table with company_ticket_serial and ticket_no as a generated column
CREATE TABLE public.tickets (
    ticket_id bigint NOT NULL DEFAULT nextval('public.tickets_ticket_id_seq'::regclass),
    company_ticket_serial bigint,
    ticket_no character varying(30) GENERATED ALWAYS AS (company_code || '-' || (100000 + company_ticket_serial)::text) STORED,
    subject character varying(500) NOT NULL,
    description text,
    category_id bigint NOT NULL,
    priority_id bigint NOT NULL,
    status_id bigint NOT NULL,
    raised_by_user_code character varying(50) NOT NULL,
    assigned_to_user_code character varying(50),
    resolved_by_user_code character varying(50),
    due_date timestamp without time zone,
    resolution_date timestamp without time zone,
    is_recurring boolean DEFAULT false,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_code character varying(50),
    subcategory_id bigint,
    department_id bigint,
    company_code character varying(50) NOT NULL,
    allocated_to_user_code character varying(1000),
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Own the sequence
ALTER SEQUENCE public.tickets_ticket_id_seq OWNED BY public.tickets.ticket_id;

-- 7. Restore ownership
ALTER TABLE public.tickets OWNER TO postgres;
ALTER SEQUENCE public.tickets_ticket_id_seq OWNER TO postgres;

-- 8. Add Primary Key and Unique Constraints
ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (ticket_id);

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_no_key UNIQUE (ticket_no);

-- 9. Create Trigger function and Trigger to assign company_ticket_serial
CREATE OR REPLACE FUNCTION set_company_ticket_serial()
RETURNS TRIGGER AS $$
DECLARE
  next_serial bigint;
BEGIN
  IF NEW.company_ticket_serial IS NULL THEN
    -- Lock based on company code hash to prevent concurrent duplicates
    PERFORM pg_advisory_xact_lock(hashtext(NEW.company_code));
    
    SELECT COALESCE(MAX(company_ticket_serial), 0) + 1
    INTO next_serial
    FROM public.tickets
    WHERE company_code = NEW.company_code;
    
    NEW.company_ticket_serial := next_serial;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_company_seq_trigger
    BEFORE INSERT ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_company_ticket_serial();

-- 10. Restore the data from the temp table calculating company_ticket_serial
INSERT INTO public.tickets (
    ticket_id, company_ticket_serial, subject, description, category_id, priority_id, status_id,
    raised_by_user_code, assigned_to_user_code, resolved_by_user_code,
    due_date, resolution_date, is_recurring, update_timestamp, user_code,
    subcategory_id, department_id, company_code, allocated_to_user_code, created_at
)
SELECT 
    ticket_id, 
    ROW_NUMBER() OVER (PARTITION BY company_code ORDER BY ticket_id) AS company_ticket_serial,
    subject, description, category_id, priority_id, status_id,
    raised_by_user_code, assigned_to_user_code, resolved_by_user_code,
    due_date, resolution_date, is_recurring, update_timestamp, user_code,
    subcategory_id, department_id, company_code, allocated_to_user_code, created_at
FROM temp_tickets;

-- 11. Restore the sequence to its correct state
SELECT pg_catalog.setval('public.tickets_ticket_id_seq', COALESCE((SELECT MAX(ticket_id) FROM public.tickets), 1), true);

-- 12. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_ticket_no ON public.tickets USING btree (ticket_no);
CREATE INDEX IF NOT EXISTS idx_ticket_subject ON public.tickets USING btree (subject);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON public.tickets USING btree (assigned_to_user_code);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets USING btree (priority_id);
CREATE INDEX IF NOT EXISTS idx_tickets_raised ON public.tickets USING btree (raised_by_user_code);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets USING btree (status_id);

-- 13. Recreate foreign keys from tickets to other tables
ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_ticket_category FOREIGN KEY (category_id) REFERENCES public.ticket_categories(category_id);
ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_ticket_priority FOREIGN KEY (priority_id) REFERENCES public.ticket_priorities(priority_id);
ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_ticket_status FOREIGN KEY (status_id) REFERENCES public.ticket_statuses(status_id);
ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_ticket_subcategory FOREIGN KEY (subcategory_id) REFERENCES public.ticket_subcategories(subcategory_id);
ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_department FOREIGN KEY (department_id) REFERENCES public.departments(department_id);

-- 14. Recreate foreign keys from other tables to tickets
ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT fk_attachment_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id);
ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT fk_comment_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id);
ALTER TABLE ONLY public.ticket_history
    ADD CONSTRAINT fk_history_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id);
ALTER TABLE ONLY public.ticket_time_entries
    ADD CONSTRAINT ticket_time_entries_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id) ON DELETE CASCADE;

COMMIT;
