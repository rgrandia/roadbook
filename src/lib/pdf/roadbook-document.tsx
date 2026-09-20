import { Document, Image, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { CATEGORY_MAP } from "@/lib/roadbook/library";
import type { CustomDirectionIcon, Instruction, Roadbook, Sector, Stage } from "@/lib/roadbook/types";
import { resolveDirectionGlyph } from "@/lib/roadbook/direction-icons";
import {
  formatKm,
  formatMinutes,
  instructionKmRegressive,
  sectorEstimatedTimeMinutes,
  sectorTotalDistance,
} from "@/lib/roadbook/calc";
import { DirectionIconPdf } from "./direction-icon-pdf";

const COLORS = {
  ink: "#0f172a",
  muted: "#64748b",
  border: "#94a3b8",
  headerBg: "#f1f5f9",
};

/** Exactly this many instructions print per page (spec: big, legible steps). */
const STEPS_PER_PAGE = 4;
const ROW_HEIGHT = 140;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 78,
    paddingBottom: 34,
    paddingHorizontal: 24,
    fontSize: 8,
    fontFamily: "Helvetica",
    color: COLORS.ink,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.ink,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 28, height: 28, objectFit: "contain" },
  rallyName: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  headerMeta: { fontSize: 7.5, color: COLORS.muted },
  footer: {
    position: "absolute",
    bottom: 12,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: COLORS.muted,
  },

  metaGrid: { flexDirection: "row", borderWidth: 1, borderColor: COLORS.ink, marginTop: 6, marginBottom: 3 },
  metaCell: { flex: 1, borderRightWidth: 1, borderRightColor: COLORS.ink, paddingVertical: 2, paddingHorizontal: 3 },
  metaCellLast: { borderRightWidth: 0 },
  metaLabel: { fontSize: 6, color: COLORS.muted, textTransform: "uppercase" },
  metaValue: { fontSize: 8.5, fontFamily: "Helvetica-Bold", marginTop: 1 },

  transitionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.ink,
    backgroundColor: COLORS.headerBg,
    paddingVertical: 3,
    marginBottom: 3,
  },
  transitionText: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },

  sectorTitleRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  sectorTitle: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  sectorSub: { fontSize: 7, color: COLORS.muted },

  columnHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.headerBg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.ink,
    paddingVertical: 2,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    textTransform: "uppercase",
    color: COLORS.muted,
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink,
    minHeight: ROW_HEIGHT,
    alignItems: "stretch",
  },
  cellBase: { paddingHorizontal: 8, paddingVertical: 8, justifyContent: "center" },
  vDivider: { borderRightWidth: 0.75, borderRightColor: COLORS.border },
  cellCenter: { textAlign: "center" },
  cellRight: { textAlign: "right" },

  colTab: { width: 26 },
  colDir: { width: 76, alignItems: "center", justifyContent: "center" },
  colDist: { width: 58 },
  colTotal: { width: 76 },
  colPartial: { width: 56 },
  colInfo: { flex: 1 },
  colRegr: { width: 56 },

  tabNumber: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    backgroundColor: COLORS.ink,
    textAlign: "center",
    paddingVertical: 3,
    borderRadius: 2,
  },
  distValue: { fontSize: 13 },
  totalValue: { fontSize: 27, fontFamily: "Helvetica-Bold" },
  partialValue: { fontSize: 13, color: COLORS.muted },
  regrValue: { fontSize: 13, color: COLORS.muted },

  roadHeader: { fontSize: 10, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 2 },
  roadBadge: {
    borderWidth: 1,
    borderColor: COLORS.ink,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginRight: 4,
  },
  destRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  destText: { fontSize: 12 },
  infoText: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  infoSecondary: { fontSize: 10.5, fontStyle: "italic", color: COLORS.muted },
  gpsText: { fontSize: 8, color: COLORS.muted, marginTop: 2 },

  dangerBadge: {
    borderWidth: 1,
    borderColor: COLORS.ink,
    backgroundColor: COLORS.ink,
    color: "#fff",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 4,
  },

  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.ink,
    minHeight: ROW_HEIGHT,
    paddingHorizontal: 8,
    marginVertical: 2,
  },
  bannerLabel: { fontSize: 18, fontFamily: "Helvetica-Bold", textTransform: "uppercase", flex: 1 },
  bannerKm: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  stopOctagon: { width: 34, height: 34, marginHorizontal: 10 },

  empty: { fontSize: 8, color: COLORS.muted, fontStyle: "italic", paddingVertical: 6 },
});

function DocHeader({ roadbook }: { roadbook: Roadbook }) {
  const { settings } = roadbook;
  return (
    <View style={styles.header}>
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
        <Text style={styles.headerMeta}>ROADBOOK</Text>
      </View>
    </View>
  );
}

function ColumnHeader() {
  return (
    <View style={styles.columnHeader}>
      <Text style={[styles.cellBase, styles.colTab]} />
      <Text style={[styles.cellBase, styles.colDir, styles.cellCenter]}>Dir.</Text>
      <Text style={[styles.cellBase, styles.colDist, styles.cellRight]}>Dist.</Text>
      <Text style={[styles.cellBase, styles.colTotal, styles.cellRight]}>Km tot.</Text>
      <Text style={[styles.cellBase, styles.colPartial, styles.cellRight]}>Parc.</Text>
      <Text style={[styles.cellBase, styles.colInfo]}>Informació / Destinació</Text>
      <Text style={[styles.cellBase, styles.colRegr, styles.cellRight]}>Km regr.</Text>
    </View>
  );
}

function MetaCell({
  label,
  value,
  last,
  render,
}: {
  label: string;
  value?: string;
  last?: boolean;
  render?: (props: { pageNumber: number; totalPages: number }) => string;
}) {
  return (
    <View style={[styles.metaCell, last ? styles.metaCellLast : undefined]}>
      <Text style={styles.metaLabel}>{label}</Text>
      {render ? (
        <Text style={styles.metaValue} render={render} />
      ) : (
        <Text style={styles.metaValue}>{value || "-"}</Text>
      )}
    </View>
  );
}

function SectorMetaGrid({ stage, sector, startPageNumber }: { stage: Stage; sector: Sector; startPageNumber: number }) {
  const distance = sectorTotalDistance(sector);
  const minutes = sectorEstimatedTimeMinutes(sector);
  return (
    <View style={styles.metaGrid}>
      <MetaCell label="Etapa" value={stage.name} />
      <MetaCell label="Secció" value={sector.sectionLabel ?? ""} />
      <MetaCell label="Sector" value={String(sector.number)} />
      <MetaCell label="Dist." value={`${formatKm(distance)} km`} />
      <MetaCell label="Temps" value={formatMinutes(minutes)} />
      <MetaCell label="Mitjana" value={sector.averageSpeedKmh ? `${sector.averageSpeedKmh} km/h` : ""} />
      <MetaCell last label="Pàg." render={({ pageNumber }) => String(startPageNumber + pageNumber - 1)} />
    </View>
  );
}

/** Octagonal STOP sign, drawn rather than relying on color to read as a stop. */
function StopOctagon() {
  const points: [number, number][] = [
    [5, 1],
    [11, 1],
    [15, 5],
    [15, 11],
    [11, 15],
    [5, 15],
    [1, 11],
    [1, 5],
  ];
  const d = `M ${points.map(([x, y]) => `${x} ${y}`).join(" L ")} Z`;
  return (
    <Svg viewBox="0 0 16 16" style={styles.stopOctagon}>
      <Path d={d} fill={COLORS.ink} />
    </Svg>
  );
}

function DestinationLines({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <>
      {lines.map((line, i) => (
        <View key={i} style={styles.destRow}>
          <Text style={styles.destText}>» {line}</Text>
        </View>
      ))}
    </>
  );
}

function InstructionRow({
  instruction,
  index,
  regressive,
  customIcons,
}: {
  instruction: Instruction;
  index: number;
  regressive: number;
  customIcons: CustomDirectionIcon[];
}) {
  const roadLabel = [instruction.road.number, instruction.road.name].filter(Boolean).join(" ");

  return (
    <View style={[styles.row, index % 2 === 1 ? { backgroundColor: "#fafafa" } : undefined]} wrap={false}>
      <View style={[styles.cellBase, styles.colTab]}>
        <Text style={styles.tabNumber}>{instruction.order}</Text>
      </View>
      <View style={[styles.cellBase, styles.colDir, styles.vDivider]}>
        <DirectionIconPdf
          direction={instruction.direction}
          glyph={resolveDirectionGlyph(instruction.direction, instruction.customIconId, customIcons)}
          size={52}
        />
      </View>
      <View style={[styles.cellBase, styles.colDist, styles.vDivider]}>
        <Text style={[styles.distValue, styles.cellRight]}>{formatKm(instruction.distance)}</Text>
      </View>
      <View style={[styles.cellBase, styles.colTotal, styles.vDivider]}>
        <Text style={[styles.totalValue, styles.cellRight]}>{formatKm(instruction.totalKm)}</Text>
      </View>
      <View style={[styles.cellBase, styles.colPartial, styles.vDivider]}>
        <Text style={[styles.partialValue, styles.cellRight]}>{formatKm(instruction.partialKm)}</Text>
      </View>
      <View style={[styles.cellBase, styles.colInfo, styles.vDivider]}>
        {roadLabel ? <Text style={styles.roadHeader}>{roadLabel}</Text> : null}
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
          {instruction.danger ? <Text style={styles.dangerBadge}>!!</Text> : null}
          {instruction.information ? <Text style={styles.infoText}>{instruction.information}</Text> : null}
        </View>
        {instruction.informationSecondary ? (
          <Text style={styles.infoSecondary}>{instruction.informationSecondary}</Text>
        ) : null}
        {instruction.destination ? <DestinationLines text={instruction.destination} /> : null}
        {instruction.gpsLat || instruction.gpsLng ? (
          <Text style={styles.gpsText}>
            {instruction.gpsLat} {instruction.gpsLng}
          </Text>
        ) : null}
      </View>
      <View style={[styles.cellBase, styles.colRegr]}>
        <Text style={[styles.regrValue, styles.cellRight]}>{formatKm(regressive)}</Text>
      </View>
    </View>
  );
}

function BannerRow({ instruction }: { instruction: Instruction }) {
  const categoryDef = CATEGORY_MAP[instruction.category];
  return (
    <View style={styles.bannerRow} wrap={false}>
      <View style={[styles.cellBase, styles.colTab]}>
        <Text style={styles.tabNumber}>{instruction.order}</Text>
      </View>
      {instruction.category === "stop" ? <StopOctagon /> : null}
      <Text style={styles.bannerLabel}>
        {categoryDef.code ?? categoryDef.label}
        {instruction.information ? `  —  ${instruction.information}` : ""}
      </Text>
      <Text style={styles.bannerKm}>{formatKm(instruction.totalKm)} km</Text>
    </View>
  );
}

/**
 * One printable page's worth of content: a stage/sector for context, and at
 * most STEPS_PER_PAGE instructions. Computed up front (rather than relying
 * on @react-pdf/renderer's automatic `wrap`/`break` reflow) because `break`
 * turned out to be unreliable across more than one consecutive forced break
 * in this version - trailing short chunks would silently merge onto the
 * previous page instead of starting a new one. Emitting one explicit <Page>
 * per chunk sidesteps that entirely and is easy to unit-test (assert a page
 * count for N instructions).
 */
interface PrintPagePlan {
  stage: Stage;
  sector: Sector | null;
  instructions: Instruction[];
}

export function buildPrintPages(roadbook: Roadbook): PrintPagePlan[] {
  const pages: PrintPagePlan[] = [];
  for (const stage of roadbook.stages) {
    if (stage.sectors.length === 0) {
      pages.push({ stage, sector: null, instructions: [] });
      continue;
    }
    for (const sector of stage.sectors) {
      if (sector.instructions.length === 0) {
        pages.push({ stage, sector, instructions: [] });
        continue;
      }
      for (const instructions of chunk(sector.instructions, STEPS_PER_PAGE)) {
        pages.push({ stage, sector, instructions });
      }
    }
  }
  return pages;
}

function SectorContext({ stage, sector, roadbook }: { stage: Stage; sector: Sector; roadbook: Roadbook }) {
  const showTransition = sector.sectorType === "liaison" && (sector.startLocation || sector.endLocation);
  return (
    <>
      <SectorMetaGrid stage={stage} sector={sector} startPageNumber={roadbook.settings.startPageNumber} />
      {showTransition ? (
        <View style={styles.transitionBar}>
          <Text style={styles.transitionText}>{sector.startLocation || "?"}</Text>
          <Text style={styles.transitionText}>»</Text>
          <Text style={styles.transitionText}>{sector.endLocation || "?"}</Text>
        </View>
      ) : (
        <View style={styles.sectorTitleRow}>
          <Text style={styles.sectorTitle}>
            SS{sector.number} · {sector.name}
            {sector.startLocation || sector.endLocation
              ? `  (${sector.startLocation ?? "?"} » ${sector.endLocation ?? "?"})`
              : ""}
          </Text>
          {sector.notes ? <Text style={styles.sectorSub}>{sector.notes}</Text> : null}
        </View>
      )}
    </>
  );
}

function PrintPage({
  plan,
  roadbook,
  customIcons,
}: {
  plan: PrintPagePlan;
  roadbook: Roadbook;
  customIcons: CustomDirectionIcon[];
}) {
  const { sector } = plan;
  return (
    <Page size="A4" orientation={roadbook.settings.orientation} style={styles.page}>
      <DocHeader roadbook={roadbook} />
      {!sector ? (
        <Text style={styles.empty}>Aquesta etapa no té sectors.</Text>
      ) : (
        <>
          <SectorContext stage={plan.stage} sector={sector} roadbook={roadbook} />
          <ColumnHeader />
          {plan.instructions.length === 0 ? (
            <Text style={styles.empty}>Sense instruccions.</Text>
          ) : (
            plan.instructions.map((instruction, i) => {
              const categoryDef = CATEGORY_MAP[instruction.category];
              return categoryDef.banner ? (
                <BannerRow key={instruction.id} instruction={instruction} />
              ) : (
                <InstructionRow
                  key={instruction.id}
                  instruction={instruction}
                  index={i}
                  regressive={instructionKmRegressive(sector, instruction)}
                  customIcons={customIcons}
                />
              );
            })
          )}
        </>
      )}
      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) =>
          `${roadbook.settings.rallyName || roadbook.name} · Pàgina ${roadbook.settings.startPageNumber + pageNumber - 1} de ${roadbook.settings.startPageNumber + totalPages - 1}`
        }
      />
    </Page>
  );
}

export function RoadbookPdfDocument({
  roadbook,
  customIcons = [],
}: {
  roadbook: Roadbook;
  /** The user's saved custom icon library, needed to render instructions with direction "custom". */
  customIcons?: CustomDirectionIcon[];
}) {
  const pages = roadbook.stages.length === 0 ? [] : buildPrintPages(roadbook);

  return (
    <Document title={roadbook.settings.rallyName || roadbook.name} author={roadbook.settings.organization}>
      {pages.length === 0 ? (
        <Page size="A4" style={styles.page}>
          <DocHeader roadbook={roadbook} />
          <Text style={styles.empty}>Aquest roadbook encara no té etapes.</Text>
        </Page>
      ) : (
        pages.map((plan, i) => (
          <PrintPage
            key={`${plan.stage.id}-${plan.sector?.id ?? "empty"}-${i}`}
            plan={plan}
            roadbook={roadbook}
            customIcons={customIcons}
          />
        ))
      )}
    </Document>
  );
}
