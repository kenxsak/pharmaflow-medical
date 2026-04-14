package com.pharmaflow.billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@Builder
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceSequenceId implements Serializable {

    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "financial_year", length = 10)
    private String financialYear;
}
