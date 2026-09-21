import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/lib/db";
import type { CustomDirectionIcon } from "@/lib/roadbook/types";
import { DirectionPicker } from "./direction-picker";

beforeEach(async () => {
  await getDb().customIcons.clear();
});

describe("DirectionPicker", () => {
  it("opens the popover and reports a built-in direction on selection", async () => {
    const onChange = vi.fn();
    render(<DirectionPicker value="straight" onChange={onChange} />);

    fireEvent.click(screen.getByTitle("Seguir recte"));
    const rightOption = await screen.findByTitle("Dreta");
    fireEvent.click(rightOption);

    expect(onChange).toHaveBeenCalledWith("right", undefined);
  });

  it("lists saved custom icons and reports their id on selection", async () => {
    const icon: CustomDirectionIcon = {
      id: "custom-1",
      name: "Gir estrany",
      template: { kind: "turn", angle: 100, otherAngles: [] },
      createdAt: new Date().toISOString(),
    };
    await getDb().customIcons.put(icon);

    const onChange = vi.fn();
    render(<DirectionPicker value="straight" onChange={onChange} />);

    fireEvent.click(screen.getByTitle("Seguir recte"));
    const customOption = await screen.findByTitle("Gir estrany");
    fireEvent.click(customOption);

    expect(onChange).toHaveBeenCalledWith("custom", "custom-1");
  });

  it("filters both built-in and custom icons as the user types a search query", async () => {
    const icon: CustomDirectionIcon = {
      id: "custom-1",
      name: "Gir estrany",
      template: { kind: "turn", angle: 100, otherAngles: [] },
      createdAt: new Date().toISOString(),
    };
    await getDb().customIcons.put(icon);

    render(<DirectionPicker value="straight" onChange={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Seguir recte"));
    await screen.findByTitle("Dreta");

    fireEvent.change(screen.getByPlaceholderText("Cerca una icona..."), { target: { value: "rotonda" } });

    expect(screen.queryByTitle("Dreta")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Gir estrany")).not.toBeInTheDocument();
    expect(screen.getByTitle("Rotonda, 2a sortida")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Cerca una icona..."), { target: { value: "estrany" } });
    expect(screen.getByTitle("Gir estrany")).toBeInTheDocument();
    expect(screen.queryByTitle("Rotonda, 2a sortida")).not.toBeInTheDocument();
  });

  it("opens the icon designer from the '+' tile", async () => {
    render(<DirectionPicker value="straight" onChange={vi.fn()} />);

    fireEvent.click(screen.getByTitle("Seguir recte"));
    const createTile = await screen.findByTitle("Crea una icona nova");
    fireEvent.click(createTile);

    await waitFor(() => {
      expect(screen.getByText("Icones personalitzades")).toBeInTheDocument();
    });
  });
});
