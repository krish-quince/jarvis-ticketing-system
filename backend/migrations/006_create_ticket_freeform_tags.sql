-- Freeform ticket tags: any user can type any text to tag a ticket.
-- No admin catalog required. Tags are tied to a specific ticket and user.

BEGIN;

CREATE TABLE IF NOT EXISTS public.ticket_freeform_tags (
  id              bigserial PRIMARY KEY,
  ticket_id       bigint NOT NULL REFERENCES public.tickets(ticket_id) ON DELETE CASCADE,
  company_code    character varying(50) NOT NULL,
  tag_message     character varying(100) NOT NULL,
  user_code       character varying(200) NOT NULL,
  created_at      timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_freeform_tags_ticket
  ON public.ticket_freeform_tags (ticket_id);

CREATE INDEX IF NOT EXISTS idx_freeform_tags_company
  ON public.ticket_freeform_tags (company_code);

CREATE INDEX IF NOT EXISTS idx_freeform_tags_message
  ON public.ticket_freeform_tags (company_code, LOWER(tag_message));

COMMIT;
