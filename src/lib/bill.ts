// Turns a saved order into the figures printed on the customer's bill. Pure, so it can be tested.

export interface BillItem {
  name: string;
  quantity: string;
  price: number;
  unitPrice?: number;
  listPrice?: number;
  gstRate?: number;
  gstAmount?: number;
  hsn?: string;
}

export interface BillOrder {
  order_number: number;
  created_at: string;
  items: BillItem[];
  total: number;
  delivery_fee: number;
  subtotal?: number | null;
  gst_total?: number | null;
  gst_inclusive?: boolean | null;
}

export interface BillLine {
  n: number;
  name: string;
  hsn: string;
  quantity: string;
  rate: number | null; // per kg / dozen, as charged
  taxable: number;
  gstRate: number;
  gst: number;
  amount: number; // taxable + gst
}

export interface TaxRow {
  rate: number;
  taxable: number;
  cgst: number;
  sgst: number;
}

export interface Bill {
  lines: BillLine[];
  itemsTotal: number; // sum of line amounts
  taxableTotal: number;
  gstTotal: number;
  inclusive: boolean;
  deliveryFee: number;
  roundOff: number;
  total: number;
  taxRows: TaxRow[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function buildBill(o: BillOrder): Bill {
  const inclusive = o.gst_inclusive === true;
  const lines: BillLine[] = o.items.map((it, i) => {
    const gst = r2(Number(it.gstAmount) || 0);
    const rate = Number(it.gstRate) || 0;
    // Saved price is what the customer pays for the goods; GST sits inside it (inclusive) or on top of it.
    const taxable = inclusive ? r2(it.price - gst) : it.price;
    return {
      n: i + 1,
      name: it.name,
      hsn: it.hsn ?? "",
      quantity: it.quantity,
      rate: it.unitPrice ?? null,
      taxable,
      gstRate: rate,
      gst,
      amount: inclusive ? it.price : r2(it.price + gst),
    };
  });

  const taxableTotal = r2(lines.reduce((n, l) => n + l.taxable, 0));
  const gstTotal = r2(lines.reduce((n, l) => n + l.gst, 0));
  const itemsTotal = r2(lines.reduce((n, l) => n + l.amount, 0));
  const deliveryFee = Number(o.delivery_fee) || 0;
  const roundOff = r2(o.total - (itemsTotal + deliveryFee));

  const groups = new Map<number, TaxRow>();
  for (const l of lines) {
    if (!l.gstRate) continue;
    const g = groups.get(l.gstRate) ?? { rate: l.gstRate, taxable: 0, cgst: 0, sgst: 0 };
    g.taxable = r2(g.taxable + l.taxable);
    g.cgst = r2(g.cgst + l.gst / 2);
    g.sgst = r2(g.sgst + l.gst / 2);
    groups.set(l.gstRate, g);
  }
  return {
    lines,
    itemsTotal,
    taxableTotal,
    gstTotal,
    inclusive,
    deliveryFee,
    roundOff,
    total: o.total,
    taxRows: [...groups.values()].sort((a, b) => a.rate - b.rate),
  };
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ""));
  else if (n > 0) parts.push(ONES[n]);
  return parts.join(" ");
}

/** 1250 -> "Rupees One Thousand Two Hundred Fifty Only" (Indian lakh / crore style). */
export function rupeesInWords(amount: number): string {
  let n = Math.round(amount);
  if (n === 0) return "Rupees Zero Only";
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const parts = [
    crore && `${below1000(crore)} Crore`,
    lakh && `${below1000(lakh)} Lakh`,
    thousand && `${below1000(thousand)} Thousand`,
    n && below1000(n),
  ].filter(Boolean);
  return `Rupees ${parts.join(" ")} Only`;
}
