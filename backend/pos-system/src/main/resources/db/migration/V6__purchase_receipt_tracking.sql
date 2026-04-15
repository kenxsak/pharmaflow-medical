alter table purchase_order_items
    add column if not exists supplier_invoice_number varchar(100);

alter table purchase_order_items
    add column if not exists received_at timestamp;

create index if not exists idx_purchase_order_items_supplier_invoice
    on purchase_order_items (supplier_invoice_number);
