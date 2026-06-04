import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export const BRAND = {
  ink: "#0d0f12",
  paper: "#f5f2ed",
  cream: "#ede9e2",
  accent: "#1a6b5a",
  accentLight: "#2d9e88",
  gold: "#c49a3c",
  muted: "#7a7468",
  rule: "#d8d3ca",
  white: "#ffffff",
  red: "#b84a4a",
  yellow: "#d4a843",
  green: "#1a6b5a",
} as const;

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: BRAND.ink,
    backgroundColor: BRAND.white,
  },
  coverPage: {
    paddingTop: 72,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    backgroundColor: BRAND.ink,
    color: BRAND.paper,
  },
  coverKicker: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: BRAND.accentLight,
    marginBottom: 16,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: "Times-Roman",
    fontWeight: 400,
    marginBottom: 12,
    color: BRAND.paper,
  },
  coverSubtitle: {
    fontSize: 14,
    color: BRAND.cream,
    marginBottom: 8,
  },
  coverMeta: {
    fontSize: 10,
    color: BRAND.muted,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Times-Roman",
    color: BRAND.accent,
    marginBottom: 10,
    marginTop: 8,
  },
  subsectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 10,
    color: BRAND.ink,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.55,
    color: BRAND.ink,
    marginBottom: 8,
  },
  muted: {
    fontSize: 9,
    color: BRAND.muted,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: BRAND.rule,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: BRAND.muted,
  },
  scoreHero: {
    fontSize: 42,
    fontFamily: "Times-Roman",
    color: BRAND.accent,
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: BRAND.muted,
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: BRAND.rule,
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
    backgroundColor: BRAND.paper,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  barTrack: {
    height: 6,
    backgroundColor: BRAND.cream,
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 8,
  },
  barFill: {
    height: 6,
    backgroundColor: BRAND.accent,
    borderRadius: 3,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: BRAND.accent,
    marginTop: 1,
    marginRight: 8,
  },
  ctaBox: {
    backgroundColor: BRAND.accent,
    padding: 16,
    borderRadius: 4,
    marginTop: 16,
  },
  ctaText: {
    color: BRAND.white,
    fontSize: 11,
    lineHeight: 1.5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND.cream,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.rule,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BRAND.rule,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 4,
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: BRAND.muted,
    paddingHorizontal: 4,
  },
  priorityHigh: { backgroundColor: "#fde8e8" },
  priorityMedium: { backgroundColor: "#fef6e8" },
  priorityLow: { backgroundColor: "#e8f5f1" },
  timelinePhase: {
    borderLeftWidth: 3,
    borderLeftColor: BRAND.accent,
    paddingLeft: 12,
    marginBottom: 14,
  },
});

type BrandedPageProps = {
  children: React.ReactNode;
  dark?: boolean;
  footerLabel?: string;
};

export function BrandedPage({
  children,
  dark = false,
  footerLabel = "Clinovyr · Intelligence, Applied.",
}: BrandedPageProps) {
  return (
    <Page size="LETTER" style={dark ? pdfStyles.coverPage : pdfStyles.page}>
      {children}
      {!dark && (
        <View style={pdfStyles.footer} fixed>
          <Text style={pdfStyles.footerText}>{footerLabel}</Text>
          <Text
            style={pdfStyles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      )}
    </Page>
  );
}

type PdfFooterProps = {
  label?: string;
};

export function PdfFooter({ label = "clinovyr.com · Granite Bay, CA" }: PdfFooterProps) {
  return (
    <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: BRAND.rule, paddingTop: 8 }}>
      <Text style={pdfStyles.muted}>{label}</Text>
    </View>
  );
}

export { Document, Page, Text, View };

export async function renderPdfDocument(
  document: React.ReactElement,
): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(document as any);
  return Buffer.from(buffer);
}
