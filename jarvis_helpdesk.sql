--
-- PostgreSQL database dump
--

\restrict 9TI2MvT74zcjvhbXlYxuw2R9TBzhLbdigMMblPNJyaK1ztNA1hPzTfMDNuFZT4P

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-06-15 10:48:27

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 16851)
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    company_id bigint NOT NULL,
    company_name character varying(255) NOT NULL,
    company_code character varying(50) NOT NULL,
    email character varying(255),
    phone character varying(20),
    address text,
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_code character varying(50)
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16861)
-- Name: companies_company_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companies_company_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_company_id_seq OWNER TO postgres;

--
-- TOC entry 5171 (class 0 OID 0)
-- Dependencies: 220
-- Name: companies_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_company_id_seq OWNED BY public.companies.company_id;


--
-- TOC entry 221 (class 1259 OID 16862)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id bigint NOT NULL,
    role_name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_code character varying(50)
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16871)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- TOC entry 5172 (class 0 OID 0)
-- Dependencies: 222
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 223 (class 1259 OID 16872)
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    tag_id bigint NOT NULL,
    company_id bigint NOT NULL,
    tag_name character varying(100) NOT NULL,
    tag_color character varying(20),
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_code character varying(50)
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16880)
-- Name: tags_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tags_tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_tag_id_seq OWNER TO postgres;

--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 224
-- Name: tags_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tags_tag_id_seq OWNED BY public.tags.tag_id;


--
-- TOC entry 225 (class 1259 OID 16881)
-- Name: ticket_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_attachments (
    attachment_id bigint NOT NULL,
    ticket_id bigint NOT NULL,
    file_name character varying(255),
    file_path text,
    uploaded_by_user_code character varying(50),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ticket_attachments OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16889)
-- Name: ticket_attachments_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_attachments_attachment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_attachments_attachment_id_seq OWNER TO postgres;

--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 226
-- Name: ticket_attachments_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_attachments_attachment_id_seq OWNED BY public.ticket_attachments.attachment_id;


--
-- TOC entry 227 (class 1259 OID 16890)
-- Name: ticket_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_categories (
    category_id bigint NOT NULL,
    company_id bigint NOT NULL,
    category_name character varying(100) NOT NULL,
    category_description text,
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_code character varying(50)
);


ALTER TABLE public.ticket_categories OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16900)
-- Name: ticket_categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_categories_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_categories_category_id_seq OWNER TO postgres;

--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 228
-- Name: ticket_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_categories_category_id_seq OWNED BY public.ticket_categories.category_id;


--
-- TOC entry 229 (class 1259 OID 16901)
-- Name: ticket_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_comments (
    comment_id bigint NOT NULL,
    ticket_id bigint NOT NULL,
    commented_by_user_code character varying(50) NOT NULL,
    comment_text text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ticket_comments OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16911)
-- Name: ticket_comments_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_comments_comment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_comments_comment_id_seq OWNER TO postgres;

--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 230
-- Name: ticket_comments_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_comments_comment_id_seq OWNED BY public.ticket_comments.comment_id;


--
-- TOC entry 231 (class 1259 OID 16912)
-- Name: ticket_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_history (
    history_id bigint NOT NULL,
    ticket_id bigint NOT NULL,
    field_changed character varying(100),
    old_value text,
    new_value text,
    changed_by_user_code character varying(50),
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ticket_history OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16920)
-- Name: ticket_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_history_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_history_history_id_seq OWNER TO postgres;

--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 232
-- Name: ticket_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_history_history_id_seq OWNED BY public.ticket_history.history_id;


--
-- TOC entry 233 (class 1259 OID 16921)
-- Name: ticket_priorities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_priorities (
    priority_id bigint NOT NULL,
    company_id bigint NOT NULL,
    priority_name character varying(50) NOT NULL,
    priority_value integer NOT NULL,
    priority_color character varying(20),
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_code character varying(50)
);


ALTER TABLE public.ticket_priorities OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16930)
-- Name: ticket_priorities_priority_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_priorities_priority_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_priorities_priority_id_seq OWNER TO postgres;

--
-- TOC entry 5178 (class 0 OID 0)
-- Dependencies: 234
-- Name: ticket_priorities_priority_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_priorities_priority_id_seq OWNED BY public.ticket_priorities.priority_id;


--
-- TOC entry 235 (class 1259 OID 16931)
-- Name: ticket_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_statuses (
    status_id bigint NOT NULL,
    company_id bigint NOT NULL,
    status_name character varying(100) NOT NULL,
    status_color character varying(20),
    display_order integer DEFAULT 1,
    is_default boolean DEFAULT false,
    is_closed_status boolean DEFAULT false,
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_code character varying(50)
);


ALTER TABLE public.ticket_statuses OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16942)
-- Name: ticket_statuses_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_statuses_status_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_statuses_status_id_seq OWNER TO postgres;

--
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 236
-- Name: ticket_statuses_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_statuses_status_id_seq OWNED BY public.ticket_statuses.status_id;


--
-- TOC entry 237 (class 1259 OID 16943)
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    ticket_id bigint NOT NULL,
    company_id bigint NOT NULL,
    ticket_no character varying(30) NOT NULL,
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
    department character varying(100) DEFAULT 'General'::character varying
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16959)
-- Name: tickets_ticket_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tickets_ticket_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_ticket_id_seq OWNER TO postgres;

--
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 238
-- Name: tickets_ticket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tickets_ticket_id_seq OWNED BY public.tickets.ticket_id;


--
-- TOC entry 239 (class 1259 OID 16960)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_serial_no bigint NOT NULL,
    company_id bigint NOT NULL,
    role_id bigint NOT NULL,
    user_code character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    phone character varying(20),
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    department character varying(100) DEFAULT 'General'::character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16975)
-- Name: users_user_serial_no_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_serial_no_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_serial_no_seq OWNER TO postgres;

--
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 240
-- Name: users_user_serial_no_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_serial_no_seq OWNED BY public.users.user_serial_no;


--
-- TOC entry 4906 (class 2604 OID 16976)
-- Name: companies company_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies ALTER COLUMN company_id SET DEFAULT nextval('public.companies_company_id_seq'::regclass);


--
-- TOC entry 4909 (class 2604 OID 16977)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 16978)
-- Name: tags tag_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags ALTER COLUMN tag_id SET DEFAULT nextval('public.tags_tag_id_seq'::regclass);


--
-- TOC entry 4915 (class 2604 OID 16979)
-- Name: ticket_attachments attachment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments ALTER COLUMN attachment_id SET DEFAULT nextval('public.ticket_attachments_attachment_id_seq'::regclass);


--
-- TOC entry 4917 (class 2604 OID 16980)
-- Name: ticket_categories category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_categories ALTER COLUMN category_id SET DEFAULT nextval('public.ticket_categories_category_id_seq'::regclass);


--
-- TOC entry 4920 (class 2604 OID 16981)
-- Name: ticket_comments comment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments ALTER COLUMN comment_id SET DEFAULT nextval('public.ticket_comments_comment_id_seq'::regclass);


--
-- TOC entry 4922 (class 2604 OID 16982)
-- Name: ticket_history history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_history ALTER COLUMN history_id SET DEFAULT nextval('public.ticket_history_history_id_seq'::regclass);


--
-- TOC entry 4924 (class 2604 OID 16983)
-- Name: ticket_priorities priority_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_priorities ALTER COLUMN priority_id SET DEFAULT nextval('public.ticket_priorities_priority_id_seq'::regclass);


--
-- TOC entry 4927 (class 2604 OID 16984)
-- Name: ticket_statuses status_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_statuses ALTER COLUMN status_id SET DEFAULT nextval('public.ticket_statuses_status_id_seq'::regclass);


--
-- TOC entry 4933 (class 2604 OID 16985)
-- Name: tickets ticket_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets ALTER COLUMN ticket_id SET DEFAULT nextval('public.tickets_ticket_id_seq'::regclass);


--
-- TOC entry 4937 (class 2604 OID 16986)
-- Name: users user_serial_no; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_serial_no SET DEFAULT nextval('public.users_user_serial_no_seq'::regclass);


--
-- TOC entry 5144 (class 0 OID 16851)
-- Dependencies: 219
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (company_id, company_name, company_code, email, phone, address, is_active, update_timestamp, user_code) FROM stdin;
1	Quince Capital	QUINCE	admin@quincecapital.com	+919999999991	Pune, Maharashtra, India	t	2026-06-12 16:14:02.742942	SYSTEM
2	Alpha TND	ALPHATND	admin@alphatnD.com	+919999999992	Mumbai, Maharashtra, India	t	2026-06-12 16:14:02.742942	SYSTEM
\.


--
-- TOC entry 5146 (class 0 OID 16862)
-- Dependencies: 221
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, role_name, description, is_active, update_timestamp, user_code) FROM stdin;
1	Admin	Full system access	t	2026-06-12 16:14:02.742942	SYSTEM
2	Manager	Manage tickets and users	t	2026-06-12 16:14:02.742942	SYSTEM
3	Developer	Work on assigned tickets	t	2026-06-12 16:14:02.742942	SYSTEM
4	Customer	Raise tickets	t	2026-06-12 16:14:02.742942	SYSTEM
5	Viewer	Read only access	t	2026-06-12 16:14:02.742942	SYSTEM
\.


--
-- TOC entry 5148 (class 0 OID 16872)
-- Dependencies: 223
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (tag_id, company_id, tag_name, tag_color, is_active, update_timestamp, user_code) FROM stdin;
1	1	Frontend	#0DCAF0	t	2026-06-12 16:14:02.742942	SYSTEM
2	1	Backend	#6610F2	t	2026-06-12 16:14:02.742942	SYSTEM
3	1	Database	#198754	t	2026-06-12 16:14:02.742942	SYSTEM
4	1	API	#FD7E14	t	2026-06-12 16:14:02.742942	SYSTEM
5	1	Urgent	#DC3545	t	2026-06-12 16:14:02.742942	SYSTEM
6	2	Frontend	#0DCAF0	t	2026-06-12 16:14:02.742942	SYSTEM
7	2	Backend	#6610F2	t	2026-06-12 16:14:02.742942	SYSTEM
8	2	Database	#198754	t	2026-06-12 16:14:02.742942	SYSTEM
9	2	API	#FD7E14	t	2026-06-12 16:14:02.742942	SYSTEM
10	2	Urgent	#DC3545	t	2026-06-12 16:14:02.742942	SYSTEM
\.


--
-- TOC entry 5150 (class 0 OID 16881)
-- Dependencies: 225
-- Data for Name: ticket_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_attachments (attachment_id, ticket_id, file_name, file_path, uploaded_by_user_code, uploaded_at) FROM stdin;
\.


--
-- TOC entry 5152 (class 0 OID 16890)
-- Dependencies: 227
-- Data for Name: ticket_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_categories (category_id, company_id, category_name, category_description, is_active, update_timestamp, user_code) FROM stdin;
5	2	Bug	Application defects	t	2026-06-12 16:14:02.742942	SYSTEM
6	2	Feature Request	New feature request	t	2026-06-12 16:14:02.742942	SYSTEM
7	2	Support	General support request	t	2026-06-12 16:14:02.742942	SYSTEM
8	2	Enhancement	Improve existing functionality	t	2026-06-12 16:14:02.742942	SYSTEM
9	1	General Issues	General client issues and queries	t	2026-06-12 17:16:56.935714	SYSTEM
10	1	Technical	Technical system challenges	t	2026-06-12 17:16:56.935714	SYSTEM
11	1	Bug reports	Defects and bug reports	t	2026-06-12 17:16:56.935714	SYSTEM
\.


--
-- TOC entry 5154 (class 0 OID 16901)
-- Dependencies: 229
-- Data for Name: ticket_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_comments (comment_id, ticket_id, commented_by_user_code, comment_text, created_at) FROM stdin;
\.


--
-- TOC entry 5156 (class 0 OID 16912)
-- Dependencies: 231
-- Data for Name: ticket_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_history (history_id, ticket_id, field_changed, old_value, new_value, changed_by_user_code, changed_at) FROM stdin;
\.


--
-- TOC entry 5158 (class 0 OID 16921)
-- Dependencies: 233
-- Data for Name: ticket_priorities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_priorities (priority_id, company_id, priority_name, priority_value, priority_color, is_active, update_timestamp, user_code) FROM stdin;
1	1	Low	1	#28A745	t	2026-06-12 16:14:02.742942	SYSTEM
2	1	Medium	2	#FFC107	t	2026-06-12 16:14:02.742942	SYSTEM
3	1	High	3	#FD7E14	t	2026-06-12 16:14:02.742942	SYSTEM
4	1	Critical	4	#DC3545	t	2026-06-12 16:14:02.742942	SYSTEM
5	2	Low	1	#28A745	t	2026-06-12 16:14:02.742942	SYSTEM
6	2	Medium	2	#FFC107	t	2026-06-12 16:14:02.742942	SYSTEM
7	2	High	3	#FD7E14	t	2026-06-12 16:14:02.742942	SYSTEM
8	2	Critical	4	#DC3545	t	2026-06-12 16:14:02.742942	SYSTEM
\.


--
-- TOC entry 5160 (class 0 OID 16931)
-- Dependencies: 235
-- Data for Name: ticket_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_statuses (status_id, company_id, status_name, status_color, display_order, is_default, is_closed_status, is_active, update_timestamp, user_code) FROM stdin;
1	1	Open	#0D6EFD	1	t	f	t	2026-06-12 16:14:02.742942	SYSTEM
2	1	In Progress	#FFC107	2	f	f	t	2026-06-12 16:14:02.742942	SYSTEM
3	1	Testing	#6F42C1	3	f	f	t	2026-06-12 16:14:02.742942	SYSTEM
4	1	Resolved	#198754	4	f	f	t	2026-06-12 16:14:02.742942	SYSTEM
5	1	Closed	#6C757D	5	f	t	t	2026-06-12 16:14:02.742942	SYSTEM
6	2	Open	#0D6EFD	1	t	f	t	2026-06-12 16:14:02.742942	SYSTEM
7	2	In Progress	#FFC107	2	f	f	t	2026-06-12 16:14:02.742942	SYSTEM
8	2	Testing	#6F42C1	3	f	f	t	2026-06-12 16:14:02.742942	SYSTEM
9	2	Resolved	#198754	4	f	f	t	2026-06-12 16:14:02.742942	SYSTEM
10	2	Closed	#6C757D	5	f	t	t	2026-06-12 16:14:02.742942	SYSTEM
\.


--
-- TOC entry 5162 (class 0 OID 16943)
-- Dependencies: 237
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (ticket_id, company_id, ticket_no, subject, description, category_id, priority_id, status_id, raised_by_user_code, assigned_to_user_code, resolved_by_user_code, due_date, resolution_date, is_recurring, update_timestamp, user_code, department) FROM stdin;
8	1	TK-1004	Standardize password resets	Allow password change request via secure email tokens.	9	1	5	QC_CUST01	QC_DEV01	\N	2026-06-11 17:16:56.944	2026-06-12 17:16:56.944	f	2026-06-12 17:16:56.953336	SYSTEM	Finance
9	1	TK-1005	API Gateway timeout on bulk requests	Requests to fetch broker portfolio records fail after 30 seconds.	10	4	1	QC_CUST03	QC_DEV03	\N	2026-06-14 17:46:18.97588	\N	f	2026-06-12 17:46:18.97588	\N	Finance
11	1	TK-1007	Billing PDF invoice displays incorrect total	Calculated tax is added twice in the final breakdown.	9	3	3	QC_CUST02	QC_DEV01	\N	2026-06-13 17:46:18.97588	\N	f	2026-06-12 17:46:18.97588	\N	Finance
6	1	TK-1002	Implement dark mode toggle	Add a Dark Mode toggle to the dashboard theme provider to allow night view for developer efficiency.	10	2	2	QC_ADMIN	QC_DEV02	\N	2026-06-22 17:16:56.944	\N	f	2026-06-12 17:16:56.950081	SYSTEM	IT
12	1	TK-1008	LDAP User authentication synchronization	Synchronize new AD users every 4 hours instead of 24.	10	2	4	QC_CUST03	QC_DEV05	\N	2026-06-15 17:46:18.97588	\N	f	2026-06-12 17:46:18.97588	\N	IT
15	1	TK-1011	VPN connection drop issues for remote employees	Remote devs disconnected hourly due to security timeout configs.	10	4	2	QC_CUST03	QC_DEV05	\N	2026-06-13 05:46:18.97588	\N	f	2026-06-12 17:46:18.97588	\N	IT
7	1	TK-1003	Database connection pool leakage check	Audit pg client queries to ensure pool releases are executed properly under error responses.	11	4	1	QC_MANAGER	QC_ADMIN	\N	2026-06-14 17:16:56.944	\N	f	2026-06-12 17:16:56.951787	SYSTEM	Support
14	1	TK-1010	Request to update support phone number in email signature	Change phone number extension from 402 to 505.	9	1	5	QC_CUST02	QC_DEV01	\N	2026-06-10 17:46:18.97588	\N	f	2026-06-12 17:46:18.97588	\N	Support
10	1	TK-1006	UI misalignment on ticket details screen	The assignee select box goes out of bounds on mobile width.	11	1	2	QC_CUST04	QC_DEV04	\N	2026-06-19 17:46:18.97588	\N	f	2026-06-12 17:46:18.97588	\N	HR
13	1	TK-1009	Application crash when uploading 50MB logs	Out of memory error in node runtime when parsing large log files.	11	3	1	QC_CUST04	QC_DEV04	\N	2026-06-16 17:46:18.97588	\N	f	2026-06-12 17:46:18.97588	\N	Sales
5	1	TK-1001	Login flow is slow on mobile devices	When testing on mobile viewport, the LoginCard takes ~3 seconds to render because of unnecessary asset pre-rendering.	11	3	1	QC_CUST01	QC_DEV01	\N	2026-06-17 17:16:56.944	\N	f	2026-06-12 17:16:56.948211	SYSTEM	Marketing
16	1	TKT-1781454316123	Codex verification ticket	Created during frontend routing verification.	9	2	1	QA-CODEX-001	\N	\N	\N	\N	f	2026-06-14 21:55:16.187809	\N	QA
\.


--
-- TOC entry 5164 (class 0 OID 16960)
-- Dependencies: 239
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_serial_no, company_id, role_id, user_code, first_name, last_name, email, password_hash, phone, is_active, update_timestamp, department) FROM stdin;
7	2	2	AT_MANAGER	Priya	Deshmukh	priya@alphatng.com	$2b$10$aqTX2F0zBjvUKEkWetLEjufzuTp.pc4ttkrAQGKrIB.DH.KvpCaWa	9876543221	t	2026-06-12 16:14:02.742942	Support
2	1	2	QC_MANAGER	Rahul	Patil	rahul@quincecapital.com	$2b$10$aqTX2F0zBjvUKEkWetLEjufzuTp.pc4ttkrAQGKrIB.DH.KvpCaWa	9876543211	t	2026-06-12 16:14:02.742942	Support
3	1	3	QC_DEV01	Amit	Sharma	amit@quincecapital.com	$2b$10$aqTX2F0zBjvUKEkWetLEjufzuTp.pc4ttkrAQGKrIB.DH.KvpCaWa	9876543212	t	2026-06-12 16:14:02.742942	Support
11	1	4	QC_JOHND_5477	John	Doe	john_test_1781261635477@quincecapital.com	$2b$10$aqTX2F0zBjvUKEkWetLEjufzuTp.pc4ttkrAQGKrIB.DH.KvpCaWa	1234567890	t	2026-06-12 16:23:55.619284	Finance
12	1	4	QC_KRIBHO_7956	krish	bhojwani	k@gmail.com	$2b$10$8aE5zO/Y3RadBQvzzdXtieoprE9NBsCxBKn1tg8IbY.FOH913/KdO		t	2026-06-12 16:31:56.908351	Finance
5	1	4	QC_CUST01	Rohan	Mehta	rohan@quincecapital.com	$2b$10$aqTX2F0zBjvUKEkWetLEjufzuTp.pc4ttkrAQGKrIB.DH.KvpCaWa	9876543214	t	2026-06-12 16:14:02.742942	General Issues
6	2	1	AT_ADMIN	Vikram	Singh	vikram@alphatng.com	$2b$10$aqTX2F0zBjvUKEkWetLEjufzuTp.pc4ttkrAQGKrIB.DH.KvpCaWa	9876543220	t	2026-06-12 16:14:02.742942	IT
8	2	3	AT_DEV01	Karan	Verma	karan@alphatng.com	$2b$10$aqTX2F0zBjvUKEkWetLEjufzuTp.pc4ttkrAQGKrIB.DH.KvpCaWa	9876543222	t	2026-06-12 16:14:02.742942	IT
1	1	1	QC_ADMIN	Krish	Bhojwani	krish@quincecapital.com	$2b$10$aqTX2F0zBjvUKEkWetLEjufzuTp.pc4ttkrAQGKrIB.DH.KvpCaWa	9876543210	t	2026-06-12 16:14:02.742942	IT
13	1	1	QC_ADMIN2	Sarah	Connor	sarah@quincecapital.com	$2b$10$tZg/C.9G0rUjZ6Yl51k95ee0Wsp0Nux3qO10.Gz28bX78iE5f1Eeu	9876543231	t	2026-06-12 17:46:18.966227	IT
16	1	3	QC_DEV05	David	Miller	david@quincecapital.com	$2b$10$tZg/C.9G0rUjZ6Yl51k95ee0Wsp0Nux3qO10.Gz28bX78iE5f1Eeu	9876543234	t	2026-06-12 17:46:18.966227	IT
17	1	4	QC_CUST02	Kunal	Kapoor	kunal@quincecapital.com	$2b$10$tZg/C.9G0rUjZ6Yl51k95ee0Wsp0Nux3qO10.Gz28bX78iE5f1Eeu	9876543235	t	2026-06-12 17:46:18.966227	Finance
9	2	3	AT_DEV02	Sneha	Kulkarni	sneha@alphatng.com	$2b$10$aqTX2F0zBjvUKEkWetLEjufzuTp.pc4ttkrAQGKrIB.DH.KvpCaWa	9876543223	t	2026-06-12 16:14:02.742942	HR
14	1	3	QC_DEV03	Raj	Malhotra	raj@quincecapital.com	$2b$10$tZg/C.9G0rUjZ6Yl51k95ee0Wsp0Nux3qO10.Gz28bX78iE5f1Eeu	9876543232	t	2026-06-12 17:46:18.966227	HR
18	1	4	QC_CUST03	Tanya	Sen	tanya@quincecapital.com	$2b$10$tZg/C.9G0rUjZ6Yl51k95ee0Wsp0Nux3qO10.Gz28bX78iE5f1Eeu	9876543236	t	2026-06-12 17:46:18.966227	HR
15	1	3	QC_DEV04	Elena	Gilbert	elena@quincecapital.com	$2b$10$tZg/C.9G0rUjZ6Yl51k95ee0Wsp0Nux3qO10.Gz28bX78iE5f1Eeu	9876543233	t	2026-06-12 17:46:18.966227	Sales
19	1	4	QC_CUST04	Anil	Gupta	anil@quincecapital.com	$2b$10$tZg/C.9G0rUjZ6Yl51k95ee0Wsp0Nux3qO10.Gz28bX78iE5f1Eeu	9876543237	t	2026-06-12 17:46:18.966227	Sales
4	1	3	QC_DEV02	Neha	Joshi	neha@quincecapital.com	$2b$10$aqTX2F0zBjvUKEkWetLEjufzuTp.pc4ttkrAQGKrIB.DH.KvpCaWa	9876543213	t	2026-06-12 16:14:02.742942	Marketing
10	2	4	AT_CUST01	Aditya	Jain	aditya@alphatng.com	$2b$10$aqTX2F0zBjvUKEkWetLEjufzuTp.pc4ttkrAQGKrIB.DH.KvpCaWa	9876543224	t	2026-06-12 16:14:02.742942	Marketing
20	1	1	QA-CODEX-001	Codex	Verifier	codex.verifier@qyuince.local	$2b$10$GNFv6OLHwGQELPQOYaPZmeC0Q5TvOMIZ77rjGpqVje.eGVNKBfXEu		t	2026-06-14 21:54:11.723925	QA
\.


--
-- TOC entry 5182 (class 0 OID 0)
-- Dependencies: 220
-- Name: companies_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_company_id_seq', 2, true);


--
-- TOC entry 5183 (class 0 OID 0)
-- Dependencies: 222
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 5, true);


--
-- TOC entry 5184 (class 0 OID 0)
-- Dependencies: 224
-- Name: tags_tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tags_tag_id_seq', 10, true);


--
-- TOC entry 5185 (class 0 OID 0)
-- Dependencies: 226
-- Name: ticket_attachments_attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_attachments_attachment_id_seq', 1, false);


--
-- TOC entry 5186 (class 0 OID 0)
-- Dependencies: 228
-- Name: ticket_categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_categories_category_id_seq', 11, true);


--
-- TOC entry 5187 (class 0 OID 0)
-- Dependencies: 230
-- Name: ticket_comments_comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_comments_comment_id_seq', 1, false);


--
-- TOC entry 5188 (class 0 OID 0)
-- Dependencies: 232
-- Name: ticket_history_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_history_history_id_seq', 1, false);


--
-- TOC entry 5189 (class 0 OID 0)
-- Dependencies: 234
-- Name: ticket_priorities_priority_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_priorities_priority_id_seq', 8, true);


--
-- TOC entry 5190 (class 0 OID 0)
-- Dependencies: 236
-- Name: ticket_statuses_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_statuses_status_id_seq', 10, true);


--
-- TOC entry 5191 (class 0 OID 0)
-- Dependencies: 238
-- Name: tickets_ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_ticket_id_seq', 16, true);


--
-- TOC entry 5192 (class 0 OID 0)
-- Dependencies: 240
-- Name: users_user_serial_no_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_serial_no_seq', 20, true);


--
-- TOC entry 4942 (class 2606 OID 16988)
-- Name: companies companies_company_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_company_code_key UNIQUE (company_code);


--
-- TOC entry 4944 (class 2606 OID 16990)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (company_id);


--
-- TOC entry 4946 (class 2606 OID 16992)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 4948 (class 2606 OID 16994)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4950 (class 2606 OID 16996)
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- TOC entry 4952 (class 2606 OID 16998)
-- Name: ticket_attachments ticket_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_pkey PRIMARY KEY (attachment_id);


--
-- TOC entry 4954 (class 2606 OID 17000)
-- Name: ticket_categories ticket_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_categories
    ADD CONSTRAINT ticket_categories_pkey PRIMARY KEY (category_id);


--
-- TOC entry 4957 (class 2606 OID 17002)
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (comment_id);


--
-- TOC entry 4960 (class 2606 OID 17004)
-- Name: ticket_history ticket_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_history
    ADD CONSTRAINT ticket_history_pkey PRIMARY KEY (history_id);


--
-- TOC entry 4962 (class 2606 OID 17006)
-- Name: ticket_priorities ticket_priorities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_priorities
    ADD CONSTRAINT ticket_priorities_pkey PRIMARY KEY (priority_id);


--
-- TOC entry 4964 (class 2606 OID 17008)
-- Name: ticket_statuses ticket_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_statuses
    ADD CONSTRAINT ticket_statuses_pkey PRIMARY KEY (status_id);


--
-- TOC entry 4975 (class 2606 OID 17010)
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (ticket_id);


--
-- TOC entry 4977 (class 2606 OID 17012)
-- Name: tickets tickets_ticket_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_no_key UNIQUE (ticket_no);


--
-- TOC entry 4979 (class 2606 OID 17014)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4981 (class 2606 OID 17016)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_serial_no);


--
-- TOC entry 4983 (class 2606 OID 17018)
-- Name: users users_user_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_code_key UNIQUE (user_code);


--
-- TOC entry 4955 (class 1259 OID 17019)
-- Name: idx_comments_ticket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_ticket ON public.ticket_comments USING btree (ticket_id);


--
-- TOC entry 4958 (class 1259 OID 17020)
-- Name: idx_history_ticket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_history_ticket ON public.ticket_history USING btree (ticket_id);


--
-- TOC entry 4965 (class 1259 OID 17021)
-- Name: idx_ticket_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_department ON public.tickets USING btree (department);


--
-- TOC entry 4966 (class 1259 OID 17022)
-- Name: idx_ticket_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_no ON public.tickets USING btree (ticket_no);


--
-- TOC entry 4967 (class 1259 OID 17023)
-- Name: idx_ticket_subject; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_subject ON public.tickets USING btree (subject);


--
-- TOC entry 4968 (class 1259 OID 17024)
-- Name: idx_tickets_assigned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_assigned ON public.tickets USING btree (assigned_to_user_code);


--
-- TOC entry 4969 (class 1259 OID 17025)
-- Name: idx_tickets_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_category ON public.tickets USING btree (category_id);


--
-- TOC entry 4970 (class 1259 OID 17026)
-- Name: idx_tickets_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_company ON public.tickets USING btree (company_id);


--
-- TOC entry 4971 (class 1259 OID 17027)
-- Name: idx_tickets_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_priority ON public.tickets USING btree (priority_id);


--
-- TOC entry 4972 (class 1259 OID 17028)
-- Name: idx_tickets_raised; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_raised ON public.tickets USING btree (raised_by_user_code);


--
-- TOC entry 4973 (class 1259 OID 17029)
-- Name: idx_tickets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_status ON public.tickets USING btree (status_id);


--
-- TOC entry 4985 (class 2606 OID 17030)
-- Name: ticket_attachments fk_attachment_ticket; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT fk_attachment_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id);


--
-- TOC entry 4986 (class 2606 OID 17035)
-- Name: ticket_categories fk_category_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_categories
    ADD CONSTRAINT fk_category_company FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4987 (class 2606 OID 17040)
-- Name: ticket_comments fk_comment_ticket; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT fk_comment_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id);


--
-- TOC entry 4988 (class 2606 OID 17045)
-- Name: ticket_history fk_history_ticket; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_history
    ADD CONSTRAINT fk_history_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id);


--
-- TOC entry 4989 (class 2606 OID 17050)
-- Name: ticket_priorities fk_priority_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_priorities
    ADD CONSTRAINT fk_priority_company FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4990 (class 2606 OID 17055)
-- Name: ticket_statuses fk_status_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_statuses
    ADD CONSTRAINT fk_status_company FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4984 (class 2606 OID 17060)
-- Name: tags fk_tag_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT fk_tag_company FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4991 (class 2606 OID 17065)
-- Name: tickets fk_ticket_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_ticket_category FOREIGN KEY (category_id) REFERENCES public.ticket_categories(category_id);


--
-- TOC entry 4992 (class 2606 OID 17070)
-- Name: tickets fk_ticket_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_ticket_company FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4993 (class 2606 OID 17075)
-- Name: tickets fk_ticket_priority; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_ticket_priority FOREIGN KEY (priority_id) REFERENCES public.ticket_priorities(priority_id);


--
-- TOC entry 4994 (class 2606 OID 17080)
-- Name: tickets fk_ticket_status; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_ticket_status FOREIGN KEY (status_id) REFERENCES public.ticket_statuses(status_id);


--
-- TOC entry 4995 (class 2606 OID 17085)
-- Name: users fk_users_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 4996 (class 2606 OID 17090)
-- Name: users fk_users_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


-- Completed on 2026-06-15 10:48:27

--
-- PostgreSQL database dump complete
--

\unrestrict 9TI2MvT74zcjvhbXlYxuw2R9TBzhLbdigMMblPNJyaK1ztNA1hPzTfMDNuFZT4P

