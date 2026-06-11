"use client";

import {
  Activity,
  BadgeCheck,
  Boxes,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  FileClock,
  KeyRound,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { categoryLabels } from "@/lib/procurement/data";
import { defaultScenario, demoScenarios } from "@/lib/procurement/scenarios";
import type {
  AgentEvent,
  DemoScenario,
  PolicyDecision,
  ProcurementRequest,
  PurchaseSubmission,
  VendorQuote,
} from "@/lib/procurement/types";
import type { T3Status } from "@/lib/t3/status";

type StreamState = "idle" | "running" | "approval" | "submitted" | "blocked" | "error";

export function ProcurementDashboard({ initialStatus }: { initialStatus: T3Status }) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<DemoScenario["id"]>(defaultScenario.id);
  const [loadedScenarioId, setLoadedScenarioId] = useState<DemoScenario["id"]>(defaultScenario.id);
  const [request, setRequest] = useState<ProcurementRequest>({ ...defaultScenario.request });
  const [status, setStatus] = useState<T3Status>(initialStatus);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [state, setState] = useState<StreamState>("idle");
  const [approvalPayload, setApprovalPayload] = useState<{ quoteId: string; amount: number; currency: string } | null>(
    null,
  );

  const selectedScenario = useMemo(
    () => demoScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? defaultScenario,
    [selectedScenarioId],
  );

  const loadedScenario = useMemo(
    () => demoScenarios.find((scenario) => scenario.id === loadedScenarioId) ?? defaultScenario,
    [loadedScenarioId],
  );

  const quotes = useMemo(() => {
    const quoteEvent = [...events].reverse().find((event) => event.type === "quotes");
    const payload = quoteEvent?.payload as { quotes?: VendorQuote[] } | undefined;
    return payload?.quotes ?? [];
  }, [events]);

  const policyDecision = useMemo(() => {
    const policyEvent = [...events]
      .reverse()
      .find((event) => event.type === "policy" || (event.type === "blocked" && hasPolicyPayload(event.payload)));
    const payload = policyEvent?.payload as { policy?: PolicyDecision } | undefined;
    return payload?.policy ?? null;
  }, [events]);

  const submissionReceipt = useMemo(() => {
    const submittedEvent = [...events].reverse().find((event) => event.type === "submitted");
    const payload = submittedEvent?.payload as { submitted?: PurchaseSubmission } | undefined;
    return payload?.submitted ?? null;
  }, [events]);

  const receiptFingerprint = useMemo(
    () => (submissionReceipt ? fingerprintJson(submissionReceipt) : null),
    [submissionReceipt],
  );

  const grantPayload = useMemo(() => buildGrantPayloadPreview(status), [status]);

  const metrics = useMemo(() => {
    const allowlisted = quotes.filter((quote) => quote.allowed).length;
    const best = quotes.find((quote) => quote.allowed);

    return {
      allowlisted,
      bestPrice: best ? best.unitPrice * request.quantity : 0,
      risk: policyDecision?.riskLevel,
    };
  }, [policyDecision, quotes, request.quantity]);

  const nextAction = getNextAction(state, Boolean(approvalPayload), Boolean(submissionReceipt), policyDecision);
  const runButtonText = getRunButtonText(state);

  async function refreshStatus() {
    const response = await fetch("/api/t3/status", { method: "POST" });
    setStatus((await response.json()) as T3Status);
  }

  function exportAuditJson() {
    const audit = {
      exportedAt: new Date().toISOString(),
      scenario: loadedScenario,
      terminal3: {
        mode: status.mode,
        environment: status.environment,
        tenantDid: status.tenantDid,
        agentDid: status.agentDid,
        contractScript: status.contractScript,
        contractVersion: status.contractVersion,
        grantStatus: status.grantStatus,
        allowedHosts: status.allowedHosts,
        readiness: status.readiness,
      },
      grantPayload,
      receipt: submissionReceipt,
      receiptFingerprint,
      events,
    };
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `procureguard-audit-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearRunState() {
    setEvents([]);
    setApprovalPayload(null);
    setState("idle");
  }

  function loadScenario() {
    loadScenarioById(selectedScenario.id);
  }

  function loadScenarioById(scenarioId: DemoScenario["id"]) {
    const scenario = demoScenarios.find((item) => item.id === scenarioId) ?? defaultScenario;
    setSelectedScenarioId(scenario.id);
    setRequest({ ...scenario.request });
    setLoadedScenarioId(scenario.id);
    clearRunState();
  }

  function resetDemo() {
    const scenario = demoScenarios.find((item) => item.id === loadedScenarioId) ?? defaultScenario;
    setRequest({ ...scenario.request });
    clearRunState();
  }

  async function runAgent(approval?: { approved: boolean; approvalId?: string }) {
    setState("running");
    if (!approval) {
      setEvents([]);
      setApprovalPayload(null);
    }

    const response = await fetch("/api/agent/procure", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ request, approval }),
    });

    if (!response.body) {
      setState("error");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line) as AgentEvent;
        setEvents((current) => [...current, event]);

        if (event.type === "approval-requested") {
          setApprovalPayload(event.payload as { quoteId: string; amount: number; currency: string });
          setState("approval");
        } else if (event.type === "submitted") {
          setApprovalPayload(null);
          setState("submitted");
        } else if (event.type === "blocked" || event.type === "approval-denied") {
          setApprovalPayload(null);
          setState("blocked");
        } else if (event.type === "error") {
          setState("error");
        }
      }
    }

    setState((current) => (current === "running" ? "idle" : current));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1>ProcureGuard</h1>
            <p>Enterprise procurement agent with verifiable Terminal 3 authorization</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span className={`badge ${status.mode === "real" ? "green" : "amber"}`}>
            <LockKeyhole size={14} />
            {status.mode === "real" ? "T3 real mode" : "T3 mock mode"}
          </span>
          <button className="button secondary" type="button" onClick={refreshStatus} title="Refresh T3 status">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      <section className="demo-guide" aria-label="Demo guide">
        <div className="demo-guide-main">
          <div>
            <span className="badge teal">Judge demo path</span>
            <h2>{loadedScenario.label}</h2>
            <p>{loadedScenario.description}</p>
          </div>
          <div className="guide-visuals">
            <div className="stepper" aria-label="Demo steps">
              <Step number="1" label="Select scenario" active={state === "idle"} complete={events.length > 0} />
              <Step
                number="2"
                label="Run agent"
                active={state === "running" || state === "approval"}
                complete={state === "approval" || state === "submitted" || state === "blocked"}
              />
              <Step
                number="3"
                label="Approve / inspect"
                active={state === "submitted" || state === "blocked"}
                complete={state === "submitted" || state === "blocked"}
              />
            </div>
            <TrustPath status={status} state={state} hasEvents={events.length > 0} hasReceipt={Boolean(submissionReceipt)} />
          </div>
        </div>
        <div className="scenario-controls">
          <div className="scenario-card-grid" aria-label="Scenario selector">
            {demoScenarios.map((scenario) => (
              <button
                className={`scenario-card ${scenario.id === loadedScenarioId ? "active" : ""} ${scenarioTone(scenario.id)}`}
                key={scenario.id}
                type="button"
                onClick={() => loadScenarioById(scenario.id)}
              >
                <span>{scenario.label}</span>
                <strong>{scenario.expectedOutcome}</strong>
              </button>
            ))}
          </div>
          <div className="guide-actions">
            <button className="button secondary" type="button" onClick={loadScenario}>
              Load scenario
            </button>
            <button className="button ghost" type="button" onClick={resetDemo}>
              Reset demo
            </button>
          </div>
          <div className="next-action">
            <span>Next action</span>
            <strong>{nextAction}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard">
        <aside className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <ClipboardCheck size={18} />
                Request
              </h2>
              <p className="panel-subtitle">PII stays out of agent prompts and is sent through placeholders.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="field-row">
              <Field label="Employee name">
                <input value={request.employeeName} onChange={(event) => setRequestValue("employeeName", event.target.value)} />
              </Field>
              <Field label="Employee email">
                <input value={request.employeeEmail} onChange={(event) => setRequestValue("employeeEmail", event.target.value)} />
              </Field>
            </div>
            <Field label="Department">
              <input value={request.department} onChange={(event) => setRequestValue("department", event.target.value)} />
            </Field>
            <div className="field-row">
              <Field label="Category">
                <select
                  value={request.category}
                  onChange={(event) => setRequestValue("category", event.target.value as ProcurementRequest["category"])}
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Region">
                <select
                  value={request.region}
                  onChange={(event) => setRequestValue("region", event.target.value as ProcurementRequest["region"])}
                >
                  <option value="US">US</option>
                  <option value="EU">EU</option>
                  <option value="APAC">APAC</option>
                </select>
              </Field>
            </div>
            <div className="field-row">
              <Field label="Quantity">
                <input
                  type="number"
                  min={1}
                  value={request.quantity}
                  onChange={(event) => setRequestValue("quantity", Number(event.target.value))}
                />
              </Field>
              <Field label="Max budget">
                <input
                  type="number"
                  min={50}
                  value={request.maxBudget}
                  onChange={(event) => setRequestValue("maxBudget", Number(event.target.value))}
                />
              </Field>
            </div>
            <Field label="Urgency">
              <select
                value={request.urgency}
                onChange={(event) => setRequestValue("urgency", event.target.value as ProcurementRequest["urgency"])}
              >
                <option value="standard">Standard</option>
                <option value="expedite">Expedite</option>
              </select>
            </Field>
            <Field label="Business purpose">
              <textarea
                value={request.businessPurpose}
                onChange={(event) => setRequestValue("businessPurpose", event.target.value)}
              />
            </Field>
            <button className="button" type="button" onClick={() => runAgent()} disabled={state === "running"}>
              {state === "running" ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
              {runButtonText}
            </button>
          </div>

          <div className="status-row" style={{ marginTop: 18 }}>
            <StatusLine label="Tenant DID" value={status.tenantDid} />
            <StatusLine label="Agent DID" value={status.agentDid} />
            <StatusLine label="Contract" value={status.contractTail} />
            <StatusLine label="Grant" value={status.grantStatus} />
          </div>
        </aside>

        <section className="panel workstream">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <Activity size={18} />
                Agent Workstream
              </h2>
              <p className="panel-subtitle">Authorization, policy checks, quote search, approval, and submission.</p>
            </div>
            <span className={`badge ${stateBadge(state)}`}>{state}</span>
          </div>

          {events.length === 0 ? (
            <div className="empty">Run the agent to see a streamed audit trail.</div>
          ) : (
            <div className="event-list">
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}

          <div className="split">
            <section>
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">
                    <CircleDollarSign size={18} />
                    Quotes
                  </h2>
                </div>
              </div>
              <div className="quote-list">
                {quotes.length === 0 ? (
                  <div className="empty">No quotes yet.</div>
                ) : (
                  quotes.map((quote) => <QuoteRow key={quote.id} quote={quote} quantity={request.quantity} />)
                )}
              </div>
            </section>

            <section>
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">
                    <FileClock size={18} />
                    Approval
                  </h2>
                </div>
              </div>
              <div className="approval">
                <h3>{getApprovalTitle(state, approvalPayload, submissionReceipt)}</h3>
                <p>
                  {approvalPayload
                    ? `Approve ${approvalPayload.amount} ${approvalPayload.currency} for quote ${approvalPayload.quoteId}.`
                    : submissionReceipt
                      ? `Submitted ${submissionReceipt.requestId} with ${submissionReceipt.piiHandling}.`
                    : "Low-risk requests can auto-submit; higher-risk requests pause here."}
                </p>
                <div className="approval-actions">
                  <button
                    className="button approve"
                    type="button"
                    disabled={!approvalPayload || state === "running"}
                    onClick={() => runAgent({ approved: true, approvalId: `mgr-${Date.now().toString(36)}` })}
                  >
                    <Check size={16} />
                    Approve
                  </button>
                  <button
                    className="button deny"
                    type="button"
                    disabled={!approvalPayload || state === "running"}
                    onClick={() => runAgent({ approved: false })}
                  >
                    <X size={16} />
                    Deny
                  </button>
                </div>
              </div>
            </section>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">
                <KeyRound size={18} />
                Security Posture
              </h2>
              <p className="panel-subtitle">What the bounty judges should notice.</p>
            </div>
          </div>

          <div className="metric-row">
            <Metric label="Allowlisted quotes" value={String(metrics.allowlisted)} />
            <Metric label="Best eligible total" value={metrics.bestPrice ? `$${metrics.bestPrice}` : "-"} />
            <Metric label="Policy risk" value={metrics.risk ?? "-"} />
          </div>

          <div className="timeline" style={{ marginTop: 18 }}>
            <SecurityNote
              title="No PII in prompts"
              detail="The prompt contains department, category, budget, and purpose after email/phone redaction."
            />
            <SecurityNote
              title="Scoped agent grant"
              detail="The intended grant is function-scoped to search-vendors and submit-purchase-request."
            />
            <SecurityNote
              title="Host-scoped egress"
              detail={`Allowed host: ${status.allowedHosts.join(", ")}. T3 denies outbound HTTP without the user's grant.`}
            />
            <SecurityNote
              title="Placeholder submission"
              detail="Employee name, email, and department are represented as T3 profile placeholders during submit."
            />
          </div>

          <div className="panel-header" style={{ marginTop: 22 }}>
            <div>
              <h2 className="panel-title">
                <BadgeCheck size={18} />
                Result Evidence
              </h2>
            </div>
            <button className="button secondary icon-button" type="button" onClick={exportAuditJson} disabled={events.length === 0}>
              <Download size={16} />
              Export
            </button>
          </div>
          <ResultEvidence
            receipt={submissionReceipt}
            receiptFingerprint={receiptFingerprint}
            policy={policyDecision}
            state={state}
          />

          <div className="panel-header" style={{ marginTop: 22 }}>
            <div>
              <h2 className="panel-title">
                <LockKeyhole size={18} />
                T3 Evidence
              </h2>
            </div>
          </div>
          <div className="evidence-grid">
            <EvidenceRow label="Contract tail" value={status.contractTail} />
            <EvidenceRow label="Functions" value="search-vendors, submit-purchase-request" />
            <EvidenceRow label="Allowed host" value={status.allowedHosts.join(", ")} />
            <EvidenceRow label="Grant mode" value={status.grantStatus} />
            <EvidenceRow label="PII path" value="http-with-placeholders" />
          </div>

          <details className="grant-viewer">
            <summary>Grant Payload Viewer</summary>
            <pre>{JSON.stringify(grantPayload, null, 2)}</pre>
          </details>

          <div className="panel-header" style={{ marginTop: 22 }}>
            <div>
              <h2 className="panel-title">
                <ShieldCheck size={18} />
                Real Mode Readiness
              </h2>
              <p className="panel-subtitle">What remains before a real Terminal 3 smoke test.</p>
            </div>
          </div>
          <div className="readiness-list">
            {status.readiness.map((check) => (
              <div className={`readiness-item ${check.status}`} key={check.id}>
                <span>{check.status === "pass" ? <Check size={14} /> : check.status === "warning" ? "!" : <X size={14} />}</span>
                <div>
                  <strong>{check.label}</strong>
                  <p>{check.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="panel-header" style={{ marginTop: 22 }}>
            <div>
              <h2 className="panel-title">
                <Boxes size={18} />
                Audit
              </h2>
            </div>
          </div>
          <div className="audit-list">
            {events.slice(-6).map((event) => (
              <div className="audit" key={`audit-${event.id}`}>
                <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
                <p>{event.title}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );

  function setRequestValue<K extends keyof ProcurementRequest>(key: K, value: ProcurementRequest[K]) {
    setRequest((current) => ({ ...current, [key]: value }));
  }
}

function Step({ number, label, active, complete }: { number: string; label: string; active: boolean; complete: boolean }) {
  return (
    <div className={`step ${active ? "active" : ""} ${complete ? "complete" : ""}`}>
      <span>{complete ? <Check size={14} /> : number}</span>
      <strong>{label}</strong>
    </div>
  );
}

function TrustPath({
  status,
  state,
  hasEvents,
  hasReceipt,
}: {
  status: T3Status;
  state: StreamState;
  hasEvents: boolean;
  hasReceipt: boolean;
}) {
  const grantActive = hasEvents || state === "running" || state === "approval" || state === "submitted";
  const contractActive = grantActive && state !== "idle";
  const hostActive = hasReceipt || state === "submitted";

  return (
    <div className="trust-path" aria-label="Terminal 3 trust path">
      <TrustNode label="User" value="Delegated intent" active={true} />
      <TrustLink active={grantActive} />
      <TrustNode label="Agent Auth Grant" value={status.grantStatus} active={grantActive} />
      <TrustLink active={contractActive} />
      <TrustNode label="TEE Contract" value={status.contractTail} active={contractActive} />
      <TrustLink active={hostActive} />
      <TrustNode label="Approved Host" value={status.allowedHosts[0] ?? "pending"} active={hostActive} />
    </div>
  );
}

function TrustNode({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className={`trust-node ${active ? "active" : ""}`}>
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function TrustLink({ active }: { active: boolean }) {
  return <div className={`trust-link ${active ? "active" : ""}`} aria-hidden="true" />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-line">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ResultEvidence({
  receipt,
  receiptFingerprint,
  policy,
  state,
}: {
  receipt: PurchaseSubmission | null;
  receiptFingerprint: string | null;
  policy: PolicyDecision | null;
  state: StreamState;
}) {
  if (receipt) {
    return (
      <div className="evidence-grid">
        <EvidenceRow label="Request id" value={receipt.requestId} />
        <EvidenceRow label="Quote id" value={receipt.quoteId} />
        <EvidenceRow label="Amount" value={`${receipt.amount} ${receipt.currency}`} />
        <EvidenceRow label="Approval id" value={receipt.approvalId} />
        <EvidenceRow label="PII handling" value={receipt.piiHandling} />
        <EvidenceRow label="Receipt hash" value={receiptFingerprint ?? "-"} />
      </div>
    );
  }

  if (state === "blocked" && policy?.blockers.length) {
    return (
      <div className="blocker-list">
        {policy.blockers.map((blocker) => (
          <div className="blocker" key={blocker}>
            <X size={15} />
            <span>{blocker}</span>
          </div>
        ))}
      </div>
    );
  }

  return <div className="empty compact">Run a scenario to generate a receipt or blocker summary.</div>;
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="evidence-row">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function EventRow({ event }: { event: AgentEvent }) {
  return (
    <article className="event">
      <div className="event-icon">{eventIcon(event.type)}</div>
      <div>
        <time>{new Date(event.timestamp).toLocaleTimeString()}</time>
        <h3>{event.title}</h3>
        <p>{event.detail}</p>
      </div>
    </article>
  );
}

function QuoteRow({ quote, quantity }: { quote: VendorQuote & { totalPrice?: number; withinBudget?: boolean }; quantity: number }) {
  const total = quote.unitPrice * quantity;

  return (
    <article className="quote">
      <div className="quote-head">
        <div>
          <h3>{quote.itemName}</h3>
          <p>{quote.vendor}</p>
        </div>
        <div className="quote-price">${total}</div>
      </div>
      <div className="quote-meta">
        <span className={`badge ${quote.allowed ? "green" : "red"}`}>
          {quote.allowed ? "allowlisted" : "blocked vendor"}
        </span>
        <span className={`badge ${quote.withinBudget ? "teal" : "amber"}`}>
          {quote.withinBudget ? "in budget" : "over budget"}
        </span>
        <span className="badge violet">{quote.deliveryDays}d delivery</span>
        <span className="badge teal">{quote.warrantyMonths}m warranty</span>
      </div>
    </article>
  );
}

function SecurityNote({ title, detail }: { title: string; detail: string }) {
  return (
    <article className="approval">
      <h3>{title}</h3>
      <p>{detail}</p>
    </article>
  );
}

function eventIcon(type: AgentEvent["type"]) {
  if (type === "auth") return <LockKeyhole size={15} />;
  if (type === "policy") return <ShieldCheck size={15} />;
  if (type === "quotes") return <CircleDollarSign size={15} />;
  if (type === "approval-requested") return <FileClock size={15} />;
  if (type === "submitted") return <BadgeCheck size={15} />;
  if (type === "blocked" || type === "error") return <X size={15} />;
  return <Sparkles size={15} />;
}

function stateBadge(state: StreamState) {
  if (state === "submitted") return "green";
  if (state === "approval" || state === "running") return "amber";
  if (state === "blocked" || state === "error") return "red";
  return "teal";
}

function scenarioTone(scenarioId: DemoScenario["id"]) {
  if (scenarioId === "approval-required") return "scenario-approval";
  if (scenarioId === "policy-blocked") return "scenario-blocked";
  return "scenario-auto";
}

function hasPolicyPayload(payload: unknown): payload is { policy: PolicyDecision } {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "policy" in payload &&
      (payload as { policy?: unknown }).policy &&
      typeof (payload as { policy?: unknown }).policy === "object",
  );
}

function getRunButtonText(state: StreamState) {
  if (state === "running") return "Running agent";
  if (state === "approval") return "Waiting for approval";
  if (state === "submitted") return "Submitted";
  if (state === "blocked") return "Blocked";
  return "Run procurement agent";
}

function getNextAction(
  state: StreamState,
  hasApprovalPayload: boolean,
  hasReceipt: boolean,
  policy: PolicyDecision | null,
) {
  if (state === "running") return "Watch the agent workstream";
  if (hasApprovalPayload) return "Approve or deny the delegated action";
  if (hasReceipt) return "Inspect the submission receipt";
  if (state === "blocked" || policy?.blockers.length) return "Inspect policy blockers";
  if (state === "error") return "Inspect the error event";
  return "Run the selected scenario";
}

function getApprovalTitle(
  state: StreamState,
  approvalPayload: { quoteId: string; amount: number; currency: string } | null,
  receipt: PurchaseSubmission | null,
) {
  if (approvalPayload) return "Manager approval pending";
  if (receipt) return "Submission complete";
  if (state === "blocked") return "No approval requested";
  return "No approval pending";
}

function buildGrantPayloadPreview(status: T3Status) {
  return {
    agents: [
      {
        agentDid: status.agentDid,
        scripts: [
          {
            scriptName: status.contractScript,
            versionReq: status.contractVersion,
            functions: ["search-vendors", "submit-purchase-request"],
            allowedHosts: status.allowedHosts,
          },
        ],
      },
    ],
  };
}

function fingerprintJson(value: unknown) {
  const input = JSON.stringify(value);
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `pg-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
