import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SymptomChecker from "@/app/symptom-checker/page";
import { PatientProvider } from "@/lib/patient-context";

vi.mock("@/lib/api", () => ({
  api: { patients: vi.fn().mockResolvedValue([]), predict: vi.fn() },
}));

describe("symptom checker a11y", () => {
  it("toggles aria-pressed on a symptom chip", () => {
    render(
      <PatientProvider>
        <SymptomChecker />
      </PatientProvider>,
    );
    const chip = screen.getByRole("button", { name: "fever" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });
});
