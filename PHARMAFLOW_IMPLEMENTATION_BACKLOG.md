# PharmaFlow Implementation Backlog

This file converts the requirement list into the actual build backlog for the PharmaFlow MVP.

Status legend:
- `done` = implemented in the current codebase
- `partial` = data model or backend scaffold exists, but the full workflow/UI is not finished
- `pending` = not implemented yet

## 1. Multi-location and stock synchronization

- `partial` Multi-location data model for stores, warehouse, and HO
- `pending` Real-time stock synchronization across outlets, warehouse, and HO
- `pending` Stock transfer workflow between stores and warehouse
- `pending` Indent workflow between branches and warehouse

## 2. Expiry, dump, and return-to-vendor

- `done` Expiry alerts for expired / 30 / 60 / 90 day buckets
- `pending` Dump workflow for damaged / expired stock
- `pending` Return-to-vendor workflow for near-expiry and expired stock
- `pending` Credit note follow-up for RTV claims
- `done` Expiry loss reporting by store / medicine

## 3. Purchase, imports, and distributor invoices

- `partial` Purchase order and purchase item data model
- `done` CSV / Excel purchase invoice import
- `partial` Bulk validation for batch, expiry, GST, PTR, PTS, MRP, scheme
- `done` Import UI for distributor purchase bills

## 4. Medicine master and substitute management

- `done` Medicine, manufacturer, salt composition, and substitute data model
- `partial` Medicine search by brand, generic, salt, and barcode
- `done` Substitute lookup API
- `done` Billing UI suggestion for generic / branded substitutes
- `pending` Managed substitute master maintenance screen

## 5. Schedule H / H1 / X / narcotic compliance

- `done` Schedule H / H1 / X compliance register data model
- `done` Compliance validation in billing flow
- `done` Drug Inspector report API
- `partial` Pharmacist-linked compliance audit trail
- `partial` Mandatory sale register export / print format
- `done` Narcotic monthly report UI
- `partial` Compliance entry screen / workflow in frontend
- `pending` Controlled-drug patient history view

## 6. Batch, FIFO, strip, and stock controls

- `done` Inventory batch model
- `partial` FIFO batch selection in backend queries
- `partial` Full strip and loose tablet sale handling in backend
- `done` Hard block on expired batch sale at API and UI level
- `partial` Batch-first billing UI with clear strip/tablet controls
- `pending` Batch history and movement report

## 7. Billing, GST, invoice numbering, and returns

- `partial` GST calculation service with reverse GST extraction
- `partial` Invoice and invoice item model
- `partial` Invoice creation endpoint
- `partial` India-style financial-year invoice numbering
- `pending` Credit note workflow
- `pending` Sales return workflow
- `done` Block billing when customer credit exceeds threshold
- `done` Restrict price editing by role
- `partial` Track bill edits and cancellations in dedicated audit flows

## 8. Prescription digitization and patient history

- `partial` Prescription URL field linked to invoice and compliance register
- `pending` Upload / scan prescription flow
- `partial` Prescription viewer in frontend
- `pending` Searchable patient prescription history

## 9. Loyalty, discounts, and customer credit

- `partial` Customer model includes loyalty points, credit limit, current balance
- `pending` Centralized cross-branch loyalty earn / redeem flow
- `partial` Customer lookup and history in POS
- `done` Credit limit enforcement during billing
- `pending` Discount policy controls by role / branch

## 10. Home delivery and delivery operations

- `partial` Delivery role exists in auth model
- `pending` Home delivery order lifecycle
- `pending` Delivery-boy app or delivery UI
- `pending` Delivery collection and reconciliation

## 11. Reports and analytics

- `done` GSTR-1 API
- `done` GSTR-3B API
- `done` Expiry alerts API
- `done` Shortage report API
- `done` Daily sales per store report
- `done` Top-selling medicines report
- `done` Slow-moving stock report
- `done` Profit by manufacturer report
- `done` Profit by category report
- `done` Excel / CSV export for reports
- `done` Profit margin analytics UI

## 12. Roles, permissions, and audit

- `partial` PharmaFlow role model with admin, manager, pharmacist, sales, warehouse, delivery
- `partial` JWT auth and protected endpoints
- `partial` Generic audit log table and write-on-create invoice logging
- `partial` Full activity audit logging across bill edit, stock update, returns, compliance actions
- `partial` Fine-grained permission enforcement for price edits, credit overrides, controlled-drug sale approvals

## 13. Reliability, cloud/local, and offline capability

- `partial` Dockerized local stack definition
- `pending` Branch-local offline mode
- `pending` Local backup / sync recovery design
- `pending` Unstable-internet branch workflow

## 14. Integrations

- `pending` Tally / accounting integration
- `pending` GST filing integration
- `pending` WhatsApp billing and notification integration
- `pending` SMS notification integration
- `pending` E-commerce / online pharmacy integration
- `pending` Public / internal API integration layer for future connectors

## 15. Operational / non-product items

- `pending` 24/7 support process is an operations item, not an in-app feature
- `pending` Unlimited invoice / document capacity needs validation at database, archival, and infrastructure level

## Current MVP baseline in code

The current codebase already includes:

- `done` Root workspace set up from the Life-Pill repos
- `done` Root git repo initialized
- `done` PostgreSQL schema and seed files
- `done` Docker compose baseline
- `done` PharmaFlow backend package scaffold under `backend/pos-system/src/main/java/com/pharmaflow`
- `done` Initial frontend PharmaFlow pages for POS billing, expiry dashboard, compliance, and GST reports

## Recommended build order

1. Finish core pharmacy engine
   - real stock issue rules
   - expired stock blocking
   - credit limit blocking
   - role-based price controls

2. Finish compliance workflows
   - Schedule H / H1 / X UI
   - prescription upload flow
   - sale registers and Drug Inspector exports

3. Finish procurement and return loops
   - purchase import
   - RTV / dump / credit note tracking

4. Finish analytics and exports
   - sales, margin, expiry loss, shortage, slow-moving
   - Excel / CSV export

5. Finish customer and delivery workflows
   - loyalty
   - patient history
   - home delivery

6. Finish integrations and resilience
   - external integrations
   - offline / sync design
