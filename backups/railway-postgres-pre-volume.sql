--
-- PostgreSQL database dump
--

\restrict T3MLZa7ZxaN0HRub7fbR49XlC9CRsNwIRMt00o2QOeT7xXF4M6UHDnKJadrvsZV

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: Client; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."Client" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text NOT NULL,
    "trainerId" text NOT NULL,
    "birthDate" timestamp(3) without time zone,
    height double precision,
    weight double precision,
    goal text,
    notes text
);


ALTER TABLE public."Client" OWNER TO coachos;

--
-- Name: Day; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."Day" (
    id integer NOT NULL,
    "dayOfWeek" integer NOT NULL,
    label text,
    "weekId" integer NOT NULL
);


ALTER TABLE public."Day" OWNER TO coachos;

--
-- Name: DayExercise; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."DayExercise" (
    id integer NOT NULL,
    "order" integer NOT NULL,
    sets integer NOT NULL,
    reps text NOT NULL,
    rpe double precision,
    notes text,
    "dayId" integer NOT NULL,
    "exerciseId" text NOT NULL
);


ALTER TABLE public."DayExercise" OWNER TO coachos;

--
-- Name: DayExercise_id_seq; Type: SEQUENCE; Schema: public; Owner: coachos
--

CREATE SEQUENCE public."DayExercise_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DayExercise_id_seq" OWNER TO coachos;

--
-- Name: DayExercise_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: coachos
--

ALTER SEQUENCE public."DayExercise_id_seq" OWNED BY public."DayExercise".id;


--
-- Name: Day_id_seq; Type: SEQUENCE; Schema: public; Owner: coachos
--

CREATE SEQUENCE public."Day_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Day_id_seq" OWNER TO coachos;

--
-- Name: Day_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: coachos
--

ALTER SEQUENCE public."Day_id_seq" OWNED BY public."Day".id;


--
-- Name: Exercise; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."Exercise" (
    id text NOT NULL,
    name text NOT NULL,
    "muscleGroup" text,
    category text,
    equipment text,
    description text,
    "videoUrl" text
);


ALTER TABLE public."Exercise" OWNER TO coachos;

--
-- Name: LogSet; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."LogSet" (
    id integer NOT NULL,
    "setNumber" integer NOT NULL,
    reps integer NOT NULL,
    weight double precision NOT NULL,
    rpe double precision,
    notes text,
    "workoutLogId" text NOT NULL,
    "exerciseId" text NOT NULL
);


ALTER TABLE public."LogSet" OWNER TO coachos;

--
-- Name: LogSet_id_seq; Type: SEQUENCE; Schema: public; Owner: coachos
--

CREATE SEQUENCE public."LogSet_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."LogSet_id_seq" OWNER TO coachos;

--
-- Name: LogSet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: coachos
--

ALTER SEQUENCE public."LogSet_id_seq" OWNED BY public."LogSet".id;


--
-- Name: Program; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."Program" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "clientId" text NOT NULL
);


ALTER TABLE public."Program" OWNER TO coachos;

--
-- Name: ProgramTemplate; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."ProgramTemplate" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "trainerId" text NOT NULL
);


ALTER TABLE public."ProgramTemplate" OWNER TO coachos;

--
-- Name: ProgramTemplateDay; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."ProgramTemplateDay" (
    id integer NOT NULL,
    "dayOfWeek" integer NOT NULL,
    label text,
    "weekId" integer NOT NULL
);


ALTER TABLE public."ProgramTemplateDay" OWNER TO coachos;

--
-- Name: ProgramTemplateDayExercise; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."ProgramTemplateDayExercise" (
    id integer NOT NULL,
    "order" integer NOT NULL,
    sets integer NOT NULL,
    reps text NOT NULL,
    rpe double precision,
    notes text,
    "dayId" integer NOT NULL,
    "exerciseId" text NOT NULL
);


ALTER TABLE public."ProgramTemplateDayExercise" OWNER TO coachos;

--
-- Name: ProgramTemplateDayExercise_id_seq; Type: SEQUENCE; Schema: public; Owner: coachos
--

CREATE SEQUENCE public."ProgramTemplateDayExercise_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProgramTemplateDayExercise_id_seq" OWNER TO coachos;

--
-- Name: ProgramTemplateDayExercise_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: coachos
--

ALTER SEQUENCE public."ProgramTemplateDayExercise_id_seq" OWNED BY public."ProgramTemplateDayExercise".id;


--
-- Name: ProgramTemplateDay_id_seq; Type: SEQUENCE; Schema: public; Owner: coachos
--

CREATE SEQUENCE public."ProgramTemplateDay_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProgramTemplateDay_id_seq" OWNER TO coachos;

--
-- Name: ProgramTemplateDay_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: coachos
--

ALTER SEQUENCE public."ProgramTemplateDay_id_seq" OWNED BY public."ProgramTemplateDay".id;


--
-- Name: ProgramTemplateWeek; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."ProgramTemplateWeek" (
    id integer NOT NULL,
    "weekNumber" integer NOT NULL,
    "templateId" text NOT NULL
);


ALTER TABLE public."ProgramTemplateWeek" OWNER TO coachos;

--
-- Name: ProgramTemplateWeek_id_seq; Type: SEQUENCE; Schema: public; Owner: coachos
--

CREATE SEQUENCE public."ProgramTemplateWeek_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ProgramTemplateWeek_id_seq" OWNER TO coachos;

--
-- Name: ProgramTemplateWeek_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: coachos
--

ALTER SEQUENCE public."ProgramTemplateWeek_id_seq" OWNED BY public."ProgramTemplateWeek".id;


--
-- Name: Session; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    duration integer NOT NULL,
    type text DEFAULT 'PRESENCIAL'::text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdByRole" text DEFAULT 'TRAINER'::text NOT NULL,
    "cancelledByRole" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "clientId" text NOT NULL
);


ALTER TABLE public."Session" OWNER TO coachos;

--
-- Name: User; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'CLIENT'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO coachos;

--
-- Name: Week; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."Week" (
    id integer NOT NULL,
    "weekNumber" integer NOT NULL,
    "programId" text NOT NULL
);


ALTER TABLE public."Week" OWNER TO coachos;

--
-- Name: Week_id_seq; Type: SEQUENCE; Schema: public; Owner: coachos
--

CREATE SEQUENCE public."Week_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Week_id_seq" OWNER TO coachos;

--
-- Name: Week_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: coachos
--

ALTER SEQUENCE public."Week_id_seq" OWNED BY public."Week".id;


--
-- Name: WorkoutLog; Type: TABLE; Schema: public; Owner: coachos
--

CREATE TABLE public."WorkoutLog" (
    id text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "clientId" text NOT NULL
);


ALTER TABLE public."WorkoutLog" OWNER TO coachos;

--
-- Name: Day id; Type: DEFAULT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Day" ALTER COLUMN id SET DEFAULT nextval('public."Day_id_seq"'::regclass);


--
-- Name: DayExercise id; Type: DEFAULT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."DayExercise" ALTER COLUMN id SET DEFAULT nextval('public."DayExercise_id_seq"'::regclass);


--
-- Name: LogSet id; Type: DEFAULT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."LogSet" ALTER COLUMN id SET DEFAULT nextval('public."LogSet_id_seq"'::regclass);


--
-- Name: ProgramTemplateDay id; Type: DEFAULT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."ProgramTemplateDay" ALTER COLUMN id SET DEFAULT nextval('public."ProgramTemplateDay_id_seq"'::regclass);


--
-- Name: ProgramTemplateDayExercise id; Type: DEFAULT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."ProgramTemplateDayExercise" ALTER COLUMN id SET DEFAULT nextval('public."ProgramTemplateDayExercise_id_seq"'::regclass);


--
-- Name: ProgramTemplateWeek id; Type: DEFAULT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."ProgramTemplateWeek" ALTER COLUMN id SET DEFAULT nextval('public."ProgramTemplateWeek_id_seq"'::regclass);


--
-- Name: Week id; Type: DEFAULT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Week" ALTER COLUMN id SET DEFAULT nextval('public."Week_id_seq"'::regclass);


--
-- Data for Name: Client; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."Client" (id, "createdAt", "updatedAt", "userId", "trainerId", "birthDate", height, weight, goal, notes) FROM stdin;
e0937a95-670f-4fdb-9f2b-d0f8bf7868a8	2026-04-08 16:37:00.105	2026-04-08 16:37:00.105	11402650-9749-4110-967a-46b36d859d88	46ad8b8c-5b46-4796-b6f2-b52c446e8bb1	\N	\N	\N	Ganar Músculo	\N
abf89b22-f8af-4544-814c-af254ff84fa1	2026-04-08 16:41:05.049	2026-04-08 17:00:38.283	68e8674b-d31a-49f4-900e-9c61ffc8130b	f24b6658-3d70-41a3-83b2-fab18ffa6059	\N	160	48	Ganar Musculo	Ninguna
3345de84-1ac9-4c3c-8d91-88731cab7806	2026-04-12 20:07:24.795	2026-04-12 20:29:10.961	c930b01d-244b-48ad-9afa-ed3e1caa3a98	f65a7fbe-d413-43a0-8cef-666bf32f94c3	\N	183	92	Ganar Músculo	\N
\.


--
-- Data for Name: Day; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."Day" (id, "dayOfWeek", label, "weekId") FROM stdin;
1	0	\N	1
2	1	\N	1
3	2	\N	1
4	3	\N	1
5	0	\N	2
6	1	\N	2
7	2	\N	2
8	3	\N	2
9	0	\N	3
10	1	\N	3
11	2	\N	3
12	3	\N	3
13	0	\N	4
14	1	\N	4
15	2	\N	4
16	3	\N	4
17	0	Upper	5
18	1	Lower	5
19	3	Upper	5
20	4	Lower	5
21	0	Upper	6
22	1	Lower	6
23	3	Upper	6
24	4	Lower	6
25	0	Upper	7
26	1	Lower	7
27	3	Upper	7
28	4	Lower	7
29	0	Upper	8
30	1	Lower	8
31	3	Upper	8
32	4	Lower	8
\.


--
-- Data for Name: DayExercise; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."DayExercise" (id, "order", sets, reps, rpe, notes, "dayId", "exerciseId") FROM stdin;
1	2	3	8-10	\N	\N	17	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
2	1	3	8-10	\N	\N	17	87f00f3f-35e9-418f-be73-9b42d89816e2
3	2	3	8-10	\N	\N	18	5e3c22f7-bfe0-4d98-aca3-e911a54488bc
4	1	3	8-10	\N	\N	18	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
5	3	3	8-10	\N	\N	19	2de4a83e-61ff-4bad-b241-cd2f49af412c
6	2	3	8-10	\N	\N	19	5e3c22f7-bfe0-4d98-aca3-e911a54488bc
7	1	3	8-10	\N	\N	19	5c291c96-31cf-4585-aee1-4e8402840179
8	2	3	8-10	\N	\N	20	2de4a83e-61ff-4bad-b241-cd2f49af412c
9	1	3	8-10	\N	\N	20	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
10	1	3	9	\N	\N	29	67cd2261-2bf3-46eb-8784-4e532ccfc012
\.


--
-- Data for Name: Exercise; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."Exercise" (id, name, "muscleGroup", category, equipment, description, "videoUrl") FROM stdin;
fc2146b2-18f0-4d11-8cc2-4998ee958428	Press banca plano	Pecho	\N	\N	\N	\N
2fbf85ef-704c-4690-83bd-255c1b139f01	Press banca inclinado	Pecho	\N	\N	\N	\N
56f7131b-8255-456e-b2da-5f86ad9bc45a	Press banca declinado	Pecho	\N	\N	\N	\N
742e9f62-34c0-477a-ab16-b955822a2aa6	Aperturas con mancuernas	Pecho	\N	\N	\N	\N
5d6c67a2-f637-47cb-a3fd-da4b9327ae7b	Fondos en paralelas	Pecho	\N	\N	\N	\N
36f8839d-9c44-4d0d-a7eb-a30e1b203c3e	Crossover en polea	Pecho	\N	\N	\N	\N
c5865462-acc0-4b9a-8cf0-4dbb4c5913a1	Press con mancuernas plano	Pecho	\N	\N	\N	\N
23f9e542-eaf6-42b1-b427-0eea5f3eb7be	Dominadas	Espalda	\N	\N	\N	\N
9a02d004-0f46-4004-93d5-879b57cf1a51	Remo con barra	Espalda	\N	\N	\N	\N
0a7a2f1f-76a7-47d3-941a-41b7b2d1a5e6	Remo con mancuerna	Espalda	\N	\N	\N	\N
c770c325-7422-40a5-ba6e-9ac5b7aaeb71	Jalón al pecho	Espalda	\N	\N	\N	\N
b784475a-09aa-4288-9f4a-551436d399b1	Jalón trasnuca	Espalda	\N	\N	\N	\N
03fc4835-f630-4835-b3a6-2299345da8c5	Peso muerto	Espalda	\N	\N	\N	\N
aad12a48-c3ae-417d-8ba8-6962436b3b99	Peso muerto rumano	Espalda	\N	\N	\N	\N
dcbe0adc-de75-4330-9f7a-79646b6f0c00	Remo en máquina	Espalda	\N	\N	\N	\N
a25d75ac-fffb-4970-9fc5-cf4e3851c656	Pull-over con polea	Espalda	\N	\N	\N	\N
fea4ddef-3d14-4a70-b816-adf63c3a58d6	Press militar con barra	Hombros	\N	\N	\N	\N
82324eae-fbbf-4272-a5c9-0047392c732f	Press con mancuernas sentado	Hombros	\N	\N	\N	\N
1556eb7b-b46a-4218-9fa6-6668e4b4f44d	Elevaciones laterales	Hombros	\N	\N	\N	\N
ada0ba1e-dd26-4abf-b62a-41a77e8efdd4	Elevaciones frontales	Hombros	\N	\N	\N	\N
5ee46c04-7419-4ee9-af9b-9a39d1d3a177	Pájaro (elevaciones posteriores)	Hombros	\N	\N	\N	\N
361fc6d7-4021-4e50-8319-dbb2de831da5	Face pull	Hombros	\N	\N	\N	\N
ffb48676-32cd-4de0-9ca4-4cae32ad3a0d	Curl con barra	Bíceps	\N	\N	\N	\N
85d9c6b1-8b22-4846-8560-82c0cbd7626d	Curl con mancuernas	Bíceps	\N	\N	\N	\N
6996b4b1-c947-4918-bf21-1b72435c976b	Curl martillo	Bíceps	\N	\N	\N	\N
c8db40e3-acdb-4dda-bf29-5f65f919bc7c	Curl en banco Scott	Bíceps	\N	\N	\N	\N
67cd2261-2bf3-46eb-8784-4e532ccfc012	Curl en polea baja	Bíceps	\N	\N	\N	\N
6f2751c5-22ad-4a0a-bcda-41e5a3224a4a	Press francés	Tríceps	\N	\N	\N	\N
0a8e0f07-6dc4-4897-97e2-1eca389e59c4	Fondos en banco	Tríceps	\N	\N	\N	\N
83dbf6a6-52b9-4626-8173-861f18672ccc	Extensión en polea alta	Tríceps	\N	\N	\N	\N
c19c1426-3c5e-4db6-a158-d4ea6028d737	Press cerrado	Tríceps	\N	\N	\N	\N
d94f1c97-3d35-4f06-bc8c-d5e18a7a2c96	Patada de tríceps	Tríceps	\N	\N	\N	\N
87197c33-6371-4263-83c8-86e40184a077	Sentadilla con barra	Piernas	\N	\N	\N	\N
f918f088-d3e5-468b-a87b-bd0332ea6d1d	Sentadilla goblet	Piernas	\N	\N	\N	\N
bde953dd-b6ce-46e3-98c6-9967bce059d8	Prensa de piernas	Piernas	\N	\N	\N	\N
9decad54-bce8-4bff-a106-a3757c3d863a	Extensión de cuádriceps	Piernas	\N	\N	\N	\N
2de4a83e-61ff-4bad-b241-cd2f49af412c	Curl femoral tumbado	Piernas	\N	\N	\N	\N
5c291c96-31cf-4585-aee1-4e8402840179	Curl femoral sentado	Piernas	\N	\N	\N	\N
11e0b37e-fabf-434d-bb00-783a23973d8a	Hip thrust	Piernas	\N	\N	\N	\N
540f7352-057a-457b-a834-508c70be0626	Zancadas	Piernas	\N	\N	\N	\N
9ce14d8e-20f0-4842-b991-18838830a07d	Zancadas búlgaras	Piernas	\N	\N	\N	\N
5ce2c560-5ff1-44b0-9888-38165db5a723	Elevación de talones de pie	Piernas	\N	\N	\N	\N
9b732740-1660-41c4-9703-a9eaa4a59d58	Elevación de talones sentado	Piernas	\N	\N	\N	\N
0365b473-4a54-491a-9bc6-26f50013cdbe	Abductor en máquina	Piernas	\N	\N	\N	\N
f96c02b3-8f32-4faa-a6d8-c75cd518e554	Aductor en máquina	Piernas	\N	\N	\N	\N
71e3c952-b5de-49bb-9d92-3ead38264980	Plancha	Core	\N	\N	\N	\N
87f00f3f-35e9-418f-be73-9b42d89816e2	Crunch abdominal	Core	\N	\N	\N	\N
fd718195-ea8b-4c3b-a21b-1a50251fa8e1	Rueda abdominal	Core	\N	\N	\N	\N
c5c93870-c921-44a2-b585-710cc96df3dc	Elevación de piernas colgado	Core	\N	\N	\N	\N
b7e7f8f8-6514-4dde-b9d3-93c6bd74b28e	Russian twist	Core	\N	\N	\N	\N
5e3c22f7-bfe0-4d98-aca3-e911a54488bc	Dead bug	Core	\N	\N	\N	\N
\.


--
-- Data for Name: LogSet; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."LogSet" (id, "setNumber", reps, weight, rpe, notes, "workoutLogId", "exerciseId") FROM stdin;
1	3	8	40	9	\N	2cedcb28-8fd9-4893-9cfb-bdb5bddfeb3f	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
2	3	8	12	8	\N	2cedcb28-8fd9-4893-9cfb-bdb5bddfeb3f	87f00f3f-35e9-418f-be73-9b42d89816e2
3	2	8	40	8	\N	2cedcb28-8fd9-4893-9cfb-bdb5bddfeb3f	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
4	2	8	12	8	\N	2cedcb28-8fd9-4893-9cfb-bdb5bddfeb3f	87f00f3f-35e9-418f-be73-9b42d89816e2
5	1	8	40	7	\N	2cedcb28-8fd9-4893-9cfb-bdb5bddfeb3f	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
6	1	8	12	8	\N	2cedcb28-8fd9-4893-9cfb-bdb5bddfeb3f	87f00f3f-35e9-418f-be73-9b42d89816e2
7	3	8	40	9	\N	77a4d7bb-9d78-4aec-8118-8744368a2072	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
8	3	8	12	8	\N	77a4d7bb-9d78-4aec-8118-8744368a2072	87f00f3f-35e9-418f-be73-9b42d89816e2
9	2	8	40	8	\N	77a4d7bb-9d78-4aec-8118-8744368a2072	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
10	2	8	12	8	\N	77a4d7bb-9d78-4aec-8118-8744368a2072	87f00f3f-35e9-418f-be73-9b42d89816e2
11	1	8	40	7	\N	77a4d7bb-9d78-4aec-8118-8744368a2072	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
12	1	8	12	8	\N	77a4d7bb-9d78-4aec-8118-8744368a2072	87f00f3f-35e9-418f-be73-9b42d89816e2
13	3	8	40	9	\N	a70cd4bf-3c3d-4f55-b51a-bc4b3e6430c0	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
14	3	8	12	8	\N	a70cd4bf-3c3d-4f55-b51a-bc4b3e6430c0	87f00f3f-35e9-418f-be73-9b42d89816e2
15	2	8	40	8	\N	a70cd4bf-3c3d-4f55-b51a-bc4b3e6430c0	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
16	2	8	12	8	\N	a70cd4bf-3c3d-4f55-b51a-bc4b3e6430c0	87f00f3f-35e9-418f-be73-9b42d89816e2
17	1	8	40	7	\N	a70cd4bf-3c3d-4f55-b51a-bc4b3e6430c0	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
18	1	8	12	8	\N	a70cd4bf-3c3d-4f55-b51a-bc4b3e6430c0	87f00f3f-35e9-418f-be73-9b42d89816e2
19	3	8	40	9	\N	834bf401-f958-4ffd-8488-53a4b967b7b8	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
20	3	8	12	8	\N	834bf401-f958-4ffd-8488-53a4b967b7b8	87f00f3f-35e9-418f-be73-9b42d89816e2
21	2	8	40	8	\N	834bf401-f958-4ffd-8488-53a4b967b7b8	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
22	2	8	12	8	\N	834bf401-f958-4ffd-8488-53a4b967b7b8	87f00f3f-35e9-418f-be73-9b42d89816e2
23	1	8	40	7	\N	834bf401-f958-4ffd-8488-53a4b967b7b8	ffb48676-32cd-4de0-9ca4-4cae32ad3a0d
24	1	8	12	8	\N	834bf401-f958-4ffd-8488-53a4b967b7b8	87f00f3f-35e9-418f-be73-9b42d89816e2
\.


--
-- Data for Name: Program; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."Program" (id, name, description, "startDate", "endDate", active, "createdAt", "clientId") FROM stdin;
93386fdc-ece8-49cf-9faf-214270445b72	ganar musculo	\N	\N	\N	t	2026-04-12 18:53:27.316	abf89b22-f8af-4544-814c-af254ff84fa1
fc84113d-7c37-4979-9506-ce84edc4df9e	Ganar Músculo	\N	\N	\N	t	2026-04-12 20:08:28.817	3345de84-1ac9-4c3c-8d91-88731cab7806
\.


--
-- Data for Name: ProgramTemplate; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."ProgramTemplate" (id, name, description, "createdAt", "updatedAt", "trainerId") FROM stdin;
9bd8089e-4b6c-4ffa-b52c-3abaf5a9d470	SBD	SBD	2026-04-12 22:17:41.37	2026-04-12 22:17:41.37	f65a7fbe-d413-43a0-8cef-666bf32f94c3
\.


--
-- Data for Name: ProgramTemplateDay; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."ProgramTemplateDay" (id, "dayOfWeek", label, "weekId") FROM stdin;
1	0	Push	1
2	1	Pull	1
3	2	Pull	1
4	0	Push	2
5	1	Pull	2
6	2	Pull	2
7	0	Push	3
8	1	Pull	3
9	2	Pull	3
\.


--
-- Data for Name: ProgramTemplateDayExercise; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."ProgramTemplateDayExercise" (id, "order", sets, reps, rpe, notes, "dayId", "exerciseId") FROM stdin;
1	3	3	8-10	\N	\N	1	5e3c22f7-bfe0-4d98-aca3-e911a54488bc
2	2	3	8-10	\N	\N	1	2de4a83e-61ff-4bad-b241-cd2f49af412c
3	1	3	8-10	\N	\N	1	c8db40e3-acdb-4dda-bf29-5f65f919bc7c
4	3	3	8-10	\N	\N	2	ada0ba1e-dd26-4abf-b62a-41a77e8efdd4
5	2	3	8-10	\N	\N	2	5c291c96-31cf-4585-aee1-4e8402840179
6	1	3	8-15	\N	\N	2	85d9c6b1-8b22-4846-8560-82c0cbd7626d
7	2	3	8-10	\N	\N	7	5c291c96-31cf-4585-aee1-4e8402840179
8	1	3	8-10	\N	\N	7	c8db40e3-acdb-4dda-bf29-5f65f919bc7c
\.


--
-- Data for Name: ProgramTemplateWeek; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."ProgramTemplateWeek" (id, "weekNumber", "templateId") FROM stdin;
1	1	9bd8089e-4b6c-4ffa-b52c-3abaf5a9d470
2	2	9bd8089e-4b6c-4ffa-b52c-3abaf5a9d470
3	3	9bd8089e-4b6c-4ffa-b52c-3abaf5a9d470
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."Session" (id, date, duration, type, status, "createdByRole", "cancelledByRole", notes, "createdAt", "clientId") FROM stdin;
1909acf3-8ce8-45b9-9a3c-23dc433b890e	2026-09-09 16:35:00	60	PRESENCIAL	PENDING	TRAINER	\N	\N	2026-04-08 16:55:24.496	abf89b22-f8af-4544-814c-af254ff84fa1
b590d0ae-2abb-4379-afcb-85b265bd5427	2026-04-22 14:00:00	120	PRESENCIAL	CANCELLED	TRAINER	CLIENT	\N	2026-04-12 20:28:38.947	3345de84-1ac9-4c3c-8d91-88731cab7806
780cc0a6-5e8f-49d1-9c44-257c3fe43fb4	2026-06-07 08:00:00	20	ONLINE	CANCELLED	TRAINER	\N	Pequeña clase	2026-04-12 22:54:32.936	3345de84-1ac9-4c3c-8d91-88731cab7806
6d92761b-652e-4911-aa41-a4ef7a94e520	2026-04-16 14:00:00	120	PRESENCIAL	CANCELLED	TRAINER	TRAINER	\N	2026-04-13 00:47:36.719	3345de84-1ac9-4c3c-8d91-88731cab7806
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."User" (id, email, password, name, role, "createdAt", "updatedAt") FROM stdin;
46ad8b8c-5b46-4796-b6f2-b52c446e8bb1	santiagosba888@gmail.com	$2a$10$eh4N4f0dS30oRZFmn/l9z.xqM4u0Fc35Ub0.zTnmRXrH4EwGP3GSG	Santiago Benitez Álvarez	TRAINER	2026-04-08 16:08:39.731	2026-04-08 16:08:39.731
11402650-9749-4110-967a-46b36d859d88	masha2026@gmail.com	$2a$10$N5OYGAvMGi6mt9RtxaOiVeMRYUxpvqYnVPP2l9vxpWKhB1/WBiVBe	masha	CLIENT	2026-04-08 16:37:00.105	2026-04-08 16:37:00.105
f24b6658-3d70-41a3-83b2-fab18ffa6059	apauguerra3@gmail.com	$2a$10$.b7BRW25YFeBKc8lJ7UdZ.g3YJSaMmEhrQVFnfzLaTZzwZXIfHCCG	Ana Paula Guerra Morales	TRAINER	2026-04-08 16:40:17.799	2026-04-08 16:40:17.799
68e8674b-d31a-49f4-900e-9c61ffc8130b	seta123@gmail.com	$2a$10$.X86IhzDCjll5myWIuQfHu2q/Ubc0iyAe1IXJebDHuZsOUA4qzGLm	Setayesh	CLIENT	2026-04-08 16:41:05.049	2026-04-08 17:00:38.283
f65a7fbe-d413-43a0-8cef-666bf32f94c3	santiagosba88@gmail.com	$2a$10$vc5Pno19mV3eGzjvkIZV4eDRK5CiwbRRw3XMnUNBjQvlybIzXegL2	Santy Benitez	TRAINER	2026-04-12 19:18:59.565	2026-04-13 00:25:35.1
c930b01d-244b-48ad-9afa-ed3e1caa3a98	felipito@gmail.com	$2a$10$Se8qxoGd7Z6ckoaL8TokTOD4Z3hqtCo0jIWRnFvf0tQmGHXafXS96	Felipe	CLIENT	2026-04-12 20:07:24.795	2026-04-13 00:45:18.981
368d6766-a771-4b67-a27e-b35f20206fbb	admin@coachos.com	$2a$10$eLPgbqTfLimHo4EBWD8ileRC6mmPEFjunltzNDGAPGoJmaxqEIy/O	Super_Admin	ADMIN	2026-04-12 23:29:16.946	2026-04-14 00:14:20.77
\.


--
-- Data for Name: Week; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."Week" (id, "weekNumber", "programId") FROM stdin;
1	1	93386fdc-ece8-49cf-9faf-214270445b72
2	2	93386fdc-ece8-49cf-9faf-214270445b72
3	3	93386fdc-ece8-49cf-9faf-214270445b72
4	4	93386fdc-ece8-49cf-9faf-214270445b72
5	1	fc84113d-7c37-4979-9506-ce84edc4df9e
6	2	fc84113d-7c37-4979-9506-ce84edc4df9e
7	3	fc84113d-7c37-4979-9506-ce84edc4df9e
8	4	fc84113d-7c37-4979-9506-ce84edc4df9e
\.


--
-- Data for Name: WorkoutLog; Type: TABLE DATA; Schema: public; Owner: coachos
--

COPY public."WorkoutLog" (id, date, notes, "clientId") FROM stdin;
2cedcb28-8fd9-4893-9cfb-bdb5bddfeb3f	2026-04-13 01:07:00.075	\N	3345de84-1ac9-4c3c-8d91-88731cab7806
77a4d7bb-9d78-4aec-8118-8744368a2072	2026-04-13 01:07:01.486	\N	3345de84-1ac9-4c3c-8d91-88731cab7806
a70cd4bf-3c3d-4f55-b51a-bc4b3e6430c0	2026-04-13 01:07:06.581	\N	3345de84-1ac9-4c3c-8d91-88731cab7806
834bf401-f958-4ffd-8488-53a4b967b7b8	2026-04-13 01:07:13.699	\N	3345de84-1ac9-4c3c-8d91-88731cab7806
\.


--
-- Name: DayExercise_id_seq; Type: SEQUENCE SET; Schema: public; Owner: coachos
--

SELECT pg_catalog.setval('public."DayExercise_id_seq"', 10, true);


--
-- Name: Day_id_seq; Type: SEQUENCE SET; Schema: public; Owner: coachos
--

SELECT pg_catalog.setval('public."Day_id_seq"', 32, true);


--
-- Name: LogSet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: coachos
--

SELECT pg_catalog.setval('public."LogSet_id_seq"', 24, true);


--
-- Name: ProgramTemplateDayExercise_id_seq; Type: SEQUENCE SET; Schema: public; Owner: coachos
--

SELECT pg_catalog.setval('public."ProgramTemplateDayExercise_id_seq"', 8, true);


--
-- Name: ProgramTemplateDay_id_seq; Type: SEQUENCE SET; Schema: public; Owner: coachos
--

SELECT pg_catalog.setval('public."ProgramTemplateDay_id_seq"', 9, true);


--
-- Name: ProgramTemplateWeek_id_seq; Type: SEQUENCE SET; Schema: public; Owner: coachos
--

SELECT pg_catalog.setval('public."ProgramTemplateWeek_id_seq"', 3, true);


--
-- Name: Week_id_seq; Type: SEQUENCE SET; Schema: public; Owner: coachos
--

SELECT pg_catalog.setval('public."Week_id_seq"', 8, true);


--
-- Name: Client Client_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_pkey" PRIMARY KEY (id);


--
-- Name: DayExercise DayExercise_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."DayExercise"
    ADD CONSTRAINT "DayExercise_pkey" PRIMARY KEY (id);


--
-- Name: Day Day_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Day"
    ADD CONSTRAINT "Day_pkey" PRIMARY KEY (id);


--
-- Name: Exercise Exercise_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Exercise"
    ADD CONSTRAINT "Exercise_pkey" PRIMARY KEY (id);


--
-- Name: LogSet LogSet_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."LogSet"
    ADD CONSTRAINT "LogSet_pkey" PRIMARY KEY (id);


--
-- Name: ProgramTemplateDayExercise ProgramTemplateDayExercise_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."ProgramTemplateDayExercise"
    ADD CONSTRAINT "ProgramTemplateDayExercise_pkey" PRIMARY KEY (id);


--
-- Name: ProgramTemplateDay ProgramTemplateDay_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."ProgramTemplateDay"
    ADD CONSTRAINT "ProgramTemplateDay_pkey" PRIMARY KEY (id);


--
-- Name: ProgramTemplateWeek ProgramTemplateWeek_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."ProgramTemplateWeek"
    ADD CONSTRAINT "ProgramTemplateWeek_pkey" PRIMARY KEY (id);


--
-- Name: ProgramTemplate ProgramTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."ProgramTemplate"
    ADD CONSTRAINT "ProgramTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Program Program_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Program"
    ADD CONSTRAINT "Program_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Week Week_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Week"
    ADD CONSTRAINT "Week_pkey" PRIMARY KEY (id);


--
-- Name: WorkoutLog WorkoutLog_pkey; Type: CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."WorkoutLog"
    ADD CONSTRAINT "WorkoutLog_pkey" PRIMARY KEY (id);


--
-- Name: Client_userId_key; Type: INDEX; Schema: public; Owner: coachos
--

CREATE UNIQUE INDEX "Client_userId_key" ON public."Client" USING btree ("userId");


--
-- Name: Exercise_name_key; Type: INDEX; Schema: public; Owner: coachos
--

CREATE UNIQUE INDEX "Exercise_name_key" ON public."Exercise" USING btree (name);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: coachos
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Client Client_trainerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Client Client_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DayExercise DayExercise_dayId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."DayExercise"
    ADD CONSTRAINT "DayExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES public."Day"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DayExercise DayExercise_exerciseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."DayExercise"
    ADD CONSTRAINT "DayExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES public."Exercise"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Day Day_weekId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Day"
    ADD CONSTRAINT "Day_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES public."Week"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LogSet LogSet_exerciseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."LogSet"
    ADD CONSTRAINT "LogSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES public."Exercise"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LogSet LogSet_workoutLogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."LogSet"
    ADD CONSTRAINT "LogSet_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES public."WorkoutLog"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProgramTemplateDayExercise ProgramTemplateDayExercise_dayId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."ProgramTemplateDayExercise"
    ADD CONSTRAINT "ProgramTemplateDayExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES public."ProgramTemplateDay"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProgramTemplateDayExercise ProgramTemplateDayExercise_exerciseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."ProgramTemplateDayExercise"
    ADD CONSTRAINT "ProgramTemplateDayExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES public."Exercise"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProgramTemplateDay ProgramTemplateDay_weekId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."ProgramTemplateDay"
    ADD CONSTRAINT "ProgramTemplateDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES public."ProgramTemplateWeek"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProgramTemplateWeek ProgramTemplateWeek_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."ProgramTemplateWeek"
    ADD CONSTRAINT "ProgramTemplateWeek_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."ProgramTemplate"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProgramTemplate ProgramTemplate_trainerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."ProgramTemplate"
    ADD CONSTRAINT "ProgramTemplate_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Program Program_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Program"
    ADD CONSTRAINT "Program_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Week Week_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."Week"
    ADD CONSTRAINT "Week_programId_fkey" FOREIGN KEY ("programId") REFERENCES public."Program"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WorkoutLog WorkoutLog_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: coachos
--

ALTER TABLE ONLY public."WorkoutLog"
    ADD CONSTRAINT "WorkoutLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict T3MLZa7ZxaN0HRub7fbR49XlC9CRsNwIRMt00o2QOeT7xXF4M6UHDnKJadrvsZV

