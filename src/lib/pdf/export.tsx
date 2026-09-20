import { pdf } from "@react-pdf/renderer";
import { getDb } from "@/lib/db";
import type { Roadbook } from "@/lib/roadbook/types";
import { RoadbookPdfDocument } from "./roadbook-document";

function slugify(value: string): string {
  return (
    value
      .toLocaleLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "roadbook"
  );
}

export async function downloadRoadbookPdf(roadbook: Roadbook): Promise<void> {
  const customIcons = await getDb().customIcons.toArray();
  const blob = await pdf(<RoadbookPdfDocument roadbook={roadbook} customIcons={customIcons} />).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(roadbook.settings.rallyName || roadbook.name)}-roadbook.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
