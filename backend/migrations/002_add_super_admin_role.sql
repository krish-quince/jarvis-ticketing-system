INSERT INTO public.roles (role_id, role_name, description, is_active, update_timestamp)
VALUES (4, 'Super Admin', 'Multi-company system administrator', true, CURRENT_TIMESTAMP)
ON CONFLICT (role_id) DO UPDATE
SET role_name = EXCLUDED.role_name,
    description = EXCLUDED.description,
    is_active = true,
    update_timestamp = CURRENT_TIMESTAMP;

SELECT setval(
  'public.roles_role_id_seq',
  GREATEST(
    COALESCE((SELECT MAX(role_id) FROM public.roles), 0) + 1,
    COALESCE((SELECT last_value FROM public.roles_role_id_seq), 1)
  ),
  false
);
