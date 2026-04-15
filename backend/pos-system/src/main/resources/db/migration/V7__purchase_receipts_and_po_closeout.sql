create table if not exists purchase_receipts (
    receipt_id uuid primary key default public.uuid_generate_v4(),
    po_id uuid not null references purchase_orders (po_id),
    receipt_number varchar(80) not null unique,
    supplier_invoice_number varchar(100),
    receipt_date timestamp not null,
    status varchar(30) not null default 'RECEIVED',
    notes varchar(1000),
    subtotal numeric(12, 2),
    cgst_amount numeric(12, 2),
    sgst_amount numeric(12, 2),
    total_amount numeric(12, 2),
    created_by uuid references users (user_id),
    created_at timestamp not null default now()
);

alter table purchase_order_items
    add column if not exists purchase_receipt_id uuid references purchase_receipts (receipt_id);

alter table purchase_orders
    add column if not exists close_reason varchar(50);

alter table purchase_orders
    add column if not exists closed_notes varchar(1000);

alter table purchase_orders
    add column if not exists closed_at timestamp;

create index if not exists idx_purchase_receipts_po_id
    on purchase_receipts (po_id, receipt_date desc);

create index if not exists idx_purchase_receipts_invoice
    on purchase_receipts (supplier_invoice_number);

create index if not exists idx_purchase_order_items_receipt
    on purchase_order_items (purchase_receipt_id);

with receipt_candidates as (
    select
        public.uuid_generate_v4() as receipt_id,
        poi.po_id,
        concat(
            'GRN-',
            upper(regexp_replace(coalesce(st.store_code, 'STORE'), '[^A-Za-z0-9]', '', 'g')),
            '-',
            substr(replace(public.uuid_generate_v4()::text, '-', ''), 1, 12)
        ) as receipt_number,
        coalesce(nullif(trim(poi.supplier_invoice_number), ''), nullif(trim(po.invoice_number), '')) as supplier_invoice_number,
        coalesce(max(poi.received_at), po.received_at, po.po_date, now()) as receipt_date,
        case
            when upper(coalesce(po.status, '')) = 'PARTIALLY_RECEIVED' then 'PARTIALLY_RECEIVED'
            when upper(coalesce(po.status, '')) = 'SHORT_CLOSED' then 'SHORT_CLOSED'
            else 'RECEIVED'
        end as status,
        case
            when upper(coalesce(po.order_type, '')) = 'PLANNED_ORDER' then 'Backfilled receipt header from purchase order history'
            else 'Backfilled receipt header from inward history'
        end as notes,
        po.created_by,
        coalesce(max(poi.received_at), po.received_at, po.po_date, now()) as created_at
    from purchase_order_items poi
    join purchase_orders po
      on po.po_id = poi.po_id
    left join stores st
      on st.store_id = po.store_id
    where poi.purchase_receipt_id is null
    group by
        poi.po_id,
        coalesce(nullif(trim(poi.supplier_invoice_number), ''), nullif(trim(po.invoice_number), '')),
        po.status,
        po.order_type,
        po.received_at,
        po.po_date,
        po.created_by,
        st.store_code
)
insert into purchase_receipts (
    receipt_id,
    po_id,
    receipt_number,
    supplier_invoice_number,
    receipt_date,
    status,
    notes,
    created_by,
    created_at
)
select
    candidate.receipt_id,
    candidate.po_id,
    candidate.receipt_number,
    candidate.supplier_invoice_number,
    candidate.receipt_date,
    candidate.status,
    candidate.notes,
    candidate.created_by,
    candidate.created_at
from receipt_candidates candidate
where not exists (
    select 1
    from purchase_receipts pr
    where pr.po_id = candidate.po_id
      and pr.supplier_invoice_number is not distinct from candidate.supplier_invoice_number
);

update purchase_order_items poi
set purchase_receipt_id = pr.receipt_id
from purchase_receipts pr
join purchase_orders po
  on po.po_id = pr.po_id
where poi.purchase_receipt_id is null
  and poi.po_id = pr.po_id
  and coalesce(nullif(trim(poi.supplier_invoice_number), ''), nullif(trim(po.invoice_number), '')) is not distinct from pr.supplier_invoice_number;

update purchase_receipts pr
set subtotal = aggregates.subtotal,
    cgst_amount = round(aggregates.total_gst / 2, 2),
    sgst_amount = round(aggregates.total_gst - (aggregates.total_gst / 2), 2),
    total_amount = round(aggregates.subtotal + aggregates.total_gst, 2)
from (
    select
        poi.purchase_receipt_id,
        round(sum(
            coalesce(poi.purchase_rate, 0) * (
                coalesce(poi.quantity, 0)::numeric +
                (
                    coalesce(poi.quantity_loose, 0)::numeric /
                    greatest(coalesce(m.pack_size, 1), 1)::numeric
                )
            )
        ), 2) as subtotal,
        round(sum(
            (
                coalesce(poi.purchase_rate, 0) * (
                    coalesce(poi.quantity, 0)::numeric +
                    (
                        coalesce(poi.quantity_loose, 0)::numeric /
                        greatest(coalesce(m.pack_size, 1), 1)::numeric
                    )
                )
            ) * coalesce(poi.gst_rate, 0) / 100
        ), 2) as total_gst
    from purchase_order_items poi
    left join medicines m
      on m.medicine_id = poi.medicine_id
    where poi.purchase_receipt_id is not null
    group by poi.purchase_receipt_id
) aggregates
where pr.receipt_id = aggregates.purchase_receipt_id
  and (pr.total_amount is null or pr.subtotal is null);
