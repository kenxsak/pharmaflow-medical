package com.pharmaflow.billing;

import com.pharmaflow.audit.AuditLog;
import com.pharmaflow.audit.AuditLogRepository;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.auth.PharmaUserRepository;
import com.pharmaflow.compliance.ScheduleDrugRegister;
import com.pharmaflow.compliance.ScheduleDrugRegisterRepository;
import com.pharmaflow.customer.Customer;
import com.pharmaflow.customer.CustomerRepository;
import com.pharmaflow.inventory.InventoryBatch;
import com.pharmaflow.inventory.InventoryBatchRepository;
import com.pharmaflow.medicine.Manufacturer;
import com.pharmaflow.medicine.ManufacturerRepository;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.medicine.MedicineRepository;
import com.pharmaflow.medicine.MedicineSubstitute;
import com.pharmaflow.medicine.MedicineSubstituteRepository;
import com.pharmaflow.medicine.SaltComposition;
import com.pharmaflow.medicine.SaltCompositionRepository;
import com.pharmaflow.procurement.PharmaSupplierRepository;
import com.pharmaflow.procurement.PurchaseOrder;
import com.pharmaflow.procurement.PurchaseOrderItem;
import com.pharmaflow.procurement.PurchaseOrderItemRepository;
import com.pharmaflow.procurement.PurchaseOrderRepository;
import com.pharmaflow.procurement.Supplier;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PharmaFlowDemoBootstrap implements CommandLineRunner {

    private final StoreRepository storeRepository;
    private final ManufacturerRepository manufacturerRepository;
    private final SaltCompositionRepository saltCompositionRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineSubstituteRepository medicineSubstituteRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final CustomerRepository customerRepository;
    private final PharmaUserRepository pharmaUserRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final ScheduleDrugRegisterRepository scheduleDrugRegisterRepository;
    private final AuditLogRepository auditLogRepository;
    private final PharmaSupplierRepository pharmaSupplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final GSTCalculationService gstCalculationService;

    @Override
    @Transactional
    public void run(String... args) {
        Store demoStore = storeRepository.findByStoreCode("TN-STORE-001").orElse(null);
        if (demoStore == null) {
            return;
        }

        ensureDemoCatalog(demoStore);
        ensureSubstitutes();
        ensureCustomerBalances();
        ensurePurchaseHistory(demoStore);
        ensureBillingHistory(demoStore);
        ensureAuditTrail(demoStore);
    }

    private BigDecimal decimal(String value) {
        return new BigDecimal(value);
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private void ensureDemoCatalog(Store demoStore) {
        LocalDate today = LocalDate.now();

        Manufacturer gsk = ensureManufacturer("GlaxoSmithKline Pharmaceuticals Ltd", "GSK");
        Manufacturer micro = ensureManufacturer("Micro Labs Ltd", "MICRO");
        Manufacturer alkem = ensureManufacturer("Alkem Laboratories Ltd", "ALKEM");
        Manufacturer sun = ensureManufacturer("Sun Pharma Industries Ltd", "SUN");
        Manufacturer torrent = ensureManufacturer("Torrent Pharmaceuticals Ltd", "TORRENT");
        Manufacturer abbott = ensureManufacturer("Abbott India Ltd", "ABBOTT");
        Manufacturer zydus = ensureManufacturer("Zydus Lifesciences Ltd", "ZYDUS");
        Manufacturer cipla = ensureManufacturer("Cipla Ltd", "CIPLA");

        SaltComposition paracetamol500 = ensureSalt("Paracetamol 500mg", "Paracetamol", "Analgesic/Antipyretic");
        SaltComposition paracetamol650 = ensureSalt("Paracetamol 650mg", "Paracetamol", "Analgesic/Antipyretic");
        SaltComposition amoxicillin500 = ensureSalt("Amoxicillin 500mg", "Amoxicillin", "Antibiotic");
        SaltComposition metformin500 = ensureSalt("Metformin 500mg", "Metformin", "Antidiabetic");
        SaltComposition atorvastatin10 = ensureSalt("Atorvastatin 10mg", "Atorvastatin", "Lipid Lowering");
        SaltComposition pantoprazole40 = ensureSalt("Pantoprazole 40mg", "Pantoprazole", "GI / Acidity");
        SaltComposition alprazolam025 = ensureSalt("Alprazolam 0.25mg", "Alprazolam", "Psychotropic");
        SaltComposition codeine30 = ensureSalt("Codeine Phosphate 30mg", "Codeine", "Narcotic Analgesic");

        Medicine crocin = ensureMedicine("Crocin 500", "Paracetamol", "TABLET", "500mg", 10, "8901234500001", "30049069", decimal("12"), decimal("12.00"), decimal("9.30"), decimal("8.90"), "NONE", false, false, false, 12, gsk, paracetamol500);
        Medicine dolo = ensureMedicine("Dolo 650", "Paracetamol", "TABLET", "650mg", 15, "8901234500002", "30049069", decimal("12"), decimal("33.00"), decimal("24.50"), decimal("23.00"), "NONE", false, false, false, 8, micro, paracetamol650);
        Medicine mox = ensureMedicine("Mox 500", "Amoxicillin", "CAPSULE", "500mg", 10, "8901234500003", "30041010", decimal("12"), decimal("96.00"), decimal("72.00"), decimal("68.00"), "H", false, false, true, 10, alkem, amoxicillin500);
        Medicine glycomet = ensureMedicine("Glycomet 500", "Metformin", "TABLET", "500mg", 15, "8901234500004", "30049099", decimal("5"), decimal("28.00"), decimal("18.50"), decimal("17.75"), "NONE", false, false, false, 12, sun, metformin500);
        Medicine atorva = ensureMedicine("Atorva 10", "Atorvastatin", "TABLET", "10mg", 15, "8901234500005", "30049099", decimal("12"), decimal("62.00"), decimal("42.00"), decimal("40.50"), "NONE", false, false, false, 10, zydus, atorvastatin10);
        Medicine pan40 = ensureMedicine("Pan 40", "Pantoprazole", "TABLET", "40mg", 15, "8901234500006", "30049099", decimal("12"), decimal("110.00"), decimal("78.00"), decimal("76.00"), "NONE", false, false, false, 10, alkem, pantoprazole40);
        Medicine alprax = ensureMedicine("Alprax 0.25", "Alprazolam", "TABLET", "0.25mg", 10, "8901234500010", "30049099", decimal("12"), decimal("24.00"), decimal("15.00"), decimal("14.20"), "H1", false, true, true, 5, torrent, alprazolam025);
        Medicine codeine = ensureMedicine("Codeine Tab", "Codeine", "TABLET", "30mg", 10, "8901234500011", "30049099", decimal("12"), decimal("145.00"), decimal("98.00"), decimal("95.00"), "X", true, false, true, 4, abbott, codeine30);
        Medicine paracip = ensureMedicine("Paracip 500", "Paracetamol", "TABLET", "500mg", 10, "8901234500012", "30049069", decimal("12"), decimal("11.00"), decimal("8.40"), decimal("8.00"), "NONE", false, false, false, 10, cipla, paracetamol500);
        Medicine calpol = ensureMedicine("Calpol 500", "Paracetamol", "TABLET", "500mg", 10, "8901234500013", "30049069", decimal("12"), decimal("13.00"), decimal("9.80"), decimal("9.40"), "NONE", false, false, false, 10, gsk, paracetamol500);

        ensureBatch(demoStore, crocin, "BT-OLD-001", today.minusMonths(10), today.plusDays(19), 15, 3, decimal("9.30"), decimal("12.00"), true);
        ensureBatch(demoStore, dolo, "BT-2026-DOLO-01", today.minusMonths(4), today.plusDays(210), 18, 5, decimal("24.50"), decimal("33.00"), true);
        ensureBatch(demoStore, mox, "BT-LOW-001", today.minusMonths(5), today.plusDays(120), 3, 0, decimal("72.00"), decimal("96.00"), true);
        ensureBatch(demoStore, glycomet, "BT-2026-GLY-01", today.minusMonths(2), today.plusDays(360), 24, 0, decimal("18.50"), decimal("28.00"), true);
        ensureBatch(demoStore, atorva, "BT-2026-ATOR-01", today.minusMonths(3), today.plusDays(280), 16, 0, decimal("42.00"), decimal("62.00"), true);
        ensureBatch(demoStore, pan40, "BT-2026-PAN-01", today.minusMonths(2), today.plusDays(240), 14, 0, decimal("78.00"), decimal("110.00"), true);
        ensureBatch(demoStore, pan40, "BT-EXP-001", today.minusMonths(12), today.minusDays(5), 4, 0, decimal("74.00"), decimal("108.00"), true);
        ensureBatch(demoStore, alprax, "BT-2026-ALP-01", today.minusMonths(1), today.plusDays(42), 7, 0, decimal("15.00"), decimal("24.00"), true);
        ensureBatch(demoStore, codeine, "BT-2026-COD-01", today.minusMonths(2), today.plusDays(76), 5, 0, decimal("98.00"), decimal("145.00"), true);
        ensureBatch(demoStore, paracip, "BT-2026-PAR-01", today.minusMonths(2), today.plusDays(320), 11, 0, decimal("8.40"), decimal("11.00"), true);
        ensureBatch(demoStore, calpol, "BT-2026-CAL-01", today.minusMonths(2), today.plusDays(300), 9, 0, decimal("9.80"), decimal("13.00"), true);
    }

    private Manufacturer ensureManufacturer(String name, String shortCode) {
        Manufacturer manufacturer = manufacturerRepository.findFirstByShortCodeIgnoreCase(shortCode)
                .orElseGet(() -> manufacturerRepository.findFirstByNameIgnoreCase(name).orElse(null));
        if (manufacturer == null) {
            manufacturer = new Manufacturer();
        }
        manufacturer.setName(name);
        manufacturer.setShortCode(shortCode);
        manufacturer.setIsActive(true);
        return manufacturerRepository.save(manufacturer);
    }

    private SaltComposition ensureSalt(String saltName, String genericName, String drugClass) {
        SaltComposition saltComposition = saltCompositionRepository.findFirstBySaltNameIgnoreCase(saltName).orElse(null);
        if (saltComposition == null) {
            saltComposition = new SaltComposition();
        }
        saltComposition.setSaltName(saltName);
        saltComposition.setGenericName(genericName);
        saltComposition.setDrugClass(drugClass);
        return saltCompositionRepository.save(saltComposition);
    }

    private Medicine ensureMedicine(
            String brandName,
            String genericName,
            String medicineForm,
            String strength,
            int packSize,
            String barcode,
            String hsnCode,
            BigDecimal gstRate,
            BigDecimal mrp,
            BigDecimal ptr,
            BigDecimal pts,
            String scheduleType,
            boolean isNarcotic,
            boolean isPsychotropic,
            boolean requiresRx,
            int reorderLevel,
            Manufacturer manufacturer,
            SaltComposition saltComposition
    ) {
        Medicine medicine = medicineRepository.findFirstByBarcodeIgnoreCase(barcode)
                .orElseGet(() -> medicineRepository.findFirstByBrandNameIgnoreCase(brandName).orElse(null));
        if (medicine == null) {
            medicine = new Medicine();
        }

        medicine.setBrandName(brandName);
        medicine.setGenericName(genericName);
        medicine.setMedicineForm(medicineForm);
        medicine.setStrength(strength);
        medicine.setPackSize(packSize);
        medicine.setBarcode(barcode);
        medicine.setHsnCode(hsnCode);
        medicine.setGstRate(gstRate);
        medicine.setMrp(mrp);
        medicine.setPtr(ptr);
        medicine.setPts(pts);
        medicine.setScheduleType(scheduleType);
        medicine.setIsNarcotic(isNarcotic);
        medicine.setIsPsychotropic(isPsychotropic);
        medicine.setRequiresRx(requiresRx);
        medicine.setReorderLevel(reorderLevel);
        medicine.setIsActive(true);
        medicine.setManufacturer(manufacturer);
        medicine.setSaltComposition(saltComposition);
        return medicineRepository.save(medicine);
    }

    private InventoryBatch ensureBatch(
            Store store,
            Medicine medicine,
            String batchNumber,
            LocalDate manufactureDate,
            LocalDate expiryDate,
            int quantityStrips,
            int quantityLoose,
            BigDecimal purchaseRate,
            BigDecimal mrp,
            boolean active
    ) {
        InventoryBatch batch = findBatch(store, medicine, batchNumber);
        if (batch == null) {
            batch = new InventoryBatch();
            batch.setStore(store);
            batch.setMedicine(medicine);
            batch.setBatchNumber(batchNumber);
        }

        batch.setManufactureDate(manufactureDate);
        batch.setExpiryDate(expiryDate);
        batch.setQuantityStrips(quantityStrips);
        batch.setQuantityLoose(quantityLoose);
        batch.setPurchaseRate(purchaseRate);
        batch.setMrp(mrp);
        batch.setIsActive(active);
        return inventoryBatchRepository.save(batch);
    }

    private void ensureSubstitutes() {
        Medicine crocin = medicineRepository.findFirstByBrandNameIgnoreCase("Crocin 500").orElse(null);
        Medicine paracip = medicineRepository.findFirstByBrandNameIgnoreCase("Paracip 500").orElse(null);
        Medicine calpol = medicineRepository.findFirstByBrandNameIgnoreCase("Calpol 500").orElse(null);
        Medicine glycomet = medicineRepository.findFirstByBrandNameIgnoreCase("Glycomet 500").orElse(null);
        Medicine pan40 = medicineRepository.findFirstByBrandNameIgnoreCase("Pan 40").orElse(null);

        createSubstitute(crocin, paracip, true);
        createSubstitute(crocin, calpol, false);
        createSubstitute(paracip, crocin, false);
        createSubstitute(glycomet, crocin, false);
        createSubstitute(pan40, calpol, false);
    }

    private void createSubstitute(Medicine medicine, Medicine substitute, boolean isGeneric) {
        if (medicine == null || substitute == null) {
            return;
        }
        if (medicineSubstituteRepository.existsByMedicineMedicineIdAndSubstituteMedicineId(
                medicine.getMedicineId(),
                substitute.getMedicineId()
        )) {
            return;
        }

        medicineSubstituteRepository.save(
                MedicineSubstitute.builder()
                        .medicine(medicine)
                        .substitute(substitute)
                        .isGeneric(isGeneric)
                        .priceDiffPct(calculatePriceDiff(medicine, substitute))
                        .build()
        );
    }

    private BigDecimal calculatePriceDiff(Medicine base, Medicine substitute) {
        if (base == null || substitute == null || safe(base.getMrp()).compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return safe(substitute.getMrp())
                .subtract(safe(base.getMrp()))
                .multiply(BigDecimal.valueOf(100))
                .divide(base.getMrp(), 2, RoundingMode.HALF_UP);
    }

    private void ensureCustomerBalances() {
        Store demoStore = storeRepository.findByStoreCode("TN-STORE-001").orElse(null);
        if (demoStore == null) {
            return;
        }

        ensureCustomer(
                demoStore,
                "Ramesh Kumar",
                "9876000001",
                "Dr. Priya Raman",
                "12 Anna Nagar West, Chennai",
                decimal("5000.00"),
                decimal("0.00"),
                240
        );
        ensureCustomer(
                demoStore,
                "Lakshmi Devi",
                "9876000002",
                "Dr. Harini Suresh",
                "44 T.Nagar, Chennai",
                decimal("2500.00"),
                decimal("650.00"),
                120
        );
        ensureCustomer(
                demoStore,
                "Mohammed Ali",
                "9876000003",
                "Dr. Revathi Narayanan",
                "8 Coats Road, Chennai",
                decimal("1200.00"),
                decimal("850.00"),
                40
        );
    }

    private Customer ensureCustomer(
            Store store,
            String name,
            String phone,
            String doctorName,
            String address,
            BigDecimal creditLimit,
            BigDecimal currentBalance,
            int loyaltyPoints
    ) {
        Customer customer = customerRepository.findByPhone(phone).orElse(null);
        if (customer == null) {
            customer = new Customer();
        }
        customer.setStore(store);
        customer.setName(name);
        customer.setPhone(phone);
        customer.setDoctorName(doctorName);
        customer.setAddress(address);
        customer.setCreditLimit(creditLimit);
        customer.setCurrentBalance(currentBalance);
        customer.setLoyaltyPoints(loyaltyPoints);
        customer.setIsActive(true);
        return customerRepository.save(customer);
    }

    private void ensurePurchaseHistory(Store store) {
        String demoPoNumber = "PO-TN001-DEMO-0001";
        if (purchaseOrderRepository.existsByPoNumber(demoPoNumber)) {
            return;
        }

        Supplier supplier = ensureSupplier(
                "MedPlus Distributors",
                "Arun Prakash",
                "9840012345",
                "33AACFM1234A1Z8",
                "Guindy Industrial Estate, Chennai"
        );
        PharmaUser user = resolveDemoUser();
        Medicine crocin = medicineRepository.findFirstByBrandNameIgnoreCase("Crocin 500").orElse(null);
        Medicine glycomet = medicineRepository.findFirstByBrandNameIgnoreCase("Glycomet 500").orElse(null);
        if (supplier == null || crocin == null || glycomet == null) {
            return;
        }

        PurchaseOrder purchaseOrder = purchaseOrderRepository.save(
                PurchaseOrder.builder()
                        .store(store)
                        .supplier(supplier)
                        .poNumber(demoPoNumber)
                        .poDate(LocalDateTime.now().minusDays(3))
                        .invoiceNumber("MEDPLUS-INV-1042")
                        .status("RECEIVED")
                        .createdBy(user)
                        .build()
        );

        purchaseOrderItemRepository.save(
                PurchaseOrderItem.builder()
                        .purchaseOrder(purchaseOrder)
                        .medicine(crocin)
                        .batchNumber("BT-OLD-001")
                        .expiryDate(LocalDate.now().plusDays(19))
                        .quantity(60)
                        .freeQty(6)
                        .purchaseRate(decimal("9.30"))
                        .mrp(decimal("12.00"))
                        .gstRate(decimal("12"))
                        .build()
        );
        purchaseOrderItemRepository.save(
                PurchaseOrderItem.builder()
                        .purchaseOrder(purchaseOrder)
                        .medicine(glycomet)
                        .batchNumber("BT-2026-GLY-01")
                        .expiryDate(LocalDate.now().plusDays(360))
                        .quantity(30)
                        .freeQty(3)
                        .purchaseRate(decimal("18.50"))
                        .mrp(decimal("28.00"))
                        .gstRate(decimal("5"))
                        .build()
        );

        BigDecimal subtotal = decimal("1113.00");
        BigDecimal totalGst = decimal("85.38");
        BigDecimal halfGst = totalGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        purchaseOrder.setSubtotal(subtotal);
        purchaseOrder.setCgstAmount(halfGst);
        purchaseOrder.setSgstAmount(totalGst.subtract(halfGst));
        purchaseOrder.setTotalAmount(subtotal.add(totalGst));
        purchaseOrderRepository.save(purchaseOrder);
    }

    private Supplier ensureSupplier(
            String name,
            String contact,
            String phone,
            String gstin,
            String address
    ) {
        Supplier supplier = pharmaSupplierRepository.findFirstByNameIgnoreCase(name).orElse(null);
        if (supplier == null) {
            supplier = new Supplier();
        }
        supplier.setName(name);
        supplier.setContact(contact);
        supplier.setPhone(phone);
        supplier.setGstin(gstin);
        supplier.setAddress(address);
        supplier.setIsActive(true);
        return pharmaSupplierRepository.save(supplier);
    }

    private void ensureBillingHistory(Store store) {
        Invoice invoiceOne = invoiceRepository.findFirstByInvoiceNo("TNSTORE001/2026-27/00001").orElse(null);
        Invoice invoiceTwo = invoiceRepository.findFirstByInvoiceNo("TNSTORE001/2026-27/00002").orElse(null);
        Invoice invoiceThree = invoiceRepository.findFirstByInvoiceNo("TNSTORE001/2026-27/00003").orElse(null);

        PharmaUser demoUser = resolveDemoUser();
        if (demoUser == null) {
            return;
        }

        Customer ramesh = customerRepository.findByPhone("9876000001").orElse(null);
        Customer lakshmi = customerRepository.findByPhone("9876000002").orElse(null);
        Customer mohammed = customerRepository.findByPhone("9876000003").orElse(null);

        Medicine crocin = medicineRepository.findFirstByBrandNameIgnoreCase("Crocin 500").orElse(null);
        Medicine dolo = medicineRepository.findFirstByBrandNameIgnoreCase("Dolo 650").orElse(null);
        Medicine glycomet = medicineRepository.findFirstByBrandNameIgnoreCase("Glycomet 500").orElse(null);
        Medicine atorva = medicineRepository.findFirstByBrandNameIgnoreCase("Atorva 10").orElse(null);
        Medicine alprax = medicineRepository.findFirstByBrandNameIgnoreCase("Alprax 0.25").orElse(null);
        Medicine codeine = medicineRepository.findFirstByBrandNameIgnoreCase("Codeine Tab").orElse(null);

        InventoryBatch crocinBatch = findBatch(store, crocin, "BT-OLD-001");
        InventoryBatch doloBatch = findBatch(store, dolo, "BT-2026-DOLO-01");
        InventoryBatch glycometBatch = findBatch(store, glycomet, "BT-2026-GLY-01");
        InventoryBatch atorvaBatch = findBatch(store, atorva, "BT-2026-ATOR-01");
        InventoryBatch alpraxBatch = findBatch(store, alprax, "BT-2026-ALP-01");
        InventoryBatch codeineBatch = findBatch(store, codeine, "BT-2026-COD-01");

        if (invoiceOne == null && crocin != null && dolo != null && crocinBatch != null && doloBatch != null) {
            createInvoice(
                    store,
                    demoUser,
                    ramesh,
                    "TNSTORE001/2026-27/00001",
                    LocalDateTime.now().minusDays(2),
                    "CASH",
                    null,
                    null,
                    List.of(
                            DemoLineItem.builder().medicine(crocin).batch(crocinBatch).quantity(decimal("2")).unitType("STRIP").build(),
                            DemoLineItem.builder().medicine(dolo).batch(doloBatch).quantity(decimal("6")).unitType("TABLET").build()
                    )
            );
        }

        if (invoiceTwo == null && glycomet != null && atorva != null && glycometBatch != null && atorvaBatch != null) {
            createInvoice(
                    store,
                    demoUser,
                    lakshmi,
                    "TNSTORE001/2026-27/00002",
                    LocalDateTime.now().minusDays(1).withHour(16).withMinute(25),
                    "CREDIT",
                    null,
                    null,
                    List.of(
                            DemoLineItem.builder().medicine(glycomet).batch(glycometBatch).quantity(decimal("3")).unitType("STRIP").build(),
                            DemoLineItem.builder().medicine(atorva).batch(atorvaBatch).quantity(decimal("2")).unitType("STRIP").build()
                    )
            );
        }

        Invoice controlledInvoice = invoiceThree;
        if (invoiceThree == null && alprax != null && codeine != null && alpraxBatch != null && codeineBatch != null) {
            controlledInvoice = createInvoice(
                    store,
                    demoUser,
                    mohammed,
                    "TNSTORE001/2026-27/00003",
                    LocalDateTime.now().minusHours(6),
                    "CASH",
                    "Dr. Revathi Narayanan",
                    "/uploads/prescriptions/TN-STORE-001/RX-0003.pdf",
                    List.of(
                            DemoLineItem.builder().medicine(alprax).batch(alpraxBatch).quantity(decimal("1")).unitType("STRIP").build(),
                            DemoLineItem.builder().medicine(codeine).batch(codeineBatch).quantity(decimal("4")).unitType("TABLET").build()
                    )
            );
        }

        if (controlledInvoice != null && scheduleDrugRegisterRepository.countByStoreStoreId(store.getStoreId()) == 0 && alpraxBatch != null && codeineBatch != null) {
            createScheduleRegister(
                    store,
                    controlledInvoice,
                    alprax,
                    "H1",
                    "Mohammed Ali",
                    45,
                    "8 Coats Road, Chennai",
                    "Dr. Revathi Narayanan",
                    "TNMC-44291",
                    decimal("1"),
                    alpraxBatch.getBatchNumber(),
                    demoUser,
                    "/uploads/prescriptions/TN-STORE-001/RX-0003.pdf",
                    "Night dose / anxiety medicine"
            );
            createScheduleRegister(
                    store,
                    controlledInvoice,
                    codeine,
                    "X",
                    "Mohammed Ali",
                    45,
                    "8 Coats Road, Chennai",
                    "Dr. Revathi Narayanan",
                    "TNMC-44291",
                    decimal("4"),
                    codeineBatch.getBatchNumber(),
                    demoUser,
                    "/uploads/prescriptions/TN-STORE-001/RX-0003.pdf",
                    "Post-operative pain support"
            );
        }
    }

    private Invoice createInvoice(
            Store store,
            PharmaUser billedBy,
            Customer customer,
            String invoiceNo,
            LocalDateTime invoiceDate,
            String paymentMode,
            String doctorName,
            String prescriptionUrl,
            List<DemoLineItem> items
    ) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal taxableAmount = BigDecimal.ZERO;
        BigDecimal cgstAmount = BigDecimal.ZERO;
        BigDecimal sgstAmount = BigDecimal.ZERO;
        BigDecimal igstAmount = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;

        Invoice invoice = invoiceRepository.save(
                Invoice.builder()
                        .invoiceNo(invoiceNo)
                        .store(store)
                        .customer(customer)
                        .billedBy(billedBy)
                        .invoiceDate(invoiceDate)
                        .invoiceType("SALE")
                        .paymentMode(paymentMode)
                        .doctorName(doctorName)
                        .prescriptionAttached(prescriptionUrl != null && !prescriptionUrl.isBlank())
                        .prescriptionUrl(prescriptionUrl)
                        .build()
        );

        for (DemoLineItem item : items) {
            BigDecimal lineMrp = resolveDemoLineMrp(item);
            GSTBreakdown breakdown = gstCalculationService.calculate(
                    lineMrp,
                    BigDecimal.ZERO,
                    safe(item.getMedicine().getGstRate()),
                    "Tamil Nadu"
            );

            subtotal = subtotal.add(lineMrp);
            discountAmount = discountAmount.add(breakdown.getDiscountAmount());
            taxableAmount = taxableAmount.add(breakdown.getTaxableAmount());
            cgstAmount = cgstAmount.add(breakdown.getCgst());
            sgstAmount = sgstAmount.add(breakdown.getSgst());
            igstAmount = igstAmount.add(breakdown.getIgst());
            totalAmount = totalAmount.add(breakdown.getTotalAmount());

            invoiceItemRepository.save(
                    InvoiceItem.builder()
                            .invoice(invoice)
                            .medicine(item.getMedicine())
                            .batch(item.getBatch())
                            .quantity(item.getQuantity())
                            .unitType(item.getUnitType())
                            .mrp(item.getBatch() != null ? item.getBatch().getMrp() : item.getMedicine().getMrp())
                            .discountPct(BigDecimal.ZERO)
                            .taxableAmount(breakdown.getTaxableAmount())
                            .gstRate(safe(item.getMedicine().getGstRate()))
                            .cgst(breakdown.getCgst())
                            .sgst(breakdown.getSgst())
                            .igst(breakdown.getIgst())
                            .total(breakdown.getTotalAmount())
                            .build()
            );
        }

        invoice.setSubtotal(subtotal);
        invoice.setDiscountAmount(discountAmount);
        invoice.setTaxableAmount(taxableAmount);
        invoice.setCgstAmount(cgstAmount);
        invoice.setSgstAmount(sgstAmount);
        invoice.setIgstAmount(igstAmount);
        invoice.setTotalAmount(totalAmount);
        if ("CREDIT".equalsIgnoreCase(paymentMode)) {
            invoice.setAmountPaid(BigDecimal.ZERO);
            invoice.setAmountDue(totalAmount);
        } else {
            invoice.setAmountPaid(totalAmount);
            invoice.setAmountDue(BigDecimal.ZERO);
        }

        return invoiceRepository.save(invoice);
    }

    private BigDecimal resolveDemoLineMrp(DemoLineItem item) {
        BigDecimal packMrp = item.getBatch() != null && item.getBatch().getMrp() != null
                ? item.getBatch().getMrp()
                : safe(item.getMedicine().getMrp());
        if ("TABLET".equalsIgnoreCase(item.getUnitType())) {
            int packSize = item.getMedicine().getPackSize() == null || item.getMedicine().getPackSize() <= 0
                    ? 1
                    : item.getMedicine().getPackSize();
            return packMrp
                    .divide(BigDecimal.valueOf(packSize), 4, RoundingMode.HALF_UP)
                    .multiply(item.getQuantity())
                    .setScale(2, RoundingMode.HALF_UP);
        }
        return packMrp.multiply(item.getQuantity()).setScale(2, RoundingMode.HALF_UP);
    }

    private void createScheduleRegister(
            Store store,
            Invoice invoice,
            Medicine medicine,
            String scheduleType,
            String patientName,
            Integer patientAge,
            String patientAddress,
            String doctorName,
            String doctorRegNo,
            BigDecimal quantitySold,
            String batchNumber,
            PharmaUser pharmacist,
            String prescriptionUrl,
            String remarks
    ) {
        if (medicine == null) {
            return;
        }

        scheduleDrugRegisterRepository.save(
                ScheduleDrugRegister.builder()
                        .store(store)
                        .invoice(invoice)
                        .medicine(medicine)
                        .scheduleType(scheduleType)
                        .saleDate(invoice.getInvoiceDate())
                        .patientName(patientName)
                        .patientAge(patientAge)
                        .patientAddress(patientAddress)
                        .doctorName(doctorName)
                        .doctorRegNo(doctorRegNo)
                        .quantitySold(quantitySold)
                        .batchNumber(batchNumber)
                        .pharmacist(pharmacist)
                        .prescriptionUrl(prescriptionUrl)
                        .remarks(remarks)
                        .build()
        );
    }

    private void ensureAuditTrail(Store store) {
        if (auditLogRepository.countByStoreStoreId(store.getStoreId()) >= 4) {
            return;
        }

        PharmaUser demoUser = resolveDemoUser();
        Invoice creditInvoice = invoiceRepository.findFirstByInvoiceNo("TNSTORE001/2026-27/00002").orElse(null);
        Invoice controlledInvoice = invoiceRepository.findFirstByInvoiceNo("TNSTORE001/2026-27/00003").orElse(null);

        auditLogRepository.save(
                AuditLog.builder()
                        .store(store)
                        .user(demoUser)
                        .action("PURCHASE_IMPORT_COMPLETED")
                        .entityType("PURCHASE_ORDER")
                        .entityId("PO-TN001-DEMO-0001")
                        .oldValue(null)
                        .newValue("{\"supplier\":\"MedPlus Distributors\",\"rows\":2}")
                        .ipAddress("127.0.0.1")
                        .createdAt(LocalDateTime.now().minusDays(3))
                        .build()
        );
        auditLogRepository.save(
                AuditLog.builder()
                        .store(store)
                        .user(demoUser)
                        .action("INVOICE_CREATED")
                        .entityType("INVOICE")
                        .entityId(creditInvoice != null ? creditInvoice.getInvoiceId().toString() : "TNSTORE001/2026-27/00002")
                        .oldValue(null)
                        .newValue("{\"invoiceNo\":\"TNSTORE001/2026-27/00002\",\"paymentMode\":\"CREDIT\",\"totalAmount\":\"208.32\"}")
                        .ipAddress("127.0.0.1")
                        .createdAt(LocalDateTime.now().minusDays(1))
                        .build()
        );
        auditLogRepository.save(
                AuditLog.builder()
                        .store(store)
                        .user(demoUser)
                        .action("PRICE_OVERRIDE")
                        .entityType("INVOICE_ITEM")
                        .entityId(controlledInvoice != null ? controlledInvoice.getInvoiceId().toString() : "TNSTORE001/2026-27/00003")
                        .oldValue("{\"batchMrp\":\"24.00\"}")
                        .newValue("{\"invoiceMrp\":\"24.00\",\"unitType\":\"TABLET\"}")
                        .ipAddress("127.0.0.1")
                        .createdAt(LocalDateTime.now().minusHours(6))
                        .build()
        );
        auditLogRepository.save(
                AuditLog.builder()
                        .store(store)
                        .user(demoUser)
                        .action("SCHEDULE_REGISTER_UPDATED")
                        .entityType("SCHEDULE_DRUG_REGISTER")
                        .entityId("TNSTORE001-H1-00003")
                        .oldValue(null)
                        .newValue("{\"patientName\":\"Mohammed Ali\",\"doctorName\":\"Dr. Revathi Narayanan\"}")
                        .ipAddress("127.0.0.1")
                        .createdAt(LocalDateTime.now().minusHours(5))
                        .build()
        );
    }

    private InventoryBatch findBatch(Store store, Medicine medicine, String batchNumber) {
        if (store == null || medicine == null) {
            return null;
        }
        return inventoryBatchRepository.findByStoreStoreIdAndMedicineMedicineIdAndBatchNumberIgnoreCase(
                store.getStoreId(),
                medicine.getMedicineId(),
                batchNumber
        ).orElse(null);
    }

    private PharmaUser resolveDemoUser() {
        return pharmaUserRepository.findByUsername("admin")
                .orElseGet(() -> pharmaUserRepository.findAll().stream().findFirst().orElse(null));
    }

    @Getter
    @Builder
    private static class DemoLineItem {
        private Medicine medicine;
        private InventoryBatch batch;
        private BigDecimal quantity;
        private String unitType;
    }
}
