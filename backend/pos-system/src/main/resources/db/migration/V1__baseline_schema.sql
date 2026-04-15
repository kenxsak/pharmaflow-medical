--
-- PostgreSQL database dump
--


-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

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

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    log_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id character varying(100),
    old_value jsonb,
    new_value jsonb,
    ip_address character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: branch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branch (
    branch_id bigint NOT NULL,
    branch_address character varying(100) NOT NULL,
    branch_contact character varying(12),
    branch_created_by character varying(255),
    branch_created_on character varying(255),
    branch_description character varying(100),
    branch_email character varying(50),
    branch_fax character varying(12),
    branch_image oid,
    branch_location character varying(100),
    branch_name character varying(20) NOT NULL,
    branch_profile_image_url character varying(255),
    branch_status boolean DEFAULT false
);


--
-- Name: branch_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branch_item (
    branch_id bigint NOT NULL,
    item_id bigint NOT NULL
);


--
-- Name: credit_note_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_note_items (
    cn_item_id uuid NOT NULL,
    mrp numeric(10,2) NOT NULL,
    quantity numeric(10,3) NOT NULL,
    reason character varying(200),
    batch_id uuid,
    cn_id uuid,
    medicine_id uuid
);


--
-- Name: credit_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_notes (
    cn_id uuid NOT NULL,
    closed_at timestamp without time zone,
    cn_number character varying(50) NOT NULL,
    cn_type character varying(20),
    created_at timestamp without time zone,
    notes character varying(255),
    status character varying(20),
    supplier_id uuid,
    total_amount numeric(12,2) NOT NULL,
    created_by uuid,
    original_invoice_id uuid,
    store_id uuid
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    customer_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    name character varying(200) NOT NULL,
    phone character varying(15),
    email character varying(200),
    address text,
    doctor_name character varying(200),
    credit_limit numeric(10,2) DEFAULT 0,
    current_balance numeric(10,2) DEFAULT 0,
    loyalty_points integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    is_blocked boolean
);


--
-- Name: delivery_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_orders (
    delivery_id uuid NOT NULL,
    amount_collected numeric(12,2),
    amount_to_collect numeric(12,2),
    assigned_at timestamp without time zone,
    created_at timestamp without time zone,
    delivered_at timestamp without time zone,
    delivery_address character varying(255) NOT NULL,
    delivery_phone character varying(15),
    notes character varying(255),
    payment_mode character varying(20),
    status character varying(20),
    customer_id uuid,
    delivery_boy_id uuid,
    invoice_id uuid,
    store_id uuid
);


--
-- Name: employer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employer (
    employer_id bigint NOT NULL,
    employer_date_of_birth date,
    employer_address character varying(100),
    employer_email character varying(50),
    employer_first_name character varying(50) NOT NULL,
    employer_last_name character varying(50),
    employer_nic character varying(12) NOT NULL,
    employer_nic_name character varying(50),
    employer_password character varying(255) NOT NULL,
    employer_phone character varying(12),
    employer_sallary double precision,
    gender character varying(10) NOT NULL,
    is_active boolean DEFAULT false,
    pin integer,
    profile_image oid,
    profile_image_url character varying(255),
    role character varying(15) NOT NULL,
    brach_id bigint NOT NULL,
    employer_bank_details_id bigint
);


--
-- Name: employer_bankdetails; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employer_bankdetails (
    employer_bank_details_id bigint NOT NULL,
    bank_account_number character varying(255),
    bank_branch_name character varying(255),
    bank_name character varying(255),
    employer_description character varying(255),
    employeer_id bigint,
    cashier_monthly_payment double precision,
    payment_status boolean
);


--
-- Name: employer_bankdetails_employer_bank_details_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employer_bankdetails_employer_bank_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employer_bankdetails_employer_bank_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employer_bankdetails_employer_bank_details_id_seq OWNED BY public.employer_bankdetails.employer_bank_details_id;


--
-- Name: hibernate_sequence; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_batches (
    batch_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    medicine_id uuid,
    batch_number character varying(100) NOT NULL,
    manufacture_date date,
    expiry_date date NOT NULL,
    quantity_strips integer DEFAULT 0 NOT NULL,
    quantity_loose integer DEFAULT 0 NOT NULL,
    purchase_rate numeric(10,2) NOT NULL,
    mrp numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: medicines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicines (
    medicine_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    brand_name character varying(300) NOT NULL,
    generic_name character varying(300),
    salt_id uuid,
    manufacturer_id uuid,
    medicine_form character varying(50),
    strength character varying(100),
    pack_size integer DEFAULT 10,
    barcode character varying(100),
    hsn_code character varying(20),
    gst_rate numeric(5,2) DEFAULT 12,
    mrp numeric(10,2) NOT NULL,
    ptr numeric(10,2),
    pts numeric(10,2),
    schedule_type character varying(20),
    is_narcotic boolean DEFAULT false,
    is_psychotropic boolean DEFAULT false,
    requires_rx boolean DEFAULT false,
    reorder_level integer DEFAULT 10,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    catalog_source character varying(50),
    composition_summary text,
    external_product_id character varying(100),
    pack_size_label character varying(200),
    search_keywords text
);


--
-- Name: inventory_fifo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.inventory_fifo AS
 SELECT ib.batch_id,
    ib.store_id,
    ib.medicine_id,
    ib.batch_number,
    ib.manufacture_date,
    ib.expiry_date,
    ib.quantity_strips,
    ib.quantity_loose,
    ib.purchase_rate,
    ib.mrp,
    ib.is_active,
    ib.created_at,
    m.brand_name,
    m.generic_name,
    m.schedule_type,
    m.gst_rate,
        CASE
            WHEN (ib.expiry_date <= CURRENT_DATE) THEN 'EXPIRED'::text
            WHEN (ib.expiry_date <= (CURRENT_DATE + '30 days'::interval)) THEN 'EXPIRY_30'::text
            WHEN (ib.expiry_date <= (CURRENT_DATE + '60 days'::interval)) THEN 'EXPIRY_60'::text
            WHEN (ib.expiry_date <= (CURRENT_DATE + '90 days'::interval)) THEN 'EXPIRY_90'::text
            ELSE 'OK'::text
        END AS expiry_status
   FROM (public.inventory_batches ib
     JOIN public.medicines m ON ((ib.medicine_id = m.medicine_id)))
  WHERE (ib.is_active = true)
  ORDER BY ib.expiry_date;


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    item_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid,
    medicine_id uuid,
    batch_id uuid,
    quantity numeric(10,3) NOT NULL,
    unit_type character varying(20) DEFAULT 'STRIP'::character varying,
    mrp numeric(10,2) NOT NULL,
    discount_pct numeric(5,2) DEFAULT 0,
    taxable_amount numeric(12,2) NOT NULL,
    gst_rate numeric(5,2) NOT NULL,
    cgst numeric(10,2) DEFAULT 0,
    sgst numeric(10,2) DEFAULT 0,
    igst numeric(10,2) DEFAULT 0,
    total numeric(12,2) NOT NULL,
    batch_number_snapshot character varying(100),
    expiry_date_snapshot date,
    generic_name_snapshot character varying(300),
    hsn_code_snapshot character varying(20),
    manufacturer_name_snapshot character varying(300),
    medicine_name_snapshot character varying(300),
    pack_size_snapshot integer,
    purchase_rate_snapshot numeric(10,2),
    schedule_type_snapshot character varying(20)
);


--
-- Name: invoice_sequence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_sequence (
    financial_year character varying(10) NOT NULL,
    store_id uuid NOT NULL,
    last_number integer
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    invoice_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_no character varying(50) NOT NULL,
    store_id uuid,
    customer_id uuid,
    billed_by uuid,
    invoice_date timestamp without time zone DEFAULT now(),
    invoice_type character varying(20) DEFAULT 'SALE'::character varying,
    subtotal numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0,
    taxable_amount numeric(12,2) NOT NULL,
    cgst_amount numeric(12,2) DEFAULT 0,
    sgst_amount numeric(12,2) DEFAULT 0,
    igst_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2) NOT NULL,
    payment_mode character varying(20),
    amount_paid numeric(12,2) DEFAULT 0,
    amount_due numeric(12,2) DEFAULT 0,
    prescription_attached boolean DEFAULT false,
    prescription_url text,
    doctor_name character varying(200),
    is_cancelled boolean DEFAULT false,
    cancel_reason text,
    created_at timestamp without time zone DEFAULT now(),
    round_off numeric(5,2),
    cancelled_by uuid
);


--
-- Name: item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item (
    item_id bigint NOT NULL,
    branch_id bigint,
    date_created timestamp without time zone,
    discounted_percentage double precision,
    discounted_price double precision,
    expire_date timestamp without time zone,
    is_discounted boolean DEFAULT false,
    is_free_issued boolean DEFAULT false,
    is_special_condition boolean DEFAULT false,
    item_barcode character varying(20) NOT NULL,
    item_description character varying(100),
    item_image character varying(255),
    item_manufacture character varying(100),
    item_name character varying(100) NOT NULL,
    item_quantity double precision NOT NULL,
    last_updated_date timestamp without time zone,
    manufacture_date timestamp without time zone,
    measuring_unit_type character varying(20),
    purchase_date timestamp without time zone,
    rack_number character varying(20),
    selling_price double precision NOT NULL,
    is_stock boolean DEFAULT false,
    supplier_price double precision NOT NULL,
    supply_date timestamp without time zone,
    warehouse_name character varying(100),
    warranty_period character varying(255),
    category_id bigint NOT NULL,
    supplier_id bigint NOT NULL
);


--
-- Name: item_category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_category (
    category_id bigint NOT NULL,
    category_description character varying(100),
    category_image character varying(255),
    category_name character varying(100) NOT NULL
);


--
-- Name: item_category_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_category_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_category_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_category_category_id_seq OWNED BY public.item_category.category_id;


--
-- Name: loyalty_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_transactions (
    txn_id uuid NOT NULL,
    balance_after integer NOT NULL,
    created_at timestamp without time zone,
    description character varying(200),
    invoice_id uuid,
    points_earned integer,
    points_redeemed integer,
    customer_id uuid,
    store_id uuid
);


--
-- Name: manufacturers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.manufacturers (
    manufacturer_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    short_code character varying(20),
    address text,
    gstin character varying(20),
    is_active boolean DEFAULT true
);


--
-- Name: medicine_substitutes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicine_substitutes (
    id integer NOT NULL,
    medicine_id uuid,
    substitute_id uuid,
    is_generic boolean DEFAULT false,
    price_diff_pct numeric(5,2),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: medicine_substitutes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.medicine_substitutes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: medicine_substitutes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.medicine_substitutes_id_seq OWNED BY public.medicine_substitutes.id;


--
-- Name: order_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_details (
    order_details_id integer NOT NULL,
    amount double precision NOT NULL,
    name character varying(100) NOT NULL,
    item_id bigint NOT NULL,
    order_id bigint NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    order_id bigint NOT NULL,
    branch_id bigint NOT NULL,
    order_date timestamp without time zone,
    total double precision NOT NULL,
    employer_id bigint NOT NULL
);


--
-- Name: patient_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_history (
    history_id uuid NOT NULL,
    created_at timestamp without time zone,
    doctor_name character varying(200),
    doctor_reg_no character varying(50),
    invoice_id uuid,
    notes character varying(255),
    prescription_url character varying(255),
    quantity numeric(10,3),
    customer_id uuid,
    medicine_id uuid
);


--
-- Name: payment_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_details (
    payment_id bigint NOT NULL,
    paid_amount double precision,
    payment_amount double precision,
    payment_date timestamp without time zone,
    payment_discount double precision,
    payment_method character varying(255),
    payment_notes character varying(255),
    order_id bigint NOT NULL
);


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_order_items (
    po_item_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    po_id uuid,
    medicine_id uuid,
    batch_number character varying(100) NOT NULL,
    expiry_date date NOT NULL,
    quantity integer NOT NULL,
    free_qty integer DEFAULT 0,
    purchase_rate numeric(10,2) NOT NULL,
    mrp numeric(10,2) NOT NULL,
    gst_rate numeric(5,2),
    free_qty_loose integer,
    quantity_loose integer
);


--
-- Name: purchase_order_plan_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_order_plan_lines (
    po_plan_line_id uuid NOT NULL,
    gst_rate numeric(5,2),
    line_status character varying(20),
    medicine_form character varying(60),
    mrp numeric(10,2),
    notes character varying(500),
    pack_size integer,
    pack_size_label character varying(255),
    purchase_rate numeric(10,2),
    quantity integer,
    quantity_loose integer,
    medicine_id uuid,
    po_id uuid
);


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    po_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    supplier_id uuid,
    po_number character varying(50) NOT NULL,
    po_date timestamp without time zone DEFAULT now(),
    invoice_number character varying(100),
    subtotal numeric(12,2),
    cgst_amount numeric(12,2) DEFAULT 0,
    sgst_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2),
    status character varying(20) DEFAULT 'PENDING'::character varying,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    expected_delivery_date date,
    notes character varying(1000),
    order_type character varying(30),
    received_at timestamp without time zone,
    supplier_reference character varying(100)
);


--
-- Name: purchase_schemes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_schemes (
    scheme_id uuid NOT NULL,
    buy_qty integer NOT NULL,
    created_at timestamp without time zone,
    free_qty integer NOT NULL,
    is_active boolean,
    valid_from date,
    valid_to date,
    medicine_id uuid,
    supplier_id uuid
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    description text,
    can_edit_bills boolean,
    can_edit_price boolean,
    can_manage_inventory boolean,
    can_sell_schedule_h boolean,
    can_view_reports boolean
);


--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- Name: salt_compositions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salt_compositions (
    salt_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    salt_name character varying(300) NOT NULL,
    generic_name character varying(300),
    drug_class character varying(200),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: schedule_drug_register; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_drug_register (
    register_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    invoice_id uuid,
    medicine_id uuid,
    schedule_type character varying(20) NOT NULL,
    sale_date timestamp without time zone DEFAULT now(),
    patient_name character varying(200) NOT NULL,
    patient_age integer,
    patient_address text,
    doctor_name character varying(200) NOT NULL,
    doctor_reg_no character varying(50),
    quantity_sold numeric(10,3) NOT NULL,
    batch_number character varying(100),
    pharmacist_id uuid,
    prescription_url text,
    remarks text,
    patient_gender character varying(10)
);


--
-- Name: stock_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_transfers (
    transfer_id uuid NOT NULL,
    completed_at timestamp without time zone,
    created_at timestamp without time zone,
    quantity_loose integer,
    quantity_strips integer NOT NULL,
    status character varying(20),
    approved_by uuid,
    batch_id uuid,
    from_store_id uuid,
    medicine_id uuid,
    requested_by uuid,
    to_store_id uuid,
    approved_at timestamp without time zone,
    dispatched_at timestamp without time zone,
    received_by uuid
);


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    store_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_code character varying(20) NOT NULL,
    store_name character varying(200) NOT NULL,
    store_type character varying(20) NOT NULL,
    address text,
    city character varying(100),
    state character varying(100) DEFAULT 'Tamil Nadu'::character varying,
    pincode character varying(10),
    phone character varying(15),
    email character varying(200),
    gstin character varying(20),
    drug_license_no character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    is_24hr boolean,
    license_expiry date,
    tenant_id uuid
);


--
-- Name: subscription_plan_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plan_features (
    plan_id uuid NOT NULL,
    feature_code character varying(80) NOT NULL
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    plan_id uuid NOT NULL,
    annual_price_inr numeric(12,2),
    best_for character varying(300),
    created_at timestamp without time zone,
    description character varying(500),
    is_active boolean,
    max_stores integer,
    max_users integer,
    monthly_price_inr numeric(12,2),
    name character varying(120) NOT NULL,
    onboarding_fee_inr numeric(12,2),
    per_store_overage_inr numeric(12,2),
    per_user_overage_inr numeric(12,2),
    plan_code character varying(50) NOT NULL,
    support_tier character varying(30) NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: supplier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier (
    supplier_id bigint NOT NULL,
    created_at timestamp without time zone,
    created_by character varying(255),
    updated_at timestamp without time zone,
    updated_by character varying(255),
    supplier_address character varying(100),
    supplier_description character varying(100),
    supplier_email character varying(50),
    supplier_image character varying(255),
    supplier_name character varying(100),
    supplier_phone character varying(12),
    supplier_rating character varying(255),
    company_id bigint
);


--
-- Name: supplier_company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_company (
    company_id bigint NOT NULL,
    created_at timestamp without time zone,
    created_by character varying(255),
    updated_at timestamp without time zone,
    updated_by character varying(255),
    company_account_number character varying(255),
    company_address character varying(100),
    company_bank character varying(255),
    company_contact character varying(12),
    company_description character varying(255),
    company_email character varying(50),
    company_name character varying(100),
    company_status character varying(255),
    company_image character varying(255)
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    supplier_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    contact character varying(200),
    phone character varying(15),
    email character varying(200),
    gstin character varying(20),
    drug_license character varying(50),
    address text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone,
    default_lead_time_days integer
);


--
-- Name: tenant_feature_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_feature_overrides (
    override_id uuid NOT NULL,
    created_at timestamp without time zone,
    enabled boolean NOT NULL,
    feature_code character varying(80) NOT NULL,
    override_reason character varying(400),
    updated_at timestamp without time zone,
    tenant_id uuid NOT NULL
);


--
-- Name: tenant_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_subscriptions (
    subscription_id uuid NOT NULL,
    annual_contract_value_inr numeric(12,2),
    auto_renew boolean,
    billing_cycle character varying(20) NOT NULL,
    created_at timestamp without time zone,
    monthly_recurring_revenue_inr numeric(12,2),
    notes character varying(255),
    overage_store_price_inr numeric(12,2),
    overage_user_price_inr numeric(12,2),
    renewal_date date,
    start_date date,
    status character varying(20) NOT NULL,
    stores_included integer,
    trial_ends_on date,
    updated_at timestamp without time zone,
    users_included integer,
    plan_id uuid NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    tenant_id uuid NOT NULL,
    billing_email character varying(200),
    brand_name character varying(200) NOT NULL,
    brand_tagline character varying(300),
    created_at timestamp without time zone,
    deployment_mode character varying(200),
    gstin character varying(20),
    is_active boolean,
    legal_name character varying(200),
    licensed_store_count integer,
    licensed_user_count integer,
    notes character varying(255),
    slug character varying(80) NOT NULL,
    status character varying(30) NOT NULL,
    support_email character varying(200),
    support_phone character varying(30),
    tenant_code character varying(50) NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(200) NOT NULL,
    phone character varying(15),
    email character varying(200),
    role_id integer,
    pharmacist_reg_no character varying(50),
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    is_platform_owner boolean,
    tenant_id uuid
);


--
-- Name: employer_bankdetails employer_bank_details_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employer_bankdetails ALTER COLUMN employer_bank_details_id SET DEFAULT nextval('public.employer_bankdetails_employer_bank_details_id_seq'::regclass);


--
-- Name: item_category category_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_category ALTER COLUMN category_id SET DEFAULT nextval('public.item_category_category_id_seq'::regclass);


--
-- Name: medicine_substitutes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicine_substitutes ALTER COLUMN id SET DEFAULT nextval('public.medicine_substitutes_id_seq'::regclass);


--
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (log_id);


--
-- Name: branch_item branch_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_item
    ADD CONSTRAINT branch_item_pkey PRIMARY KEY (branch_id, item_id);


--
-- Name: branch branch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch
    ADD CONSTRAINT branch_pkey PRIMARY KEY (branch_id);


--
-- Name: credit_note_items credit_note_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note_items
    ADD CONSTRAINT credit_note_items_pkey PRIMARY KEY (cn_item_id);


--
-- Name: credit_notes credit_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT credit_notes_pkey PRIMARY KEY (cn_id);


--
-- Name: customers customers_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_phone_key UNIQUE (phone);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);


--
-- Name: delivery_orders delivery_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_orders
    ADD CONSTRAINT delivery_orders_pkey PRIMARY KEY (delivery_id);


--
-- Name: employer_bankdetails employer_bankdetails_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employer_bankdetails
    ADD CONSTRAINT employer_bankdetails_pkey PRIMARY KEY (employer_bank_details_id);


--
-- Name: employer employer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employer
    ADD CONSTRAINT employer_pkey PRIMARY KEY (employer_id);


--
-- Name: inventory_batches inventory_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_batches
    ADD CONSTRAINT inventory_batches_pkey PRIMARY KEY (batch_id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (item_id);


--
-- Name: invoice_sequence invoice_sequence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_sequence
    ADD CONSTRAINT invoice_sequence_pkey PRIMARY KEY (financial_year, store_id);


--
-- Name: invoices invoices_invoice_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_no_key UNIQUE (invoice_no);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (invoice_id);


--
-- Name: item_category item_category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_category
    ADD CONSTRAINT item_category_pkey PRIMARY KEY (category_id);


--
-- Name: item item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item
    ADD CONSTRAINT item_pkey PRIMARY KEY (item_id);


--
-- Name: loyalty_transactions loyalty_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (txn_id);


--
-- Name: manufacturers manufacturers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.manufacturers
    ADD CONSTRAINT manufacturers_pkey PRIMARY KEY (manufacturer_id);


--
-- Name: medicine_substitutes medicine_substitutes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicine_substitutes
    ADD CONSTRAINT medicine_substitutes_pkey PRIMARY KEY (id);


--
-- Name: medicines medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_pkey PRIMARY KEY (medicine_id);


--
-- Name: order_details order_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT order_details_pkey PRIMARY KEY (order_details_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: patient_history patient_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_history
    ADD CONSTRAINT patient_history_pkey PRIMARY KEY (history_id);


--
-- Name: payment_details payment_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_details
    ADD CONSTRAINT payment_details_pkey PRIMARY KEY (payment_id);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (po_item_id);


--
-- Name: purchase_order_plan_lines purchase_order_plan_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_plan_lines
    ADD CONSTRAINT purchase_order_plan_lines_pkey PRIMARY KEY (po_plan_line_id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (po_id);


--
-- Name: purchase_orders purchase_orders_po_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number);


--
-- Name: purchase_schemes purchase_schemes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_schemes
    ADD CONSTRAINT purchase_schemes_pkey PRIMARY KEY (scheme_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- Name: salt_compositions salt_compositions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salt_compositions
    ADD CONSTRAINT salt_compositions_pkey PRIMARY KEY (salt_id);


--
-- Name: schedule_drug_register schedule_drug_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_drug_register
    ADD CONSTRAINT schedule_drug_register_pkey PRIMARY KEY (register_id);


--
-- Name: stock_transfers stock_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT stock_transfers_pkey PRIMARY KEY (transfer_id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (store_id);


--
-- Name: stores stores_store_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_store_code_key UNIQUE (store_code);


--
-- Name: subscription_plan_features subscription_plan_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plan_features
    ADD CONSTRAINT subscription_plan_features_pkey PRIMARY KEY (plan_id, feature_code);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (plan_id);


--
-- Name: supplier_company supplier_company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_company
    ADD CONSTRAINT supplier_company_pkey PRIMARY KEY (company_id);


--
-- Name: supplier supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier
    ADD CONSTRAINT supplier_pkey PRIMARY KEY (supplier_id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (supplier_id);


--
-- Name: tenant_feature_overrides tenant_feature_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_feature_overrides
    ADD CONSTRAINT tenant_feature_overrides_pkey PRIMARY KEY (override_id);


--
-- Name: tenant_subscriptions tenant_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT tenant_subscriptions_pkey PRIMARY KEY (subscription_id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (tenant_id);


--
-- Name: employer uk_fkokx2ge291s0fgeij3jj5hrx; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employer
    ADD CONSTRAINT uk_fkokx2ge291s0fgeij3jj5hrx UNIQUE (employer_email);


--
-- Name: credit_notes uk_jx22htwd1w3koso5724vqqa3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT uk_jx22htwd1w3koso5724vqqa3 UNIQUE (cn_number);


--
-- Name: tenants uk_kn82rs0p55luybrg4n7x7di8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT uk_kn82rs0p55luybrg4n7x7di8 UNIQUE (slug);


--
-- Name: tenants uk_r2h4deuvsyct6en1d7av037c7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT uk_r2h4deuvsyct6en1d7av037c7 UNIQUE (tenant_code);


--
-- Name: subscription_plans uk_rsiqsy651mlytqpby2qlh7orb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT uk_rsiqsy651mlytqpby2qlh7orb UNIQUE (plan_code);


--
-- Name: tenant_feature_overrides uk_tenant_feature_override; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_feature_overrides
    ADD CONSTRAINT uk_tenant_feature_override UNIQUE (tenant_id, feature_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_medicines_catalog_external; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medicines_catalog_external ON public.medicines USING btree (catalog_source, external_product_id);


--
-- Name: idx_medicines_salt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medicines_salt ON public.medicines USING btree (salt_id);


--
-- Name: idx_medicines_search_keywords_fts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medicines_search_keywords_fts ON public.medicines USING gin (to_tsvector('english'::regconfig, COALESCE(search_keywords, ''::text)));


--
-- Name: uq_medicine_substitute_pair; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_medicine_substitute_pair ON public.medicine_substitutes USING btree (medicine_id, substitute_id);


--
-- Name: uq_medicines_catalog_external; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_medicines_catalog_external ON public.medicines USING btree (catalog_source, external_product_id) WHERE (external_product_id IS NOT NULL);


--
-- Name: audit_log audit_log_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: customers customers_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- Name: item fk1rysna9so6qhvewuv59vest5f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item
    ADD CONSTRAINT fk1rysna9so6qhvewuv59vest5f FOREIGN KEY (category_id) REFERENCES public.item_category(category_id);


--
-- Name: users fk21hn1a5ja1tve7ae02fnn4cld; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk21hn1a5ja1tve7ae02fnn4cld FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id);


--
-- Name: branch_item fk2vcyplni0ccwk4b0xte9l0727; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_item
    ADD CONSTRAINT fk2vcyplni0ccwk4b0xte9l0727 FOREIGN KEY (item_id) REFERENCES public.item(item_id);


--
-- Name: payment_details fk34yjcjptgtt05syk6x0t8s35b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_details
    ADD CONSTRAINT fk34yjcjptgtt05syk6x0t8s35b FOREIGN KEY (order_id) REFERENCES public.orders(order_id);


--
-- Name: stock_transfers fk36sb6imenkwgb42v2vj0mj80h; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT fk36sb6imenkwgb42v2vj0mj80h FOREIGN KEY (received_by) REFERENCES public.users(user_id);


--
-- Name: supplier fk4xppoa5x686apqupj6f87a4ov; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier
    ADD CONSTRAINT fk4xppoa5x686apqupj6f87a4ov FOREIGN KEY (company_id) REFERENCES public.supplier_company(company_id);


--
-- Name: stock_transfers fk527lola1di9agep9no32mnm2n; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT fk527lola1di9agep9no32mnm2n FOREIGN KEY (batch_id) REFERENCES public.inventory_batches(batch_id);


--
-- Name: credit_notes fk58x17cqfhjkiso3p20s49tgov; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT fk58x17cqfhjkiso3p20s49tgov FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: credit_notes fk5nnlou3dr90niqk3y7c8d34rf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT fk5nnlou3dr90niqk3y7c8d34rf FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- Name: stores fk65h4k3l4nvuq9288mm6ui8sot; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT fk65h4k3l4nvuq9288mm6ui8sot FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id);


--
-- Name: credit_note_items fk69ftmerijd5juq8hkitrb4caf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note_items
    ADD CONSTRAINT fk69ftmerijd5juq8hkitrb4caf FOREIGN KEY (batch_id) REFERENCES public.inventory_batches(batch_id);


--
-- Name: invoices fk7a2yw2vpyh85hwyctpui694qx; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT fk7a2yw2vpyh85hwyctpui694qx FOREIGN KEY (cancelled_by) REFERENCES public.users(user_id);


--
-- Name: order_details fk7nax0e2omxncw5gjo2hu65rip; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT fk7nax0e2omxncw5gjo2hu65rip FOREIGN KEY (item_id) REFERENCES public.item(item_id);


--
-- Name: orders fk80na4o2lg87jkic5q11okqfv9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fk80na4o2lg87jkic5q11okqfv9 FOREIGN KEY (employer_id) REFERENCES public.employer(employer_id);


--
-- Name: branch_item fk9ctfcags2nh1ka0cedlyu25nn; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_item
    ADD CONSTRAINT fk9ctfcags2nh1ka0cedlyu25nn FOREIGN KEY (branch_id) REFERENCES public.branch(branch_id);


--
-- Name: credit_note_items fk9mom4m7bvbcc3iiq2f0ts1c0n; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note_items
    ADD CONSTRAINT fk9mom4m7bvbcc3iiq2f0ts1c0n FOREIGN KEY (cn_id) REFERENCES public.credit_notes(cn_id);


--
-- Name: purchase_order_plan_lines fka8kby5qwfxxqvqwvhie2nw3xy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_plan_lines
    ADD CONSTRAINT fka8kby5qwfxxqvqwvhie2nw3xy FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id);


--
-- Name: loyalty_transactions fkb7utjki3f8ffma2ko9tj75itg; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT fkb7utjki3f8ffma2ko9tj75itg FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- Name: purchase_schemes fkbgc7klq6t5egvvex06dvpprh7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_schemes
    ADD CONSTRAINT fkbgc7klq6t5egvvex06dvpprh7 FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id);


--
-- Name: stock_transfers fkbib8j4x3mqrc9kb7kc76c0nyq; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT fkbib8j4x3mqrc9kb7kc76c0nyq FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id);


--
-- Name: tenant_subscriptions fkbpmvmu3al4jtfo7sldlc5k4rh; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT fkbpmvmu3al4jtfo7sldlc5k4rh FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id);


--
-- Name: subscription_plan_features fkc6lqgpqagbm2w7hghiokkcsgw; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plan_features
    ADD CONSTRAINT fkc6lqgpqagbm2w7hghiokkcsgw FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(plan_id);


--
-- Name: item fkcjes46ncuefgrkgt6ib0oo2bb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item
    ADD CONSTRAINT fkcjes46ncuefgrkgt6ib0oo2bb FOREIGN KEY (supplier_id) REFERENCES public.supplier(supplier_id);


--
-- Name: purchase_schemes fkd0gsiambhbvh69v0hxm86bbks; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_schemes
    ADD CONSTRAINT fkd0gsiambhbvh69v0hxm86bbks FOREIGN KEY (supplier_id) REFERENCES public.suppliers(supplier_id);


--
-- Name: delivery_orders fkdl6a668e47gmesad6b73pa4fm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_orders
    ADD CONSTRAINT fkdl6a668e47gmesad6b73pa4fm FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- Name: delivery_orders fkey7b8xrat59npjxrl5dytr1j5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_orders
    ADD CONSTRAINT fkey7b8xrat59npjxrl5dytr1j5 FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: stock_transfers fkfxtjn7rcfoxwnh3w0s9o854ok; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT fkfxtjn7rcfoxwnh3w0s9o854ok FOREIGN KEY (to_store_id) REFERENCES public.stores(store_id);


--
-- Name: stock_transfers fkg37jcqp9txfqtyod96gsvoyv; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT fkg37jcqp9txfqtyod96gsvoyv FOREIGN KEY (requested_by) REFERENCES public.users(user_id);


--
-- Name: loyalty_transactions fkgjaecj4l1n9mkh4k0r2q15v0k; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT fkgjaecj4l1n9mkh4k0r2q15v0k FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: tenant_feature_overrides fkh0thv5elegxgnk8k5utw54jok; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_feature_overrides
    ADD CONSTRAINT fkh0thv5elegxgnk8k5utw54jok FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id);


--
-- Name: employer fkhcwif40g8loacu6celn8e8l5n; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employer
    ADD CONSTRAINT fkhcwif40g8loacu6celn8e8l5n FOREIGN KEY (brach_id) REFERENCES public.branch(branch_id);


--
-- Name: stock_transfers fkhie1nkgu03ig472r1fwa9svw2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT fkhie1nkgu03ig472r1fwa9svw2 FOREIGN KEY (from_store_id) REFERENCES public.stores(store_id);


--
-- Name: credit_note_items fkieswxcs2w898mw482uenhsvjm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_note_items
    ADD CONSTRAINT fkieswxcs2w898mw482uenhsvjm FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id);


--
-- Name: employer fkif5ku88wg42y3eqhllnyvkk9f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employer
    ADD CONSTRAINT fkif5ku88wg42y3eqhllnyvkk9f FOREIGN KEY (employer_bank_details_id) REFERENCES public.employer_bankdetails(employer_bank_details_id);


--
-- Name: delivery_orders fkiv5nk3ptdaovp6i6hsc0slhno; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_orders
    ADD CONSTRAINT fkiv5nk3ptdaovp6i6hsc0slhno FOREIGN KEY (delivery_boy_id) REFERENCES public.users(user_id);


--
-- Name: tenant_subscriptions fkjbnjgdiut5qagvnywhrcy8le9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_subscriptions
    ADD CONSTRAINT fkjbnjgdiut5qagvnywhrcy8le9 FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(plan_id);


--
-- Name: order_details fkjyu2qbqt8gnvno9oe9j2s2ldk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_details
    ADD CONSTRAINT fkjyu2qbqt8gnvno9oe9j2s2ldk FOREIGN KEY (order_id) REFERENCES public.orders(order_id);


--
-- Name: patient_history fkl07s7fa8bc7wr0arwgj1oqi8x; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_history
    ADD CONSTRAINT fkl07s7fa8bc7wr0arwgj1oqi8x FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: credit_notes fklqb5oyi8d9397r4cs0llovwxn; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_notes
    ADD CONSTRAINT fklqb5oyi8d9397r4cs0llovwxn FOREIGN KEY (original_invoice_id) REFERENCES public.invoices(invoice_id);


--
-- Name: patient_history fkrh9jthmgq1rw6p3tjekr11kls; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_history
    ADD CONSTRAINT fkrh9jthmgq1rw6p3tjekr11kls FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id);


--
-- Name: delivery_orders fkrl75sfsxjjpbrqwscqjo8m0g; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_orders
    ADD CONSTRAINT fkrl75sfsxjjpbrqwscqjo8m0g FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);


--
-- Name: purchase_order_plan_lines fkrt1py4bf483jmw8vwh5o5990x; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_plan_lines
    ADD CONSTRAINT fkrt1py4bf483jmw8vwh5o5990x FOREIGN KEY (po_id) REFERENCES public.purchase_orders(po_id);


--
-- Name: stock_transfers fksen1o9c266kvgsm2ucb70m2i0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_transfers
    ADD CONSTRAINT fksen1o9c266kvgsm2ucb70m2i0 FOREIGN KEY (approved_by) REFERENCES public.users(user_id);


--
-- Name: invoice_sequence fksu0tfxlwn6i9o8afifwotqv3y; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_sequence
    ADD CONSTRAINT fksu0tfxlwn6i9o8afifwotqv3y FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- Name: inventory_batches inventory_batches_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_batches
    ADD CONSTRAINT inventory_batches_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id);


--
-- Name: inventory_batches inventory_batches_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_batches
    ADD CONSTRAINT inventory_batches_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- Name: invoice_items invoice_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.inventory_batches(batch_id);


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);


--
-- Name: invoice_items invoice_items_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id);


--
-- Name: invoices invoices_billed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_billed_by_fkey FOREIGN KEY (billed_by) REFERENCES public.users(user_id);


--
-- Name: invoices invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: invoices invoices_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- Name: medicine_substitutes medicine_substitutes_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicine_substitutes
    ADD CONSTRAINT medicine_substitutes_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id);


--
-- Name: medicine_substitutes medicine_substitutes_substitute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicine_substitutes
    ADD CONSTRAINT medicine_substitutes_substitute_id_fkey FOREIGN KEY (substitute_id) REFERENCES public.medicines(medicine_id);


--
-- Name: medicines medicines_manufacturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(manufacturer_id);


--
-- Name: medicines medicines_salt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicines
    ADD CONSTRAINT medicines_salt_id_fkey FOREIGN KEY (salt_id) REFERENCES public.salt_compositions(salt_id);


--
-- Name: purchase_order_items purchase_order_items_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id);


--
-- Name: purchase_order_items purchase_order_items_po_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(po_id);


--
-- Name: purchase_orders purchase_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: purchase_orders purchase_orders_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(supplier_id);


--
-- Name: schedule_drug_register schedule_drug_register_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_drug_register
    ADD CONSTRAINT schedule_drug_register_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);


--
-- Name: schedule_drug_register schedule_drug_register_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_drug_register
    ADD CONSTRAINT schedule_drug_register_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(medicine_id);


--
-- Name: schedule_drug_register schedule_drug_register_pharmacist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_drug_register
    ADD CONSTRAINT schedule_drug_register_pharmacist_id_fkey FOREIGN KEY (pharmacist_id) REFERENCES public.users(user_id);


--
-- Name: schedule_drug_register schedule_drug_register_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_drug_register
    ADD CONSTRAINT schedule_drug_register_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


--
-- Name: users users_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- PostgreSQL database dump complete
--


