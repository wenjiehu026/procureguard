import type { AgentEvent, AgentEventType } from "./types";

let counter = 0;

export function makeEvent(type: AgentEventType, title: string, detail: string, payload?: unknown): AgentEvent {
  counter += 1;
  return {
    id: `${Date.now()}-${counter}`,
    type,
    title,
    detail,
    timestamp: new Date().toISOString(),
    payload,
  };
}

export function encodeNdjson(event: AgentEvent) {
  return `${JSON.stringify(event)}\n`;
}
