package com.lifepill.possystem.dto.requestDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * The type Request order details save dto.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
public class RequestOrderDetailsSaveDTO {
    private String name;
    private Double amount;
    private long id;

}
