import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/lib/db";
import { IconDesignerDialog } from "./icon-designer-dialog";

beforeEach(async () => {
  await getDb().customIcons.clear();
});

describe("IconDesignerDialog", () => {
  it("lets the angle be set from the keyboard, not just a mouse click on the compass", () => {
    render(<IconDesignerDialog open onOpenChange={vi.fn()} />);
    const compass = screen.getByRole("slider", { name: "Angle del camí pres" });
    expect(compass).toHaveAttribute("aria-valuenow", "0");

    fireEvent.keyDown(compass, { key: "ArrowRight" });
    expect(compass).toHaveAttribute("aria-valuenow", "5");

    fireEvent.keyDown(compass, { key: "ArrowRight", shiftKey: true });
    expect(compass).toHaveAttribute("aria-valuenow", "6");

    fireEvent.keyDown(compass, { key: "ArrowLeft" });
    expect(compass).toHaveAttribute("aria-valuenow", "1");

    fireEvent.keyDown(compass, { key: "End" });
    expect(compass).toHaveAttribute("aria-valuenow", "180");

    fireEvent.keyDown(compass, { key: "Home" });
    expect(compass).toHaveAttribute("aria-valuenow", "-180");
  });

  it("saves a new icon to the browser-wide library and reports it via onSaved", async () => {
    const onSaved = vi.fn();
    render(<IconDesignerDialog open onOpenChange={vi.fn()} onSaved={onSaved} />);

    const compass = screen.getByRole("slider", { name: "Angle del camí pres" });
    fireEvent.keyDown(compass, { key: "ArrowRight" });

    fireEvent.change(screen.getByPlaceholderText("p. ex. Gir tancat a 100°"), {
      target: { value: "Gir de prova" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crea la icona" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    const saved = onSaved.mock.calls[0][0];
    expect(saved.name).toBe("Gir de prova");
    expect(saved.takenAngle).toBe(5);

    const stored = await getDb().customIcons.get(saved.id);
    expect(stored?.name).toBe("Gir de prova");
  });

  it("refuses to save without a name", () => {
    const onSaved = vi.fn();
    render(<IconDesignerDialog open onOpenChange={vi.fn()} onSaved={onSaved} />);

    fireEvent.click(screen.getByRole("button", { name: "Crea la icona" }));

    expect(onSaved).not.toHaveBeenCalled();
  });
});
