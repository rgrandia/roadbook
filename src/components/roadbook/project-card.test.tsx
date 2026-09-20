import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RoadbookSummary } from "@/lib/roadbook/types";
import { ProjectCard } from "./project-card";

const summary: RoadbookSummary = {
  id: "abc123",
  name: "Rally Costa Brava",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  stageCount: 2,
  sectorCount: 5,
  totalDistanceKm: 123.4,
};

describe("ProjectCard", () => {
  it("renders the roadbook name, stage/sector counts, distance and a link to its editor", () => {
    const { container } = render(
      <ProjectCard summary={summary} onDuplicate={vi.fn()} onDelete={vi.fn()} onExport={vi.fn()} />,
    );

    expect(screen.getByText("Rally Costa Brava")).toBeInTheDocument();
    expect(screen.getByText(/2 etapes/)).toBeInTheDocument();
    expect(screen.getByText(/5 sectors/)).toBeInTheDocument();
    expect(container.textContent).toContain("123,40");
    expect(screen.getByRole("link", { name: /Obre/ })).toHaveAttribute("href", "/r/abc123");
  });

  it("uses singular wording for a single stage and sector", () => {
    render(
      <ProjectCard
        summary={{ ...summary, stageCount: 1, sectorCount: 1 }}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
        onExport={vi.fn()}
      />,
    );
    expect(screen.getByText(/1 etapa\b/)).toBeInTheDocument();
    expect(screen.getByText(/1 sector\b/)).toBeInTheDocument();
  });
});
