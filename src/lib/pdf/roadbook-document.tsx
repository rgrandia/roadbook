import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { CATEGORY_MAP } from "@/lib/roadbook/library";
import type { Roadbook, Sector, Stage } from "@/lib/roadbook/types";
import { formatKm, formatMinutes, sectorEstimatedTimeMinutes, sectorTotalDistance } from "@/lib/roadbook/calc";
import { DirectionIconPdf } from "./direction-icon-pdf";

const COLORS = {
  ink: "#0f172a",
  muted: "#64748b",
  border: "#cbd5e1",
  headerBg: "#f1f5f9",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 90,
    paddingBottom: 36,
    paddingHorizontal: 28,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: COLORS.ink,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.ink,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 32, height: 32, objectFit: "contain" },
  rallyName: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  headerMeta: { fontSize: 8, color: COLORS.muted },
  headerRight: { alignItems: "flex-end" },
  columnHeader: {
    position: "absolute",
    top: 62,
    left: 28,
    right: 28,
    flexDirection: "row",
    backgroundColor: COLORS.headerBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    textTransform: "uppercase",
    color: COLORS.muted,
  },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: COLORS.muted,
  },
  stageTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4, marginTop: 2 },
  sectorBlock: { marginBottom: 8 },
  sectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    color: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  sectorTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  sectorMeta: { fontSize: 7.5, color: "#cbd5e1" },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingVertical: 2.5,
    alignItems: "center",
  },
  rowAlt: { backgroundColor: "#fafafa" },
  bannerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3.5, marginVertical: 1 },
  bannerText: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: "#fff" },
  cell: { fontSize: 8, paddingHorizontal: 3 },
  cellCenter: { textAlign: "center" },
  cellRight: { textAlign: "right" },
  colOrder: { width: 20 },
  colDir: { width: 24, alignItems: "center" },
  colDist: { width: 34 },
  colTotal: { width: 38 },
  colPartial: { width: 34 },
  colRoad: { width: 60 },
  colDest: { width: 90 },
  colInfo: { flex: 1 },
  empty: { fontSize: 8, color: COLORS.muted, fontStyle: "italic", paddingVertical: 6 },
});

const CATEGORY_PDF_COLORS: Record<string, string> = {
  stop: "#dc2626",
  regroup: "#d97706",
  control: "#2563eb",
  start: "#059669",
  finish: "#0f172a",
};

function DocHeader({ roadbook }: { roadbook: Roadbook }) {
  const { settings } = roadbook;
  return (
    <View style={styles.header} fixed>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image has no alt prop */}
          {settings.logoDataUrl ? <Image src={settings.logoDataUrl} style={styles.logo} /> : null}
          <View>
            <Text style={styles.rallyName}>{settings.rallyName || roadbook.name}</Text>
            <Text style={styles.headerMeta}>
              {[settings.organization, settings.date, settings.vehicle, settings.team].filter(Boolean).join("  ·  ")}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerMeta}>ROADBOOK</Text>
        </View>
      </View>
    </View>
  );
}

function ColumnHeader() {
  return (
    <View style={styles.columnHeader} fixed>
      <Text style={[styles.cell, styles.colOrder, styles.cellCenter]}>Nº</Text>
      <Text style={[styles.cell, styles.colDir, styles.cellCenter]}>Dir</Text>
      <Text style={[styles.cell, styles.colDist, styles.cellRight]}>Dist.</Text>
      <Text style={[styles.cell, styles.colTotal, styles.cellRight]}>Km total</Text>
      <Text style={[styles.cell, styles.colPartial, styles.cellRight]}>Parcial</Text>
      <Text style={[styles.cell, styles.colRoad]}>Carretera</Text>
      <Text style={[styles.cell, styles.colDest]}>Destinació</Text>
      <Text style={[styles.cell, styles.colInfo]}>Informació</Text>
    </View>
  );
}

function SectorSection({ sector }: { sector: Sector }) {
  const distance = sectorTotalDistance(sector);
  const minutes = sectorEstimatedTimeMinutes(sector);

  return (
    <View style={styles.sectorBlock} wrap>
      <View style={styles.sectorHeader}>
        <Text style={styles.sectorTitle}>
          SS{sector.number} · {sector.name}
          {sector.startLocation || sector.endLocation
            ? `  (${sector.startLocation ?? "?"} → ${sector.endLocation ?? "?"})`
            : ""}
        </Text>
        <Text style={styles.sectorMeta}>
          {formatKm(distance)} km · {formatMinutes(minutes)}
        </Text>
      </View>

      {sector.instructions.length === 0 ? (
        <Text style={styles.empty}>Sense instruccions.</Text>
      ) : (
        sector.instructions.map((instruction, i) => {
          const categoryDef = CATEGORY_MAP[instruction.category];
          if (categoryDef.banner) {
            const bg = CATEGORY_PDF_COLORS[instruction.category] ?? COLORS.ink;
            return (
              <View key={instruction.id} style={[styles.bannerRow, { backgroundColor: bg }]} wrap={false}>
                <Text style={[styles.cell, styles.colOrder, styles.cellCenter, { color: "#fff" }]}>
                  {instruction.order}
                </Text>
                <Text style={[styles.bannerText, { flex: 1 }]}>
                  {categoryDef.code ?? categoryDef.label}
                  {instruction.information ? `  —  ${instruction.information}` : ""}
                </Text>
                <Text style={[styles.cell, styles.colTotal, styles.cellRight, { color: "#fff" }]}>
                  {formatKm(instruction.totalKm)}
                </Text>
              </View>
            );
          }
          return (
            <View key={instruction.id} style={[styles.row, i % 2 === 1 ? styles.rowAlt : undefined]} wrap={false}>
              <Text style={[styles.cell, styles.colOrder, styles.cellCenter]}>{instruction.order}</Text>
              <View style={[styles.cell, styles.colDir]}>
                <DirectionIconPdf direction={instruction.direction} size={11} />
              </View>
              <Text style={[styles.cell, styles.colDist, styles.cellRight]}>{formatKm(instruction.distance)}</Text>
              <Text style={[styles.cell, styles.colTotal, styles.cellRight, { fontFamily: "Helvetica-Bold" }]}>
                {formatKm(instruction.totalKm)}
              </Text>
              <Text style={[styles.cell, styles.colPartial, styles.cellRight]}>{formatKm(instruction.partialKm)}</Text>
              <Text style={[styles.cell, styles.colRoad]}>
                {[instruction.road.number, instruction.road.name].filter(Boolean).join(" ")}
              </Text>
              <Text style={[styles.cell, styles.colDest]}>{instruction.destination ?? ""}</Text>
              <Text style={[styles.cell, styles.colInfo]}>
                {instruction.information ?? ""}
                {instruction.category === "danger" ? "  ⚠" : ""}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

function StagePage({ stage, roadbook }: { stage: Stage; roadbook: Roadbook }) {
  return (
    <Page size="A4" orientation={roadbook.settings.orientation} style={styles.page} wrap>
      <DocHeader roadbook={roadbook} />
      <ColumnHeader />
      <Text style={styles.stageTitle}>{stage.name}</Text>
      {stage.sectors.length === 0 ? (
        <Text style={styles.empty}>Aquesta etapa no té sectors.</Text>
      ) : (
        stage.sectors.map((sector, i) => (
          <View key={sector.id} break={i > 0}>
            <SectorSection sector={sector} />
          </View>
        ))
      )}
      <Text
        style={styles.footer}
        fixed
        render={({ pageNumber, totalPages }) =>
          `${roadbook.settings.rallyName || roadbook.name} · Pàgina ${roadbook.settings.startPageNumber + pageNumber - 1} de ${roadbook.settings.startPageNumber + totalPages - 1}`
        }
      />
    </Page>
  );
}

export function RoadbookPdfDocument({ roadbook }: { roadbook: Roadbook }) {
  return (
    <Document title={roadbook.settings.rallyName || roadbook.name} author={roadbook.settings.organization}>
      {roadbook.stages.length === 0 ? (
        <Page size="A4" style={styles.page}>
          <DocHeader roadbook={roadbook} />
          <Text style={styles.empty}>Aquest roadbook encara no té etapes.</Text>
        </Page>
      ) : (
        roadbook.stages.map((stage) => <StagePage key={stage.id} stage={stage} roadbook={roadbook} />)
      )}
    </Document>
  );
}
