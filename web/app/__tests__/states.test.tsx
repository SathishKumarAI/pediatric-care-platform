import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState, ErrorBanner, Loading } from "@/app/_components/States";

describe("state components", () => {
  it("Loading exposes a polite status", () => {
    render(<Loading label="Loading doctors…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading doctors…");
  });

  it("EmptyState renders its message", () => {
    render(<EmptyState>No data</EmptyState>);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("ErrorBanner is an alert and fires retry", () => {
    const onRetry = vi.fn();
    render(<ErrorBanner message="boom" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
