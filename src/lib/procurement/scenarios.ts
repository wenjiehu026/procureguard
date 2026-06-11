import type { DemoScenario } from "./types";

export const demoScenarios: DemoScenario[] = [
  {
    id: "approval-required",
    label: "Approval Required",
    description: "A government delivery team needs laptops. The agent can recommend a supplier, but must pause for approval.",
    expectedOutcome: "Approval required before submission",
    request: {
      employeeName: "Ada Lovelace",
      employeeEmail: "ada@example.gov",
      department: "Public Sector Delivery",
      category: "laptop",
      quantity: 2,
      maxBudget: 4000,
      currency: "USD",
      region: "US",
      urgency: "standard",
      businessPurpose:
        "Equip new analysts for secure case management and field reporting without exposing employee personal data to the agent.",
    },
  },
  {
    id: "policy-blocked",
    label: "Policy Blocked",
    description: "A request exceeds the category cap, so the agent must stop before any delegated transaction.",
    expectedOutcome: "Blocked by policy guardrails",
    request: {
      employeeName: "Grace Hopper",
      employeeEmail: "grace@example.gov",
      department: "Digital Transformation Office",
      category: "laptop",
      quantity: 3,
      maxBudget: 9000,
      currency: "USD",
      region: "US",
      urgency: "expedite",
      businessPurpose:
        "Replace temporary field devices for an urgent incident response program while keeping procurement policy enforced.",
    },
  },
  {
    id: "low-risk-auto-submit",
    label: "Low Risk Auto Submit",
    description: "A small security-key order stays under policy thresholds, so the agent can submit without human approval.",
    expectedOutcome: "Auto-submitted without approval",
    request: {
      employeeName: "Katherine Johnson",
      employeeEmail: "katherine@example.gov",
      department: "Identity Operations",
      category: "security-key",
      quantity: 2,
      maxBudget: 110,
      currency: "USD",
      region: "US",
      urgency: "standard",
      businessPurpose:
        "Issue backup passkeys for two operations staff who support privileged access recovery workflows.",
    },
  },
];

export const defaultScenario = demoScenarios[0];
