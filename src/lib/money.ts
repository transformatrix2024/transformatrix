// Amounts are stored as integer paise (₹1 = 100 paise), which is also what
// Razorpay expects, so there is never any floating-point rounding.

export function formatPaise(paise: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

// "1,499" or "1499.50" → 149950. Returns null for anything else.
export function parseRupees(input: string): number | null {
  const s = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [rupees, paise = ""] = s.split(".");
  return Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
}

// 149950 → "1499.50", 150000 → "1500" (for form inputs).
export function paiseToRupeesInput(paise: number) {
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}
