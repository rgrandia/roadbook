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

  it("saves a new turn icon to the browser-wide library and reports it via onSaved", async () => {
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
    expect(saved.template).toEqual({ kind: "turn", angle: 5, otherAngles: [] });

    const stored = await getDb().customIcons.get(saved.id);
    expect(stored?.template).toEqual({ kind: "turn", angle: 5, otherAngles: [] });
  });

  it("refuses to save without a name", () => {
    const onSaved = vi.fn();
    render(<IconDesignerDialog open onOpenChange={vi.fn()} onSaved={onSaved} />);

    fireEvent.click(screen.getByRole("button", { name: "Crea la icona" }));

    expect(onSaved).not.toHaveBeenCalled();
  });

  it("hides the compass and shows a direction toggle for the s-bend template", () => {
    render(<IconDesignerDialog open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Revolt en S" }));

    expect(screen.queryByRole("slider", { name: "Angle del camí pres" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Esquerra → Dreta" })).toBeInTheDocument();
  });

  it("saves an s-bend icon with the chosen direction sign", async () => {
    const onSaved = vi.fn();
    render(<IconDesignerDialog open onOpenChange={vi.fn()} onSaved={onSaved} />);

    fireEvent.click(screen.getByRole("button", { name: "Revolt en S" }));
    fireEvent.click(screen.getByRole("button", { name: "Esquerra → Dreta" }));
    fireEvent.change(screen.getByPlaceholderText("p. ex. Gir tancat a 100°"), {
      target: { value: "S de prova" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crea la icona" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(onSaved.mock.calls[0][0].template).toEqual({ kind: "s-bend", firstSign: -1 });
  });

  it("hides the 'other arms' section for kinds other than turn", () => {
    render(<IconDesignerDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByText(/Altres sortides no preses/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Rotonda" }));
    expect(screen.queryByText(/Altres sortides no preses/)).not.toBeInTheDocument();
  });

  it("prepares a mirrored copy of the current shape as a new icon", () => {
    render(<IconDesignerDialog open onOpenChange={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("p. ex. Gir tancat a 100°"), {
      target: { value: "Gir tancat dreta" },
    });
    const compass = screen.getByRole("slider", { name: "Angle del camí pres" });
    fireEvent.keyDown(compass, { key: "ArrowRight" });
    fireEvent.keyDown(compass, { key: "ArrowRight" });

    fireEvent.click(screen.getByRole("button", { name: /Mirall/ }));

    expect(screen.getByPlaceholderText("p. ex. Gir tancat a 100°")).toHaveValue("Gir tancat esquerra");
    expect(compass).toHaveAttribute("aria-valuenow", "-10");
  });
});
