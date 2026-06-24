import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Patients from "@/app/patients/page";
import { PatientProvider } from "@/lib/patient-context";

const createPatient = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    patients: vi.fn().mockResolvedValue([]),
    createPatient: (...args: unknown[]) => createPatient(...args),
  },
}));

beforeEach(() => createPatient.mockReset());

function renderPage() {
  return render(
    <PatientProvider>
      <Patients />
    </PatientProvider>,
  );
}

describe("patients form validation", () => {
  it("blocks submit and shows errors when fields are empty", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Add child" }));
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Birth date is required")).toBeInTheDocument();
    expect(createPatient).not.toHaveBeenCalled();
  });

  it("rejects a future birth date", () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Kid" } });
    fireEvent.change(screen.getByLabelText("Birth date"), { target: { value: "2999-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add child" }));
    expect(screen.getByText("Birth date can't be in the future")).toBeInTheDocument();
    expect(createPatient).not.toHaveBeenCalled();
  });
});
