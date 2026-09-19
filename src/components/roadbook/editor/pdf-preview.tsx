"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { RoadbookPdfDocument } from "@/lib/pdf/roadbook-document";
import type { Roadbook } from "@/lib/roadbook/types";

/**
 * Live preview: renders the SAME @react-pdf/renderer document tree used for
 * the "Exportar PDF" button, inside an in-browser PDF viewer. This is what
 * guarantees the preview is not just "similar" to the final PDF but the
 * literal PDF, per spec section 17.
 */
export function PdfPreview({ roadbook }: { roadbook: Roadbook }) {
  return (
    <div className="flex-1 bg-slate-200 p-4">
      <PDFViewer
        key={roadbook.settings.orientation}
        className="h-full w-full rounded-md border border-slate-300"
        showToolbar
      >
        <RoadbookPdfDocument roadbook={roadbook} />
      </PDFViewer>
    </div>
  );
}
