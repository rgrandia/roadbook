import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Onboarding } from "./onboarding";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Onboarding", () => {
  it("shows the four getting-started steps and a call to action", () => {
    render(<Onboarding />);

    expect(screen.getByText("Crea el teu primer roadbook")).toBeInTheDocument();
    for (const step of ["Nom", "Etapes", "Primer sector", "Instruccions"]) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Nou roadbook/ })).toBeInTheDocument();
  });
});
