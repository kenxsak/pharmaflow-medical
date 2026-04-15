# PharmaFlow Research-Grade Feature Matrix

## Dominant Thesis
PharmaFlow should win first on pharmacy operations trust, then on chain-scale intelligence.

This strategy pack turns the current repo and current competitor messaging into one decision-ready artifact for:

- roadmap prioritization
- founder and sales positioning
- first paid customer readiness
- 10-50 store rollout sequencing
- 100-300+ store scale planning

The authoritative scoring source of truth lives in [PHARMAFLOW_FEATURE_MATRIX.csv](./PHARMAFLOW_FEATURE_MATRIX.csv).

## Evidence Base
### Repo evidence used
- [README.md](../../README.md)
- [FIRST_CUSTOMER_PHASE1.md](../operations/FIRST_CUSTOMER_PHASE1.md)
- [ManagerSidebar.tsx](../../frontend/src/features/manager-dashboard/components/sidebar/ManagerSidebar.tsx)
- [CashierSideBar.tsx](../../frontend/src/features/cashier-dashboard/components/sidebar/CashierSideBar.tsx)
- [navigation.ts](../../frontend/src/components/pharmaflow/navigation.ts)
- [POSBilling.tsx](../../frontend/src/pages/billing/POSBilling.tsx)
- [InventoryDashboard.tsx](../../frontend/src/pages/inventory/InventoryDashboard.tsx)
- [ProcurementDashboard.tsx](../../frontend/src/pages/procurement/ProcurementDashboard.tsx)
- [ComplianceDashboard.tsx](../../frontend/src/pages/compliance/ComplianceDashboard.tsx)
- [StoreOperationsDashboard.tsx](../../frontend/src/pages/stores/StoreOperationsDashboard.tsx)
- [InventoryMovementService.java](../../backend/pos-system/src/main/java/com/pharmaflow/inventory/InventoryMovementService.java)
- [CreditNoteService.java](../../backend/pos-system/src/main/java/com/pharmaflow/procurement/CreditNoteService.java)
- controller coverage across billing, inventory, procurement, compliance, reporting, tenant, customer, and audit modules under `backend/pos-system/src/main/java/com/pharmaflow`

### Official competitor evidence used
- [Gofrugal pharmacy billing](https://www.gofrugal.com/retail/pharmacy-software/medical-store-billing.html)
- [Gofrugal multi-location retail/pharmacy positioning](https://www.gofrugal.com/retail/pharmacy-software/ayurvedic-pos.html)
- [Marg pharmacy software](https://margcompusoft.com/delhi/pharmacy-software.html)
- [Marg retail chain management](https://margcompusoft.com/retail/retail_chain_management_software.html)

### Interpretation rule applied
- UI-visible or route-visible features were not marked `Working` unless the repo also showed enough backend and workflow depth to support operational use.
- Features present only as entities, enums, or positioning copy were marked `Partial` or `Missing`.
- Competitor claims were treated as market baseline signals, not proof of implementation quality.

## Repo Truth Readout
### Strong today
- billing, GST invoicing, PDF and WhatsApp share
- batch-aware inventory visibility
- stock-aware substitute suggestions with replace and add actions
- procurement scaffolding with CSV import, receipts, planned orders, and credit-note lifecycle
- compliance registers and prescription-linked flows
- reporting for GST, sales, profit, shortage, and expiry loss
- SaaS admin, company admin, and store-scoped access model

### Strong but still needs hardening
- production hosting discipline for paid use
- batch / FEFO truth under concurrency
- audit completeness across sensitive actions
- prescription durability on hosted infrastructure
- stock reconciliation depth

### Still a commercial gap
- fully closed return recovery loop
- stronger claim cockpit for supplier recovery
- mature HO and warehouse control tower
- chain-grade analytics and policy controls
- offline / hybrid resilience if poor-connectivity stores become a target

## Shared Scoring Model
### Category meanings
- `Basic`: required for first paid usage or immediately trust-breaking if weak
- `Nice`: valuable after the trust layer is stable, but not the first store's main buying reason
- `ICE`: a meaningful differentiator or moat feature that can help win and retain accounts

### Numeric scoring
- `Profit Impact 5`: directly captures sales, reduces expiry loss, recovers supplier credits, or avoids stock leakage
- `Profit Impact 4`: materially improves billing speed, reorder accuracy, or staff efficiency
- `Profit Impact 3`: useful management or reporting upside
- `Profit Impact 1-2`: mostly polish, convenience, or future upside

- `Differentiation Impact 5`: rare, pharmacy-specific, easy to show in a demo
- `Differentiation Impact 3`: useful but broadly expected in competitors
- `Differentiation Impact 1`: commodity or table stakes

### Priority definitions
- `Build Now`: before first paid customer
- `Phase 2`: before a dependable 10-50 store rollout
- `Phase 3`: before a dependable 100-300+ store rollout
- `Later`: expansion surface that should not outrank trust-critical operations

## Priority Stack
### Before first paid customer
Ordered by profit impact first, then operational frequency, then compliance risk, then differentiation.

1. `Billing core and GST invoicing`
   Reason: this is the adoption gate and the first thing staff will judge.
2. `Batch / FEFO stock truth`
   Reason: wrong stock math destroys trust faster than missing optional features.
3. `Purchase import, inward, and receipt matching`
   Reason: large distributor invoices must be practical or stores will bypass the system.
4. `Dump / RTV / supplier credit-note recovery`
   Reason: this is direct margin recovery, not a cosmetic workflow.
5. `Stock-aware actionable substitute engine`
   Reason: it directly saves otherwise-lost sales at the counter.
6. `Stock movement ledger, adjustments, and reconciliation`
   Reason: every other stock promise depends on auditable movement history.
7. `Expiry action intelligence`
   Reason: alerts alone do not protect money; actionability does.
8. `Sales returns linked to original invoices`
   Reason: reverse sale workflows must restore stock and history cleanly.
9. `Controlled-drug compliance registers`
   Reason: legal readiness is a first-customer blocker.
10. `Prescription capture, archive, and retrieval`
    Reason: controlled-drug trust breaks when evidence is hard to retrieve.
11. `Audit trail, price-control, and override visibility`
    Reason: owners need proof, not just screens.
12. `Shortage, reorder, and replenishment suggestions`
    Reason: basic stockout prevention protects revenue every day.
13. `Multi-store roles, tenant scoping, and branch context`
    Reason: even one live store needs correct access boundaries.
14. `Production trust layer: durable storage, monitoring, and rollback discipline`
    Reason: the first paid customer judges uptime and document safety, not just UX.

### Before 10-50 stores
1. `Inter-store transfer and warehouse replenishment orchestration`
   Reason: network stock allocation becomes cheaper than repeated urgent purchasing.
2. `Supplier claim cockpit`
   Reason: claim visibility turns RTV from a workflow into a money dashboard.
3. `Controlled-drug patient and compliance memory`
   Reason: repeat restricted-medicine handling must become faster without sacrificing traceability.
4. `HO / warehouse dashboard and operational visibility`
   Reason: rollout stops scaling when HO still needs founder-level handholding.
5. `Profit, slow-mover, and expiry-loss analytics`
   Reason: once multiple stores run on the system, owners need decisions, not just transactions.

### Before 100-300+ stores
1. `Offline / hybrid branch mode`
   Reason: if real branch connectivity becomes a constraint, this becomes a rollout reliability feature.
2. `Precomputed chain analytics and KPI history`
   Reason: raw-query reporting does not scale elegantly to chain usage.
3. `Enterprise admin delegation and policy controls`
   Reason: larger customers need safer delegation and repeatable governance.

## Sales Positioning Companion
Use this section directly in demos, proposals, and founder calls.

| Feature | Buyer pain it solves | Competitor gap angle | Demo story or commercial proof point |
|---|---|---|---|
| Billing core and GST invoicing | Counter staff need a fast bill flow that does not create GST confusion. | Competitors treat this as table stakes, so weak execution here is an immediate loss. | Show medicine search, loose or strip sale, GST bill creation, PDF, and WhatsApp handoff in one sequence. |
| Batch / FEFO stock truth | Owners hate expiry leakage and wrong-stock sales more than they care about extra modules. | Competitors market batch and expiry heavily, so PharmaFlow cannot afford a weak story here. | Open stock by medicine, show oldest sellable batch visibility, then connect it back to billing and expiry alerts. |
| Purchase import, inward, and receipt matching | Staff cannot spend hours keying distributor invoices by hand. | Marg explicitly markets online purchase import, so this must be credible in both sales and delivery. | Upload a distributor CSV, review inward totals, and show receipts plus PO progress on the procurement desk. |
| Dump / RTV / supplier credit-note recovery | Pharmacies lose money when expired and damaged stock never turns into supplier recovery. | Many systems mention returns, but the owner pain is usually in claim closure, not note creation. | Show a credit note moving from creation to dispatch, acknowledgment, settlement, and unresolved-claim visibility. |
| Stock-aware actionable substitute engine | The sale is lost if an unavailable brand cannot be replaced in seconds. | Marg promotes substitute search, but stock-aware replace or add at the counter is still a stronger demo story. | Add a medicine to the bill, reveal stocked substitutes, and replace it instantly without breaking the bill flow. |
| Stock movement ledger, adjustments, and reconciliation | Stores need to explain every discrepancy before it becomes a blame cycle. | Competitors market stock accuracy broadly, but fewer systems make movement evidence easy to show. | Open a batch, show adjustments, quarantine, dump, transfer, and return movements in one audit trail. |
| Expiry action intelligence | Simple alert lists do not tell staff what to do next with at-risk stock. | This is an opportunity gap because many products stop at alerts and reports. | Show expiring stock, then explain the next action paths: quarantine, transfer, dump, or RTV. |
| Sales returns linked to original invoices | Return handling becomes messy when stock and invoice history drift apart. | Sales return exists in competitor messaging, so PharmaFlow must show an equally clean reversal loop. | Open a historical bill, create a return, and show inventory restoration plus audit linkage. |
| Controlled-drug compliance registers | Pharmacies need inspector-ready traceability without switching systems. | Competitors market Schedule H, H1, and narcotic readiness as expected pharmacy ERP capability. | Filter by schedule and month, open the inspector report, and export the register live. |
| Prescription capture, archive, and retrieval | Restricted-medicine sales are slower and riskier when prescription proof is buried. | Marg explicitly markets prescription reminders and narcotic reporting, so archive retrieval matters in the comparison. | Upload a prescription in billing, then reopen it from compliance and customer history. |
| Audit trail, price-control, and override visibility | Owners worry about silent price edits, stock manipulation, and undocumented overrides. | Competitor messaging often implies control, but a visible audit story is still a trust multiplier. | Show billing audit and stock movement history, then explain how the same evidence supports disputes and compliance. |
| Shortage, reorder, and replenishment suggestions | Stockouts directly cost revenue and frustrate repeat buyers. | Competitors market reorder and centralized purchasing, so PharmaFlow needs a practical shortage story. | Open shortage recommendations, show transfer-first logic, then create a draft purchase order. |
| Multi-store roles, tenant scoping, and branch context | Wrong user visibility scares owners even in a one-store rollout. | Chain-ready competitors assume role separation and branch scoping as table stakes. | Sign in as SaaS admin, company admin, and store operator to prove the visibility model changes correctly. |
| Production trust layer: durable storage, monitoring, and rollback discipline | Buyers fear downtime and document loss more than they fear missing nice-to-have features. | Competitors usually imply managed reliability even when they do not demo it. | Explain the hosted hardening path: durable prescription storage, health checks, alerts, and rollback discipline. |
| Inter-store transfer and warehouse replenishment orchestration | Multi-store operators hate buying urgently while another branch sits on excess stock. | Gofrugal leans into multi-location and warehouse control, so PharmaFlow needs a stronger transfer story as rollout grows. | Show transfer suggestions from the operations dashboard, then approve, dispatch, and receive the stock. |
| Supplier claim cockpit | Owners want one place to see claim value, supplier exposure, and unresolved recovery. | This is a stronger owner-facing angle than generic return lists and can feel more modern than competitor tables. | Show open RTV claims, pending value, and unresolved credit-note actions by supplier. |
| Controlled-drug patient and compliance memory | Repeat prescription-heavy customers should not force a fresh manual compliance hunt every time. | This is a meaningful differentiation angle because it improves both speed and safety. | Search a returning patient and show prior restricted-medicine history with prescription context. |
| HO / warehouse dashboard and operational visibility | Growth stalls when head office cannot see which stores are at risk. | Competitors market centralized control, so PharmaFlow needs a clean cross-store command view. | Open the operations dashboard and show shortages, near-expiry capital, pending receipts, claims, and transfer opportunities. |
| Profit, slow-mover, and expiry-loss analytics | Owners need to know where margin is being made or lost, not just what sold. | This is common in competitor marketing, so the win comes from connecting analytics back to action workflows. | Show slow movers, expiry loss, and profit by manufacturer or category, then tie those reports back to reorder and RTV decisions. |

## Top 10 Recommendation List
| Rank | Feature | Why now | Expected commercial effect | Implementation phase |
|---|---|---|---|---|
| 1 | Dump / RTV / supplier credit-note recovery | It protects margin directly and is still not fully closed in the repo. | Better owner trust, stronger ROI story, lower expiry leakage. | Build Now |
| 2 | Purchase import, inward, and receipt matching | Daily inward volume will decide whether staff really use the system. | Faster onboarding, fewer stock errors, better data quality from day one. | Build Now |
| 3 | Batch / FEFO stock truth | Stock integrity is the foundation for every other promise. | Lower stock mismatch, lower expiry waste, stronger billing confidence. | Build Now |
| 4 | Stock-aware actionable substitute engine | It directly saves sales at the counter and differentiates the demo. | Higher conversion when requested brands are unavailable. | Build Now |
| 5 | Stock movement ledger, adjustments, and reconciliation | Owners need explainable inventory, not just balances. | Better trust, cleaner claims, easier issue resolution. | Build Now |
| 6 | Expiry action intelligence | Simple alerts do not protect money without action paths. | Lower expiry loss and better inventory decision quality. | Build Now |
| 7 | Prescription capture, archive, and retrieval | Compliance credibility depends on evidence retrieval, not just capture fields. | Safer rollout into real pharmacy operations and better inspection readiness. | Build Now |
| 8 | Shortage, reorder, and replenishment suggestions | Stockouts quietly reduce revenue and customer retention. | Better fill rate and fewer missed sales. | Build Now |
| 9 | Supplier claim cockpit | This is one of the clearest Phase 2 owner dashboards. | Better claim follow-up and a stronger head-office value proposition. | Phase 2 |
| 10 | HO / warehouse dashboard and operational visibility | Multi-store rollout needs a control tower, not more founder supervision. | Safer 10-50 store rollout and stronger chain-sales positioning. | Phase 2 |

## Current Positioning Conclusion
The strongest honest message for PharmaFlow is:

`best-in-class pharmacy operations trust before feature sprawl`

That means the product should sell itself first on:

- dependable billing
- trustworthy stock and expiry handling
- real purchase and inward practicality
- recoverable returns and supplier claims
- controlled-drug compliance readiness
- substitute-driven revenue protection

It should not try to win the first paid customer by leading with:

- delivery apps
- full offline sync
- deep integrations
- loyalty breadth
- e-commerce
- AI forecasting

Those may matter later, but they are not the highest-probability path to winning and retaining the first pharmacy account.

## Source Notes
### Competitor takeaways encoded into the matrix
- Gofrugal publicly emphasizes multi-location control, centralized purchasing, centralized inventory, batch and expiry management, warehouse transfer behavior, and real-time business analytics.
- Marg publicly emphasizes fast billing, online purchase import, substitute search, narcotic and schedule reporting, expiry-loss reduction, sales return handling, and chain management breadth.

### Repo takeaways encoded into the matrix
- PharmaFlow already has strong visible coverage in billing, stock, procurement, compliance, reporting, and role-scoped access.
- The biggest near-term gaps are not missing pages; they are closure quality, actionability, hosted durability, and rollout-safe operations depth.
