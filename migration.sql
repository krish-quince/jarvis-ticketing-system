BEGIN;

-- 1. ticket_categories
ALTER TABLE public.ticket_categories ADD COLUMN IF NOT EXISTS company_code character varying(50);
UPDATE public.ticket_categories SET company_code = 'QC' WHERE company_code IS NULL;
-- Alter column constraints and keys
ALTER TABLE public.ticket_categories ALTER COLUMN company_code SET NOT NULL;
ALTER TABLE ONLY public.ticket_categories DROP CONSTRAINT IF EXISTS fk_category_company;
ALTER TABLE ONLY public.ticket_categories
    ADD CONSTRAINT fk_category_company FOREIGN KEY (company_code) REFERENCES public.companies(company_code) ON DELETE CASCADE;

-- 2. ticket_subcategories
ALTER TABLE public.ticket_subcategories ADD COLUMN IF NOT EXISTS company_code character varying(50);
UPDATE public.ticket_subcategories SET company_code = 'QC' WHERE company_code IS NULL;
ALTER TABLE public.ticket_subcategories ALTER COLUMN company_code SET NOT NULL;
ALTER TABLE ONLY public.ticket_subcategories DROP CONSTRAINT IF EXISTS fk_subcategory_company;
ALTER TABLE ONLY public.ticket_subcategories
    ADD CONSTRAINT fk_subcategory_company FOREIGN KEY (company_code) REFERENCES public.companies(company_code) ON DELETE CASCADE;

-- 3. ticket_priorities
ALTER TABLE public.ticket_priorities ADD COLUMN IF NOT EXISTS company_code character varying(50);
UPDATE public.ticket_priorities SET company_code = 'QC' WHERE company_code IS NULL;
ALTER TABLE public.ticket_priorities ALTER COLUMN company_code SET NOT NULL;
ALTER TABLE ONLY public.ticket_priorities DROP CONSTRAINT IF EXISTS fk_priority_company;
ALTER TABLE ONLY public.ticket_priorities
    ADD CONSTRAINT fk_priority_company FOREIGN KEY (company_code) REFERENCES public.companies(company_code) ON DELETE CASCADE;

-- 4. ticket_statuses
ALTER TABLE public.ticket_statuses ADD COLUMN IF NOT EXISTS company_code character varying(50);
UPDATE public.ticket_statuses SET company_code = 'QC' WHERE company_code IS NULL;
ALTER TABLE public.ticket_statuses ALTER COLUMN company_code SET NOT NULL;
ALTER TABLE ONLY public.ticket_statuses DROP CONSTRAINT IF EXISTS fk_status_company;
ALTER TABLE ONLY public.ticket_statuses
    ADD CONSTRAINT fk_status_company FOREIGN KEY (company_code) REFERENCES public.companies(company_code) ON DELETE CASCADE;

-- 5. Duplicate master records for 'ATNG' (Alpha TNG)
DO $$
DECLARE
    r RECORD;
    c RECORD;
    new_cat_id bigint;
    old_cat_id bigint;
    sub_r RECORD;
BEGIN
    FOR c IN SELECT company_code FROM public.companies WHERE company_code <> 'QC' LOOP
        
        -- Duplicate categories and get new IDs
        FOR r IN SELECT * FROM public.ticket_categories WHERE company_code = 'QC' LOOP
            old_cat_id := r.category_id;
            
            -- Insert category and get new ID
            INSERT INTO public.ticket_categories (category_name, category_description, is_active, company_code)
            VALUES (r.category_name, r.category_description, r.is_active, c.company_code)
            RETURNING category_id INTO new_cat_id;
            
            -- Duplicate subcategories for this category
            FOR sub_r IN SELECT * FROM public.ticket_subcategories WHERE category_id = old_cat_id AND company_code = 'QC' LOOP
                INSERT INTO public.ticket_subcategories (category_id, subcategory_name, subcategory_description, assigned_user_code, is_active, company_code)
                VALUES (
                    new_cat_id, 
                    sub_r.subcategory_name, 
                    sub_r.subcategory_description, 
                    CASE 
                        WHEN c.company_code = 'ATNG' AND sub_r.assigned_user_code = 'SAL001' THEN 'AT_SAL001'
                        WHEN c.company_code = 'ATNG' AND sub_r.assigned_user_code = 'FIN001' THEN 'AT_FIN001'
                        WHEN c.company_code = 'ATNG' AND sub_r.assigned_user_code = 'IT001' THEN 'AT_IT001'
                        ELSE NULL 
                    END,
                    sub_r.is_active, 
                    c.company_code
                );
            END LOOP;
        END LOOP;
        
        -- Duplicate priorities
        INSERT INTO public.ticket_priorities (priority_name, priority_value, priority_color, is_active, company_code)
        SELECT priority_name, priority_value, priority_color, is_active, c.company_code
        FROM public.ticket_priorities
        WHERE company_code = 'QC';
        
        -- Duplicate statuses
        INSERT INTO public.ticket_statuses (status_name, status_color, display_order, is_default, is_closed_status, is_active, company_code)
        SELECT status_name, status_color, display_order, is_default, is_closed_status, is_active, c.company_code
        FROM public.ticket_statuses
        WHERE company_code = 'QC';
        
    END LOOP;
END;
$$;

COMMIT;
