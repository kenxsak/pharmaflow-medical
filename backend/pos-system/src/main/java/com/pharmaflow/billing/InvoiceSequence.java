package com.pharmaflow.billing;

import com.pharmaflow.store.Store;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.MapsId;
import javax.persistence.PrePersist;
import javax.persistence.Table;

@Entity
@Table(name = "invoice_sequence")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceSequence {

    @EmbeddedId
    private InvoiceSequenceId id;

    @MapsId("storeId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @javax.persistence.Column(name = "last_number")
    private Integer lastNumber;

    @PrePersist
    public void prePersist() {
        if (lastNumber == null) {
            lastNumber = 0;
        }
    }
}
