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
      takenAngle: 100,
      otherAngles: [],
      roundabout: false,
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
