BEGIN;

CREATE TABLE IF NOT EXISTS public.ticket_tags (
    ticket_id bigint NOT NULL,
    tag_id bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_ticket_tags PRIMARY KEY (ticket_id, tag_id),
    CONSTRAINT fk_ticket_tags_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES public.tickets(ticket_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_ticket_tags_tag
        FOREIGN KEY (tag_id)
        REFERENCES public.tags(tag_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticket_tags_tag
    ON public.ticket_tags (tag_id);

CREATE INDEX IF NOT EXISTS idx_ticket_tags_ticket
    ON public.ticket_tags (ticket_id);

-- Case-insensitive uniqueness per company so "Bug" and "bug" can't both exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_unique_name_per_company
    ON public.tags (company_code, LOWER(tag_name));

COMMIT;
