// India GST Calculation Utility
// MRP in India is GST-inclusive. We reverse-calculate tax from MRP.

const HOME_STATE = 'Tamil Nadu';

function calculateGST(mrp, discountPct, gstRate, customerState) {
  const discount = mrp * discountPct / 100;
  const priceAfterDiscount = mrp - discount;

  // Reverse calc: taxable = price / (1 + gst%)
  const gstMultiplier = 1 + gstRate / 100;
  const taxableAmount = +(priceAfterDiscount / gstMultiplier).toFixed(2);
  const totalGst = +(priceAfterDiscount - taxableAmount).toFixed(2);

  let cgst = 0, sgst = 0, igst = 0;
  const state = customerState || HOME_STATE;
  if (state.toLowerCase() === HOME_STATE.toLowerCase()) {
    cgst = +(totalGst / 2).toFixed(2);
    sgst = +(totalGst - cgst).toFixed(2);
  } else {
    igst = totalGst;
  }

  return { mrp, discount, priceAfterDiscount, taxableAmount, gstRate, cgst, sgst, igst, totalAmount: +priceAfterDiscount.toFixed(2) };
}

function calculateInvoiceTotals(items, customerState) {
  let subtotal = 0, totalDiscount = 0, totalTaxable = 0;
  let totalCgst = 0, totalSgst = 0, totalIgst = 0, totalAmount = 0;

  const computed = items.map(item => {
    const lineTotal = item.mrp * item.quantity;
    const gst = calculateGST(lineTotal, item.discountPct || 0, item.gstRate, customerState);
    subtotal += lineTotal;
    totalDiscount += gst.discount;
    totalTaxable += gst.taxableAmount;
    totalCgst += gst.cgst;
    totalSgst += gst.sgst;
    totalIgst += gst.igst;
    totalAmount += gst.totalAmount;
    return { ...item, ...gst };
  });

  const roundOff = +(Math.round(totalAmount) - totalAmount).toFixed(2);

  return {
    items: computed,
    subtotal: +subtotal.toFixed(2),
    discountAmount: +totalDiscount.toFixed(2),
    taxableAmount: +totalTaxable.toFixed(2),
    cgstAmount: +totalCgst.toFixed(2),
    sgstAmount: +totalSgst.toFixed(2),
    igstAmount: +totalIgst.toFixed(2),
    roundOff,
    totalAmount: Math.round(totalAmount)
  };
}

// PTR/PTS margin calculation
function calculateMargins(mrp, ptr, pts) {
  return {
    ptrMargin: ptr ? +((mrp - ptr) / mrp * 100).toFixed(2) : null,
    ptsMargin: pts ? +((mrp - pts) / mrp * 100).toFixed(2) : null,
    retailerMargin: ptr && pts ? +((ptr - pts) / ptr * 100).toFixed(2) : null
  };
}

module.exports = { calculateGST, calculateInvoiceTotals, calculateMargins };
