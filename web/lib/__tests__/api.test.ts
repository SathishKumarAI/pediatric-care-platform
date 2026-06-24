import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";

function mockFetch(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

afterEach(() => vi.restoreAllMocks());

describe("api client", () => {
  it("posts the symptom payload and returns the parsed response", async () => {
    const resp = { predictions: [], triage: "self-care", explanation: "", disclaimer: "x" };
    const f = mockFetch(resp);
    vi.stubGlobal("fetch", f);

    const out = await api.predict(["fever", "cough"], 18);

    expect(out.triage).toBe("self-care");
    const [url, init] = f.mock.calls[0];
    expect(String(url)).toMatch(/\/predict$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      symptoms: ["fever", "cough"],
      age_months: 18,
      explain: true,
    });
  });

  it("throws with the backend detail on a non-OK response", async () => {
    vi.stubGlobal("fetch", mockFetch({ detail: "Doctor already booked at that time" }, false, 409));
    await expect(
      api.book("p1", "doc-1", "2030-01-01T09:00:00Z"),
    ).rejects.toThrow(/already booked/);
  });

  it("builds the records URL from the subject", async () => {
    const f = mockFetch([]);
    vi.stubGlobal("fetch", f);
    await api.records("patient-xyz");
    expect(String(f.mock.calls[0][0])).toMatch(/\/records\/patient-xyz$/);
  });
});
