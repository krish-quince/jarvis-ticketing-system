ALTER TABLE public.ticket_categories
  ADD COLUMN IF NOT EXISTS company_code character varying(50);

UPDATE public.ticket_categories
SET company_code = 'QC'
WHERE company_code IS NULL;

ALTER TABLE public.ticket_categories
  ALTER COLUMN company_code SET NOT NULL;

ALTER TABLE public.ticket_priorities
  ADD COLUMN IF NOT EXISTS company_code character varying(50);

UPDATE public.ticket_priorities
SET company_code = 'QC'
WHERE company_code IS NULL;

ALTER TABLE public.ticket_priorities
  ALTER COLUMN company_code SET NOT NULL;

ALTER TABLE public.tags
  ADD COLUMN IF NOT EXISTS company_code character varying(50);

UPDATE public.tags
SET company_code = 'QC'
WHERE company_code IS NULL;

ALTER TABLE public.tags
  ALTER COLUMN company_code SET NOT NULL;

ALTER TABLE public.ticket_categories
  ADD CONSTRAINT fk_ticket_categories_company
  FOREIGN KEY (company_code) REFERENCES public.companies(company_code);

ALTER TABLE public.ticket_priorities
  ADD CONSTRAINT fk_ticket_priorities_company
  FOREIGN KEY (company_code) REFERENCES public.companies(company_code);

ALTER TABLE public.tags
  ADD CONSTRAINT fk_tags_company
  FOREIGN KEY (company_code) REFERENCES public.companies(company_code);

CREATE INDEX IF NOT EXISTS idx_ticket_categories_company
  ON public.ticket_categories(company_code);

CREATE INDEX IF NOT EXISTS idx_ticket_priorities_company
  ON public.ticket_priorities(company_code);

CREATE INDEX IF NOT EXISTS idx_tags_company
  ON public.tags(company_code);
