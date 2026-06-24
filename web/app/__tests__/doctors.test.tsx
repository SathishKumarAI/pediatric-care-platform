import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Doctors from "@/app/doctors/page";

vi.mock("@/lib/api", () => ({
  api: {
    doctors: vi.fn().mockResolvedValue([
      { id: "doc-1", name: "Dr. Aisha Rahman", specialty: "General Pediatrics", available_days: ["Mon"] },
    ]),
  },
}));

describe("Doctors page", () => {
  it("renders doctors returned by the API", async () => {
    render(<Doctors />);
    expect(await screen.findByText("Dr. Aisha Rahman")).toBeInTheDocument();
    expect(await screen.findByText("General Pediatrics")).toBeInTheDocument();
    expect(await screen.findByText("Mon")).toBeInTheDocument();
  });
});
