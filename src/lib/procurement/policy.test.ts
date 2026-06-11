import { describe, expect, it } from "vitest";
import { findQuotes, quoteCatalog } from "./data";
import { buildRedactedPrompt, evaluatePolicy, redactPii } from "./policy";
import { demoScenarios } from "./scenarios";
import type { ProcurementRequest } from "./types";

const request: ProcurementRequest = {
  employeeName: "Ada Lovelace",
  employeeEmail: "ada@example.com",
  department: "Public Sector Delivery",
  category: "laptop",
  quantity: 2,
  maxBudget: 4000,
  currency: "USD",
  region: "US",
  urgency: "standard",
  businessPurpose: "Equip the onboarding analysts for case management work.",
};

describe("procurement policy", () => {
  it("redacts email and phone-like values", () => {
    expect(redactPii("Contact ada@example.com or 415-555-1212")).toBe("Contact [redacted] or [redacted]");
  });

  it("builds prompts without employee PII", () => {
    const prompt = buildRedactedPrompt(request);
    expect(prompt).not.toContain(request.employeeName);
    expect(prompt).not.toContain(request.employeeEmail);
    expect(prompt).toContain("Public Sector Delivery");
  });

  it("allows in-budget allowlisted laptop requests and requires approval at threshold", () => {
    const decision = evaluatePolicy(request, quoteCatalog);
    expect(decision.allowed).toBe(true);
    expect(decision.approvalRequired).toBe(true);
    expect(decision.riskLevel).toBe("medium");
  });

  it("blocks requests above category cap", () => {
    const decision = evaluatePolicy({ ...request, maxBudget: 9000 }, quoteCatalog);
    expect(decision.allowed).toBe(false);
    expect(decision.blockers[0]).toContain("category cap");
  });

  it("keeps the Approval Required demo scenario on the approval path", () => {
    const scenario = demoScenarios.find((item) => item.id === "approval-required");
    expect(scenario).toBeDefined();

    const quotes = findQuotes(scenario!.request);
    const decision = evaluatePolicy(scenario!.request, quotes);

    expect(decision.allowed).toBe(true);
    expect(decision.approvalRequired).toBe(true);
  });

  it("keeps the Policy Blocked demo scenario blocked", () => {
    const scenario = demoScenarios.find((item) => item.id === "policy-blocked");
    expect(scenario).toBeDefined();

    const quotes = findQuotes(scenario!.request);
    const decision = evaluatePolicy(scenario!.request, quotes);

    expect(decision.allowed).toBe(false);
    expect(decision.blockers.length).toBeGreaterThan(0);
  });

  it("keeps the Low Risk Auto Submit demo scenario below approval thresholds", () => {
    const scenario = demoScenarios.find((item) => item.id === "low-risk-auto-submit");
    expect(scenario).toBeDefined();

    const quotes = findQuotes(scenario!.request);
    const decision = evaluatePolicy(scenario!.request, quotes);

    expect(decision.allowed).toBe(true);
    expect(decision.approvalRequired).toBe(false);
  });
});
