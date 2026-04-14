package com.pharmaflow.billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptBranding {

    private String brandName;
    private String tagline;
    private String supportEmail;
    private String supportPhone;
}
