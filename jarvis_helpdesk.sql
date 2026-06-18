--
-- PostgreSQL database dump
--

\restrict hJovGsDUdmaI4VoBd7hBKhaHJk9eqYu8uYjroDVEngSkZoXALELj9guqWHnk3g5

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-06-18 16:17:40

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
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- TOC entry 5190 (class 0 OID 0)
-- Dependencies: 220
-- Name: companies_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_company_id_seq OWNED BY public.companies.company_id;


--
-- TOC entry 244 (class 1259 OID 17322)
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    department_id bigint NOT NULL,
    department_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    company_code character varying(50) NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 17321)
-- Name: departments_department_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_department_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_department_id_seq OWNER TO postgres;

--
-- TOC entry 5191 (class 0 OID 0)
-- Dependencies: 243
-- Name: departments_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_department_id_seq OWNED BY public.departments.department_id;


--
-- TOC entry 221 (class 1259 OID 16862)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id bigint NOT NULL,
    role_name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- TOC entry 5192 (class 0 OID 0)
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
    tag_name character varying(100) NOT NULL,
    tag_color character varying(20),
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- TOC entry 5193 (class 0 OID 0)
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
-- TOC entry 5194 (class 0 OID 0)
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
    category_name character varying(100) NOT NULL,
    category_description text,
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- TOC entry 5195 (class 0 OID 0)
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
-- TOC entry 5196 (class 0 OID 0)
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
-- TOC entry 5197 (class 0 OID 0)
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
    priority_name character varying(50) NOT NULL,
    priority_value integer NOT NULL,
    priority_color character varying(20),
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- TOC entry 5198 (class 0 OID 0)
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
    status_name character varying(100) NOT NULL,
    status_color character varying(20),
    display_order integer DEFAULT 1,
    is_default boolean DEFAULT false,
    is_closed_status boolean DEFAULT false,
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- TOC entry 5199 (class 0 OID 0)
-- Dependencies: 236
-- Name: ticket_statuses_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_statuses_status_id_seq OWNED BY public.ticket_statuses.status_id;


--
-- TOC entry 242 (class 1259 OID 17102)
-- Name: ticket_subcategories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_subcategories (
    subcategory_id bigint NOT NULL,
    category_id bigint NOT NULL,
    subcategory_name character varying(100) NOT NULL,
    subcategory_description text,
    assigned_user_code character varying(50),
    is_active boolean DEFAULT true,
    update_timestamp timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ticket_subcategories OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 17101)
-- Name: ticket_subcategories_subcategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_subcategories_subcategory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_subcategories_subcategory_id_seq OWNER TO postgres;

--
-- TOC entry 5200 (class 0 OID 0)
-- Dependencies: 241
-- Name: ticket_subcategories_subcategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ticket_subcategories_subcategory_id_seq OWNED BY public.ticket_subcategories.subcategory_id;


--
-- TOC entry 237 (class 1259 OID 16943)
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    ticket_id bigint NOT NULL,
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
    subcategory_id bigint,
    department_id bigint,
    company_code character varying(50) NOT NULL
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
-- TOC entry 5201 (class 0 OID 0)
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
    role_id bigint NOT NULL,
    user_code character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    phone character varying(20),
    is_active boolean DEFAULT true,
    update_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    department_id bigint,
    company_code character varying(50) NOT NULL
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
-- TOC entry 5202 (class 0 OID 0)
-- Dependencies: 240
-- Name: users_user_serial_no_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_serial_no_seq OWNED BY public.users.user_serial_no;


--
-- TOC entry 4916 (class 2604 OID 17580)
-- Name: companies company_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies ALTER COLUMN company_id SET DEFAULT nextval('public.companies_company_id_seq'::regclass);


--
-- TOC entry 4952 (class 2604 OID 17325)
-- Name: departments department_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN department_id SET DEFAULT nextval('public.departments_department_id_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 17581)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 4922 (class 2604 OID 17582)
-- Name: tags tag_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags ALTER COLUMN tag_id SET DEFAULT nextval('public.tags_tag_id_seq'::regclass);


--
-- TOC entry 4925 (class 2604 OID 17583)
-- Name: ticket_attachments attachment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments ALTER COLUMN attachment_id SET DEFAULT nextval('public.ticket_attachments_attachment_id_seq'::regclass);


--
-- TOC entry 4927 (class 2604 OID 17584)
-- Name: ticket_categories category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_categories ALTER COLUMN category_id SET DEFAULT nextval('public.ticket_categories_category_id_seq'::regclass);


--
-- TOC entry 4930 (class 2604 OID 17585)
-- Name: ticket_comments comment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments ALTER COLUMN comment_id SET DEFAULT nextval('public.ticket_comments_comment_id_seq'::regclass);


--
-- TOC entry 4932 (class 2604 OID 17586)
-- Name: ticket_history history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_history ALTER COLUMN history_id SET DEFAULT nextval('public.ticket_history_history_id_seq'::regclass);


--
-- TOC entry 4934 (class 2604 OID 17587)
-- Name: ticket_priorities priority_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_priorities ALTER COLUMN priority_id SET DEFAULT nextval('public.ticket_priorities_priority_id_seq'::regclass);


--
-- TOC entry 4937 (class 2604 OID 17588)
-- Name: ticket_statuses status_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_statuses ALTER COLUMN status_id SET DEFAULT nextval('public.ticket_statuses_status_id_seq'::regclass);


--
-- TOC entry 4949 (class 2604 OID 17589)
-- Name: ticket_subcategories subcategory_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_subcategories ALTER COLUMN subcategory_id SET DEFAULT nextval('public.ticket_subcategories_subcategory_id_seq'::regclass);


--
-- TOC entry 4943 (class 2604 OID 17590)
-- Name: tickets ticket_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets ALTER COLUMN ticket_id SET DEFAULT nextval('public.tickets_ticket_id_seq'::regclass);


--
-- TOC entry 4946 (class 2604 OID 17591)
-- Name: users user_serial_no; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_serial_no SET DEFAULT nextval('public.users_user_serial_no_seq'::regclass);


--
-- TOC entry 5159 (class 0 OID 16851)
-- Dependencies: 219
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (company_id, company_name, company_code, email, phone, address, is_active, update_timestamp) FROM stdin;
1	Quince Capital	QC	admin@quincecapital.com	+91-9000000001	Mumbai, India	t	2026-06-16 11:33:34.056926
2	Alpha TNG	ATNG	admin@alphatng.com	+91-9000000002	Pune, India	t	2026-06-16 11:33:34.056926
\.


--
-- TOC entry 5184 (class 0 OID 17322)
-- Dependencies: 244
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (department_id, department_name, is_active, update_timestamp, company_code) FROM stdin;
1	Sales	t	2026-06-16 11:33:46.127791	QC
2	HR	t	2026-06-16 11:33:46.127791	QC
3	IT	t	2026-06-16 11:33:46.127791	QC
4	Finance	t	2026-06-16 11:33:46.127791	QC
5	Sales	t	2026-06-16 11:33:46.127791	ATNG
6	HR	t	2026-06-16 11:33:46.127791	ATNG
7	IT	t	2026-06-16 11:33:46.127791	ATNG
8	Finance	t	2026-06-16 11:33:46.127791	ATNG
\.


--
-- TOC entry 5161 (class 0 OID 16862)
-- Dependencies: 221
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, role_name, description, is_active, update_timestamp) FROM stdin;
1	Admin	System Administrator	t	2026-06-16 11:33:39.714455
2	Manager	Department Manager	t	2026-06-16 11:33:39.714455
3	Employee	Standard Employee	t	2026-06-16 11:33:39.714455
\.


--
-- TOC entry 5163 (class 0 OID 16872)
-- Dependencies: 223
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (tag_id, tag_name, tag_color, is_active, update_timestamp) FROM stdin;
1	Urgent	#DC3545	t	2026-06-16 11:36:48.158075
2	Customer	#0D6EFD	t	2026-06-16 11:36:48.158075
3	Internal	#6F42C1	t	2026-06-16 11:36:48.158075
4	Bug	#FD7E14	t	2026-06-16 11:36:48.158075
5	Enhancement	#198754	t	2026-06-16 11:36:48.158075
6	Finance	#20C997	t	2026-06-16 11:36:48.158075
7	HR	#6610F2	t	2026-06-16 11:36:48.158075
8	Sales	#FFC107	t	2026-06-16 11:36:48.158075
\.


--
-- TOC entry 5165 (class 0 OID 16881)
-- Dependencies: 225
-- Data for Name: ticket_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_attachments (attachment_id, ticket_id, file_name, file_path, uploaded_by_user_code, uploaded_at) FROM stdin;
\.


--
-- TOC entry 5167 (class 0 OID 16890)
-- Dependencies: 227
-- Data for Name: ticket_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_categories (category_id, category_name, category_description, is_active, update_timestamp) FROM stdin;
1	Sales	Sales related requests	t	2026-06-16 11:34:09.653324
2	Technical	Technical support and bugs	t	2026-06-16 11:34:09.653324
3	General Issues	General support requests	t	2026-06-16 11:34:09.653324
\.


--
-- TOC entry 5169 (class 0 OID 16901)
-- Dependencies: 229
-- Data for Name: ticket_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_comments (comment_id, ticket_id, commented_by_user_code, comment_text, created_at) FROM stdin;
2	11	SAL001	<p>write comment heredfgh</p>	2026-06-18 15:49:02.085048
3	11	SAL001	<p>2nd 3rd comment</p>	2026-06-18 15:49:47.387839
4	11	FIN002	<p>reply replyscvbn dfghj</p>	2026-06-18 15:50:44.642879
5	11	FIN002	<p>conversation</p>	2026-06-18 15:54:48.406516
\.


--
-- TOC entry 5171 (class 0 OID 16912)
-- Dependencies: 231
-- Data for Name: ticket_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_history (history_id, ticket_id, field_changed, old_value, new_value, changed_by_user_code, changed_at) FROM stdin;
2	5	Created		Ticket Created	QC_KRIBHO_8071	2026-06-16 15:53:30.427804
3	6	Created		Ticket Created	QC_KRIBHO_8071	2026-06-16 16:11:07.760284
4	7	Created		Ticket Created	QC_KRIBHO_8071	2026-06-16 16:11:33.797776
5	8	Created		Ticket Created	QC_KRIBHO_8071	2026-06-16 16:12:28.789536
6	9	Created		Ticket Created	QC_KRIBHO_8071	2026-06-16 16:12:45.197581
7	10	Created		Ticket Created	QC_KRIBHO_8071	2026-06-16 16:13:09.295002
8	10	Status	1	3	QC_ADMIN	2026-06-17 11:29:16.48049
9	10	Takeover	IT001	QC_ADMIN	QC_ADMIN	2026-06-17 11:29:21.737698
10	10	AssignedTo	QC_ADMIN	SAL002	QC_ADMIN	2026-06-17 12:01:53.580556
11	10	Takeover	SAL002	QC_ADMIN	QC_ADMIN	2026-06-17 12:02:17.26831
12	10	Priority	3	4	QC_ADMIN	2026-06-17 13:58:44.880846
13	10	AssignedTo	QC_ADMIN	SAL001	QC_ADMIN	2026-06-17 13:59:04.090521
14	10	AssignedTo	SAL001	QC_ADMIN	QC_ADMIN	2026-06-17 13:59:17.804223
15	10	Category	2	1	QC_ADMIN	2026-06-17 13:59:27.058433
16	10	DueDate		2026-07-02T14:00	QC_ADMIN	2026-06-17 14:00:06.722125
17	10	Category	1	2	QC_ADMIN	2026-06-17 15:07:17.47032
18	10	Subcategory	9	9	QC_ADMIN	2026-06-17 15:07:17.47032
19	8	Category	2	2	QC_ADMIN	2026-06-17 15:23:33.000275
20	8	Subcategory	8	9	QC_ADMIN	2026-06-17 15:23:33.000275
21	8	Category	2	2	QC_ADMIN	2026-06-17 15:24:24.477952
22	8	Subcategory	9	10	QC_ADMIN	2026-06-17 15:24:24.477952
23	8	Category	2	2	QC_ADMIN	2026-06-17 15:24:44.323243
24	8	Subcategory	10	9	QC_ADMIN	2026-06-17 15:24:44.323243
25	11	Created		Ticket Created	SAL001	2026-06-18 15:48:32.907114
\.


--
-- TOC entry 5173 (class 0 OID 16921)
-- Dependencies: 233
-- Data for Name: ticket_priorities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_priorities (priority_id, priority_name, priority_value, priority_color, is_active, update_timestamp) FROM stdin;
1	Low	1	#28A745	t	2026-06-16 11:33:52.085199
2	Medium	2	#FFC107	t	2026-06-16 11:33:52.085199
3	High	3	#FD7E14	t	2026-06-16 11:33:52.085199
4	Critical	4	#DC3545	t	2026-06-16 11:33:52.085199
\.


--
-- TOC entry 5175 (class 0 OID 16931)
-- Dependencies: 235
-- Data for Name: ticket_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_statuses (status_id, status_name, status_color, display_order, is_default, is_closed_status, is_active, update_timestamp) FROM stdin;
1	New	#2196F3	1	t	f	t	2026-06-16 11:34:01.238333
2	In Progress	#FD7E14	2	f	f	t	2026-06-16 11:34:01.238333
3	Closed	#28A745	3	f	t	t	2026-06-16 11:34:01.238333
\.


--
-- TOC entry 5182 (class 0 OID 17102)
-- Dependencies: 242
-- Data for Name: ticket_subcategories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ticket_subcategories (subcategory_id, category_id, subcategory_name, subcategory_description, assigned_user_code, is_active, update_timestamp) FROM stdin;
6	1	General Sales	General sales enquiries	SAL001	t	2026-06-16 11:37:40.116327+05:30
7	1	Payment Issues	Sales payment issues	FIN001	t	2026-06-16 11:37:40.116327+05:30
8	2	Bug Reports	Application bugs	IT001	t	2026-06-16 11:37:40.116327+05:30
9	2	Feature Requests	Feature requests	IT001	t	2026-06-16 11:37:40.116327+05:30
10	2	Jarvis Bugs	Jarvis platform bugs	IT001	t	2026-06-16 11:37:40.116327+05:30
\.


--
-- TOC entry 5177 (class 0 OID 16943)
-- Dependencies: 237
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (ticket_id, ticket_no, subject, description, category_id, priority_id, status_id, raised_by_user_code, assigned_to_user_code, resolved_by_user_code, due_date, resolution_date, is_recurring, update_timestamp, user_code, subcategory_id, department_id, company_code) FROM stdin;
5	TKT-1781605410382	Hello from krish	<p>Testing by krish.</p>	1	2	1	QC_KRIBHO_8071	SAL001	\N	\N	\N	f	2026-06-16 15:53:30.427804	\N	6	1	QC
6	TKT-1781606467724	kjyffiyo	<p>k,cty,uyo,y</p>	2	2	1	QC_KRIBHO_8071	IT002	\N	\N	\N	f	2026-06-16 16:11:07.760284	\N	9	1	QC
7	TKT-1781606493700	?>mnbvfsx	<p>;/ljhmgbf</p>	1	3	1	QC_KRIBHO_8071	FIN001	\N	\N	\N	f	2026-06-16 16:11:33.797776	\N	7	1	QC
9	TKT-1781606565194	jgh c.	<p>hvyhyli,yob</p>	2	1	1	QC_KRIBHO_8071	IT001	\N	\N	\N	f	2026-06-16 16:12:45.197581	\N	8	1	QC
10	TKT-1781606589251	,vu6f,6o6xcoxs6	<p>mvtliuv,.l</p>	2	4	3	QC_KRIBHO_8071	QC_ADMIN	\N	2026-07-02 14:00:00	\N	f	2026-06-17 15:07:17.47032	\N	9	1	QC
8	TKT-1781606548742	.l/ic.d7od7co/	<p>ct,kutcu7o6c</p>	2	3	1	QC_KRIBHO_8071	IT001	\N	\N	\N	f	2026-06-17 15:24:44.323243	\N	9	1	QC
11	TKT-1781777912848	Urgent ticket	<p>ticket with info</p>	1	4	1	SAL001	FIN002	\N	\N	\N	f	2026-06-18 15:48:32.907114	\N	7	1	QC
\.


--
-- TOC entry 5179 (class 0 OID 16960)
-- Dependencies: 239
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_serial_no, role_id, user_code, first_name, last_name, email, password_hash, phone, is_active, update_timestamp, department_id, company_code) FROM stdin;
1	1	QC_ADMIN	Krish	Bhojwani	admin@quincecapital.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999001	t	2026-06-16 11:34:40.977106	3	QC
2	2	SAL001	Rahul	Patil	sales1@quincecapital.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999002	t	2026-06-16 11:34:40.977106	1	QC
3	3	SAL002	Priya	Shah	sales2@quincecapital.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999003	t	2026-06-16 11:34:40.977106	1	QC
4	2	HR001	Anjali	Verma	hr1@quincecapital.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999004	t	2026-06-16 11:34:40.977106	2	QC
5	3	HR002	Sneha	Iyer	hr2@quincecapital.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999005	t	2026-06-16 11:34:40.977106	2	QC
6	2	IT001	Amit	Sharma	it1@quincecapital.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999006	t	2026-06-16 11:34:40.977106	3	QC
7	3	IT002	Rohit	Kulkarni	it2@quincecapital.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999007	t	2026-06-16 11:34:40.977106	3	QC
8	2	FIN001	Pooja	Deshmukh	finance1@quincecapital.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999008	t	2026-06-16 11:34:40.977106	4	QC
9	3	FIN002	Neha	Joshi	finance2@quincecapital.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999009	t	2026-06-16 11:34:40.977106	4	QC
10	1	AT_ADMIN	Vikram	Singh	admin@alphatng.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999010	t	2026-06-16 11:34:40.977106	7	ATNG
11	2	AT_SAL001	Karan	Patel	sales@alphatng.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999011	t	2026-06-16 11:34:40.977106	5	ATNG
12	2	AT_HR001	Ritika	Gupta	hr@alphatng.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999012	t	2026-06-16 11:34:40.977106	6	ATNG
13	2	AT_IT001	Aditya	Sharma	it@alphatng.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999013	t	2026-06-16 11:34:40.977106	7	ATNG
14	2	AT_FIN001	Megha	Jain	finance@alphatng.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu	9999999014	t	2026-06-16 11:34:40.977106	8	ATNG
37	3	QC_KRIBHO_8071	krish	bhojwani	k@gmail.com	$2b$10$kwvMXD1QpF5I.eetZ8cy2.jX1.H3BOVvZhVOFfzcP43K894E7/pvu		t	2026-06-16 15:52:51.649012	1	QC
38	3	QC_KRIBHO_4612	krish	bhojwani	krish@gmail.com	$2b$10$TEJpuzphiN02oNMsPgPkxe2PpVEUKiy1rBRNhOLHkqt5f2ZPol5S2		t	2026-06-17 18:22:30.64704	1	QC
\.


--
-- TOC entry 5203 (class 0 OID 0)
-- Dependencies: 220
-- Name: companies_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_company_id_seq', 2, true);


--
-- TOC entry 5204 (class 0 OID 0)
-- Dependencies: 243
-- Name: departments_department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_department_id_seq', 8, true);


--
-- TOC entry 5205 (class 0 OID 0)
-- Dependencies: 222
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 5, true);


--
-- TOC entry 5206 (class 0 OID 0)
-- Dependencies: 224
-- Name: tags_tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tags_tag_id_seq', 10, true);


--
-- TOC entry 5207 (class 0 OID 0)
-- Dependencies: 226
-- Name: ticket_attachments_attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_attachments_attachment_id_seq', 1, false);


--
-- TOC entry 5208 (class 0 OID 0)
-- Dependencies: 228
-- Name: ticket_categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_categories_category_id_seq', 3, true);


--
-- TOC entry 5209 (class 0 OID 0)
-- Dependencies: 230
-- Name: ticket_comments_comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_comments_comment_id_seq', 5, true);


--
-- TOC entry 5210 (class 0 OID 0)
-- Dependencies: 232
-- Name: ticket_history_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_history_history_id_seq', 25, true);


--
-- TOC entry 5211 (class 0 OID 0)
-- Dependencies: 234
-- Name: ticket_priorities_priority_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_priorities_priority_id_seq', 4, true);


--
-- TOC entry 5212 (class 0 OID 0)
-- Dependencies: 236
-- Name: ticket_statuses_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_statuses_status_id_seq', 6, true);


--
-- TOC entry 5213 (class 0 OID 0)
-- Dependencies: 241
-- Name: ticket_subcategories_subcategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ticket_subcategories_subcategory_id_seq', 5, true);


--
-- TOC entry 5214 (class 0 OID 0)
-- Dependencies: 238
-- Name: tickets_ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_ticket_id_seq', 11, true);


--
-- TOC entry 5215 (class 0 OID 0)
-- Dependencies: 240
-- Name: users_user_serial_no_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_serial_no_seq', 38, true);


--
-- TOC entry 4956 (class 2606 OID 16988)
-- Name: companies companies_company_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_company_code_key UNIQUE (company_code);


--
-- TOC entry 4958 (class 2606 OID 16990)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (company_id);


--
-- TOC entry 4999 (class 2606 OID 17332)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- TOC entry 4960 (class 2606 OID 16992)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 4962 (class 2606 OID 16994)
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- TOC entry 4964 (class 2606 OID 16996)
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- TOC entry 4966 (class 2606 OID 16998)
-- Name: ticket_attachments ticket_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_pkey PRIMARY KEY (attachment_id);


--
-- TOC entry 4968 (class 2606 OID 17000)
-- Name: ticket_categories ticket_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_categories
    ADD CONSTRAINT ticket_categories_pkey PRIMARY KEY (category_id);


--
-- TOC entry 4971 (class 2606 OID 17002)
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (comment_id);


--
-- TOC entry 4974 (class 2606 OID 17004)
-- Name: ticket_history ticket_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_history
    ADD CONSTRAINT ticket_history_pkey PRIMARY KEY (history_id);


--
-- TOC entry 4976 (class 2606 OID 17006)
-- Name: ticket_priorities ticket_priorities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_priorities
    ADD CONSTRAINT ticket_priorities_pkey PRIMARY KEY (priority_id);


--
-- TOC entry 4978 (class 2606 OID 17008)
-- Name: ticket_statuses ticket_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_statuses
    ADD CONSTRAINT ticket_statuses_pkey PRIMARY KEY (status_id);


--
-- TOC entry 4997 (class 2606 OID 17115)
-- Name: ticket_subcategories ticket_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_subcategories
    ADD CONSTRAINT ticket_subcategories_pkey PRIMARY KEY (subcategory_id);


--
-- TOC entry 4987 (class 2606 OID 17010)
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (ticket_id);


--
-- TOC entry 4989 (class 2606 OID 17012)
-- Name: tickets tickets_ticket_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_no_key UNIQUE (ticket_no);


--
-- TOC entry 4991 (class 2606 OID 17014)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4993 (class 2606 OID 17016)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_serial_no);


--
-- TOC entry 4995 (class 2606 OID 17018)
-- Name: users users_user_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_code_key UNIQUE (user_code);


--
-- TOC entry 4969 (class 1259 OID 17019)
-- Name: idx_comments_ticket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_ticket ON public.ticket_comments USING btree (ticket_id);


--
-- TOC entry 4972 (class 1259 OID 17020)
-- Name: idx_history_ticket; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_history_ticket ON public.ticket_history USING btree (ticket_id);


--
-- TOC entry 4979 (class 1259 OID 17022)
-- Name: idx_ticket_no; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_no ON public.tickets USING btree (ticket_no);


--
-- TOC entry 4980 (class 1259 OID 17023)
-- Name: idx_ticket_subject; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ticket_subject ON public.tickets USING btree (subject);


--
-- TOC entry 4981 (class 1259 OID 17024)
-- Name: idx_tickets_assigned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_assigned ON public.tickets USING btree (assigned_to_user_code);


--
-- TOC entry 4982 (class 1259 OID 17025)
-- Name: idx_tickets_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_category ON public.tickets USING btree (category_id);


--
-- TOC entry 4983 (class 1259 OID 17027)
-- Name: idx_tickets_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_priority ON public.tickets USING btree (priority_id);


--
-- TOC entry 4984 (class 1259 OID 17028)
-- Name: idx_tickets_raised; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_raised ON public.tickets USING btree (raised_by_user_code);


--
-- TOC entry 4985 (class 1259 OID 17029)
-- Name: idx_tickets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_status ON public.tickets USING btree (status_id);


--
-- TOC entry 5000 (class 2606 OID 17030)
-- Name: ticket_attachments fk_attachment_ticket; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT fk_attachment_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id);


--
-- TOC entry 5001 (class 2606 OID 17040)
-- Name: ticket_comments fk_comment_ticket; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT fk_comment_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id);


--
-- TOC entry 5002 (class 2606 OID 17045)
-- Name: ticket_history fk_history_ticket; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_history
    ADD CONSTRAINT fk_history_ticket FOREIGN KEY (ticket_id) REFERENCES public.tickets(ticket_id);


--
-- TOC entry 5010 (class 2606 OID 17121)
-- Name: ticket_subcategories fk_subcategory_assignee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_subcategories
    ADD CONSTRAINT fk_subcategory_assignee FOREIGN KEY (assigned_user_code) REFERENCES public.users(user_code);


--
-- TOC entry 5011 (class 2606 OID 17116)
-- Name: ticket_subcategories fk_subcategory_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_subcategories
    ADD CONSTRAINT fk_subcategory_category FOREIGN KEY (category_id) REFERENCES public.ticket_categories(category_id);


--
-- TOC entry 5003 (class 2606 OID 17065)
-- Name: tickets fk_ticket_category; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_ticket_category FOREIGN KEY (category_id) REFERENCES public.ticket_categories(category_id);


--
-- TOC entry 5004 (class 2606 OID 17075)
-- Name: tickets fk_ticket_priority; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_ticket_priority FOREIGN KEY (priority_id) REFERENCES public.ticket_priorities(priority_id);


--
-- TOC entry 5005 (class 2606 OID 17080)
-- Name: tickets fk_ticket_status; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_ticket_status FOREIGN KEY (status_id) REFERENCES public.ticket_statuses(status_id);


--
-- TOC entry 5006 (class 2606 OID 17126)
-- Name: tickets fk_ticket_subcategory; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_ticket_subcategory FOREIGN KEY (subcategory_id) REFERENCES public.ticket_subcategories(subcategory_id);


--
-- TOC entry 5007 (class 2606 OID 17343)
-- Name: tickets fk_tickets_department; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT fk_tickets_department FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- TOC entry 5008 (class 2606 OID 17338)
-- Name: users fk_users_department; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- TOC entry 5009 (class 2606 OID 17090)
-- Name: users fk_users_role; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


-- Completed on 2026-06-18 16:17:40

--
-- PostgreSQL database dump complete
--

\unrestrict hJovGsDUdmaI4VoBd7hBKhaHJk9eqYu8uYjroDVEngSkZoXALELj9guqWHnk3g5

