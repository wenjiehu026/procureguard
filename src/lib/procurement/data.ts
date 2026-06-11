import type { ProcurementCategory, VendorQuote } from "./types";

export const allowedVendors = new Set([
  "Atlas Hardware",
  "CivicStack Supply",
  "Northstar Devices",
  "Verde Compute",
]);

export const categoryLabels: Record<ProcurementCategory, string> = {
  laptop: "Laptop",
  monitor: "Monitor",
  "security-key": "Security key",
  "mobile-device": "Mobile device",
  accessory: "Accessory",
};

export const quoteCatalog: VendorQuote[] = [
  {
    id: "q-atlas-laptop-14",
    vendor: "Atlas Hardware",
    vendorDomain: "api.procureguard.local",
    category: "laptop",
    itemName: "AtlasBook 14 Secure",
    unitPrice: 1480,
    currency: "USD",
    quantityAvailable: 52,
    deliveryDays: 5,
    sustainabilityScore: 86,
    warrantyMonths: 36,
    dataResidency: "Global",
    allowed: true,
  },
  {
    id: "q-civic-laptop-15",
    vendor: "CivicStack Supply",
    vendorDomain: "api.procureguard.local",
    category: "laptop",
    itemName: "Civic Pro 15 TEE Ready",
    unitPrice: 1710,
    currency: "USD",
    quantityAvailable: 25,
    deliveryDays: 3,
    sustainabilityScore: 78,
    warrantyMonths: 48,
    dataResidency: "US",
    allowed: true,
  },
  {
    id: "q-discount-laptop",
    vendor: "OpenBox Direct",
    vendorDomain: "api.openbox.invalid",
    category: "laptop",
    itemName: "OpenBox Ultralight",
    unitPrice: 1195,
    currency: "USD",
    quantityAvailable: 11,
    deliveryDays: 9,
    sustainabilityScore: 58,
    warrantyMonths: 12,
    dataResidency: "Global",
    allowed: false,
  },
  {
    id: "q-verde-monitor",
    vendor: "Verde Compute",
    vendorDomain: "api.procureguard.local",
    category: "monitor",
    itemName: "VerdeView 27 Low Power",
    unitPrice: 360,
    currency: "USD",
    quantityAvailable: 80,
    deliveryDays: 4,
    sustainabilityScore: 94,
    warrantyMonths: 36,
    dataResidency: "EU",
    allowed: true,
  },
  {
    id: "q-northstar-key",
    vendor: "Northstar Devices",
    vendorDomain: "api.procureguard.local",
    category: "security-key",
    itemName: "Northstar Passkey NFC",
    unitPrice: 42,
    currency: "USD",
    quantityAvailable: 900,
    deliveryDays: 2,
    sustainabilityScore: 74,
    warrantyMonths: 24,
    dataResidency: "Global",
    allowed: true,
  },
  {
    id: "q-atlas-mobile",
    vendor: "Atlas Hardware",
    vendorDomain: "api.procureguard.local",
    category: "mobile-device",
    itemName: "Atlas Mobile MDM Edition",
    unitPrice: 880,
    currency: "USD",
    quantityAvailable: 40,
    deliveryDays: 6,
    sustainabilityScore: 72,
    warrantyMonths: 24,
    dataResidency: "US",
    allowed: true,
  },
  {
    id: "q-civic-accessory",
    vendor: "CivicStack Supply",
    vendorDomain: "api.procureguard.local",
    category: "accessory",
    itemName: "USB-C Docking Kit",
    unitPrice: 190,
    currency: "USD",
    quantityAvailable: 120,
    deliveryDays: 3,
    sustainabilityScore: 82,
    warrantyMonths: 24,
    dataResidency: "Global",
    allowed: true,
  },
];

export function findQuotes(input: {
  category: ProcurementCategory;
  quantity: number;
  maxBudget: number;
}) {
  return quoteCatalog
    .filter((quote) => quote.category === input.category)
    .map((quote) => ({
      ...quote,
      totalPrice: quote.unitPrice * input.quantity,
      withinBudget: quote.unitPrice * input.quantity <= input.maxBudget,
    }))
    .sort((a, b) => {
      if (a.allowed !== b.allowed) return a.allowed ? -1 : 1;
      if (a.withinBudget !== b.withinBudget) return a.withinBudget ? -1 : 1;
      return a.totalPrice - b.totalPrice;
    });
}
