import { describe, expect, it } from "vitest";
import {
  classifyLead,
  followUpDue,
  FOLLOWUP_DELAY_HOURS,
  MAX_FOLLOWUPS,
  nextFollowUp,
  suggestReply
} from "../lib/customers";

describe("lead classifier", () => {
  it("flags buying intent", () => {
    for (const t of ["How much is this?", "I want two", "How can I order?", "Do you deliver to Lekki?"]) {
      expect(classifyLead(t).isLead).toBe(true);
    }
  });
  it("ignores casual chat", () => {
    for (const t of ["Nice post!", "lol", "Good morning everyone"]) {
      expect(classifyLead(t).isLead).toBe(false);
    }
  });
});

describe("facts-only replies", () => {
  const facts = [{ key: "jollof-party-price", value: "₦25,000 per tray" }];
  it("thanks → warm reply, high confidence", () => {
    const r = suggestReply("Thanks, love this! ❤", facts);
    expect(r.action).toBe("reply");
    expect(r.confidence).toBeGreaterThan(0.9);
  });
  it("price question with fact → quoted answer", () => {
    const r = suggestReply("How much is the party jollof tray?", facts);
    expect(r.action).toBe("reply");
    expect(r.text).toContain("₦25,000");
  });
  it("price question with NO facts → escalate, empty text", () => {
    const r = suggestReply("How much is delivery?", []);
    expect(r.action).toBe("escalate");
    expect(r.text).toBe("");
  });
  it("unknown question → escalate (never invent)", () => {
    const r = suggestReply("Do you offer refunds after 90 days?", facts);
    expect(r.action).toBe("escalate");
  });
});

describe("follow-up safeguards", () => {
  it("caps at MAX_FOLLOWUPS", () => {
    expect(MAX_FOLLOWUPS).toBe(2);
    expect(followUpDue({ followUpCount: 2, followUpAt: new Date(2000, 0, 1).toISOString(), status: "lead" })).toBe(false);
  });
  it("due only after delay window", () => {
    const past = new Date(Date.now() - (FOLLOWUP_DELAY_HOURS + 1) * 3600e3).toISOString();
    expect(followUpDue({ followUpCount: 0, followUpAt: past, status: "lead" })).toBe(true);
    expect(followUpDue({ followUpCount: 0, followUpAt: new Date(Date.now() + 3600e3).toISOString(), status: "lead" })).toBe(false);
  });
  it("hard stop on purchased / opted-out", () => {
    const past = new Date(2000, 0, 1).toISOString();
    expect(followUpDue({ followUpCount: 0, followUpAt: past, status: "purchased" })).toBe(false);
    expect(followUpDue({ followUpCount: 0, followUpAt: past, status: "opted-out" })).toBe(false);
  });
  it("schedules ~48h out", () => {
    const from = new Date("2026-01-05T10:00:00Z");
    const diff = (new Date(nextFollowUp(0, from)).getTime() - from.getTime()) / 3600e3;
    expect(diff).toBe(FOLLOWUP_DELAY_HOURS);
  });
});
