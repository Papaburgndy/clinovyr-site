/**
 * Server-side only — do not import from client components.
 */
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Playbook } from "./types";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica", fontStyle: "normal", fontWeight: 400 },
    { src: "Helvetica-Bold", fontStyle: "normal", fontWeight: 700 },
  ],
});

const colors = {
  ink: "#0d0f12",
  paper: "#f5f2ed",
  cream: "#ede9e2",
  accent: "#1a6b5a",
  accentLight: "#2d9e88",
  gold: "#c49a3c",
  muted: "#7a7468",
  rule: "#d8d3ca",
};

const styles = StyleSheet.create({
  coverPage: {
    backgroundColor: colors.ink,
    padding: 48,
    flex: 1,
    justifyContent: "space-between",
  },
  coverBrand: {
    fontSize: 14,
    color: colors.accentLight,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  coverLogo: {
    fontSize: 36,
    color: colors.paper,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
  },
  coverTitle: {
    fontSize: 32,
    color: colors.gold,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.2,
    marginTop: 80,
  },
  coverSubtitle: {
    fontSize: 14,
    color: colors.paper,
    marginTop: 16,
    lineHeight: 1.5,
  },
  coverMeta: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 24,
  },
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.ink,
    lineHeight: 1.5,
    backgroundColor: colors.paper,
  },
  pageHeader: {
    fontSize: 8,
    color: colors.muted,
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  h1: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
    color: colors.ink,
  },
  h2: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
    color: colors.accent,
  },
  h3: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 8,
    color: colors.ink,
  },
  callout: {
    backgroundColor: colors.cream,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    padding: 10,
    marginVertical: 8,
  },
  calloutText: {
    fontSize: 9,
    color: colors.ink,
    marginBottom: 4,
  },
  tocItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    paddingBottom: 4,
  },
  tocTitle: {
    fontSize: 11,
    flex: 1,
  },
  tocPage: {
    fontSize: 11,
    color: colors.muted,
    width: 30,
    textAlign: "right",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.ink,
    padding: 8,
  },
  tableHeaderCell: {
    color: colors.paper,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
    padding: 8,
  },
  tableCell: {
    fontSize: 8,
    flex: 1,
    paddingRight: 4,
  },
  promptBox: {
    backgroundColor: colors.ink,
    padding: 12,
    marginVertical: 8,
    borderRadius: 2,
  },
  promptText: {
    color: colors.paper,
    fontSize: 8,
    fontFamily: "Courier",
    lineHeight: 1.4,
  },
  promptLabel: {
    fontSize: 8,
    color: colors.gold,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
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
    borderColor: colors.accent,
    marginRight: 8,
    marginTop: 1,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 10,
  },
  backCover: {
    backgroundColor: colors.ink,
    padding: 48,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backTitle: {
    fontSize: 28,
    color: colors.gold,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 16,
  },
  backText: {
    fontSize: 12,
    color: colors.paper,
    textAlign: "center",
    lineHeight: 1.6,
    maxWidth: 360,
  },
  roiTable: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  roiRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  roiLabel: {
    width: "50%",
    padding: 8,
    backgroundColor: colors.cream,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  roiValue: {
    width: "50%",
    padding: 8,
    fontSize: 9,
    minHeight: 24,
  },
});

function CoverPage({ playbook }: { playbook: Playbook }) {
  return (
    <Page size="LETTER" style={styles.coverPage}>
      <View>
        <Text style={styles.coverBrand}>Clinovyr</Text>
        <Text style={styles.coverLogo}>Intelligence, Applied.</Text>
      </View>
      <View>
        <Text style={styles.coverTitle}>{playbook.title}</Text>
        <Text style={styles.coverSubtitle}>
          A practical implementation guide for {playbook.industry} teams in
          Placer County and beyond.
        </Text>
        <Text style={styles.coverMeta}>
          Version {playbook.version} · Published {playbook.publishDate}
        </Text>
      </View>
      <Text style={styles.coverMeta}>clinovyr.com · Granite Bay, California</Text>
    </Page>
  );
}

function TableOfContents({ playbook }: { playbook: Playbook }) {
  const items = [
    ...playbook.chapters.map((ch) => ({
      title: `Chapter ${ch.number}: ${ch.title}`,
    })),
    { title: "Tool Directory" },
    { title: "Prompt Library" },
    { title: "ROI Calculator" },
    ...playbook.checklistPages.map((page) => ({ title: page.title })),
  ];

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.pageHeader}>Table of Contents</Text>
      <Text style={styles.h1}>Contents</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.tocItem}>
          <Text style={styles.tocTitle}>{item.title}</Text>
          <Text style={styles.tocPage}>{index + 3}</Text>
        </View>
      ))}
    </Page>
  );
}

function ChapterPages({ playbook }: { playbook: Playbook }) {
  return (
    <>
      {playbook.chapters.map((chapter) => (
        <Page key={chapter.number} size="LETTER" style={styles.page} wrap>
          <Text style={styles.pageHeader}>
            Chapter {chapter.number} · {playbook.industry}
          </Text>
          <Text style={styles.h1}>{chapter.title}</Text>
          {chapter.sections.map((section, idx) => (
            <View key={idx} wrap={false}>
              <Text style={styles.h2}>{section.title}</Text>
              {section.content.split("\n\n").map((para, pIdx) => (
                <Text key={pIdx} style={styles.paragraph}>
                  {para}
                </Text>
              ))}
              {section.callouts.map((callout, cIdx) => (
                <View key={cIdx} style={styles.callout}>
                  <Text style={styles.calloutText}>{callout}</Text>
                </View>
              ))}
            </View>
          ))}
        </Page>
      ))}
    </>
  );
}

function ToolDirectoryPage({ playbook }: { playbook: Playbook }) {
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.pageHeader}>Tool Directory</Text>
      <Text style={styles.h1}>AI Tool Directory</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Tool</Text>
        <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Use Case</Text>
        <Text style={styles.tableHeaderCell}>Price</Text>
        <Text style={styles.tableHeaderCell}>Level</Text>
      </View>
      {playbook.toolDirectory.map((tool, idx) => (
        <View key={idx} style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 1.2, fontFamily: "Helvetica-Bold" }]}>
            {tool.name}
          </Text>
          <Text style={[styles.tableCell, { flex: 2 }]}>{tool.useCase}</Text>
          <Text style={styles.tableCell}>{tool.priceRange}</Text>
          <Text style={styles.tableCell}>{tool.difficulty}</Text>
        </View>
      ))}
    </Page>
  );
}

function PromptLibraryPages({ playbook }: { playbook: Playbook }) {
  return (
    <Page size="LETTER" style={styles.page} wrap>
      <Text style={styles.pageHeader}>Prompt Library</Text>
      <Text style={styles.h1}>Copy-Ready Prompt Library</Text>
      {playbook.promptLibrary.map((entry, idx) => (
        <View key={idx} wrap={false}>
          <Text style={styles.h3}>{entry.title}</Text>
          <Text style={[styles.paragraph, { color: colors.muted, fontSize: 9 }]}>
            {entry.useCase}
          </Text>
          <View style={styles.promptBox}>
            <Text style={styles.promptLabel}>Copy this prompt</Text>
            <Text style={styles.promptText}>{entry.prompt}</Text>
          </View>
        </View>
      ))}
    </Page>
  );
}

function RoiCalculatorPage({ playbook }: { playbook: Playbook }) {
  const { roiCalculator } = playbook;
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.pageHeader}>ROI Calculator</Text>
      <Text style={styles.h1}>ROI Calculator Worksheet</Text>
      <Text style={styles.paragraph}>{roiCalculator.formula}</Text>
      <View style={styles.roiTable}>
        {roiCalculator.inputs.map((input, idx) => (
          <View key={idx} style={styles.roiRow}>
            <Text style={styles.roiLabel}>{input}</Text>
            <Text style={styles.roiValue}> </Text>
          </View>
        ))}
        <View style={styles.roiRow}>
          <Text style={styles.roiLabel}>Calculated annual ROI</Text>
          <Text style={styles.roiValue}> </Text>
        </View>
      </View>
      <View style={styles.callout}>
        <Text style={styles.calloutText}>Example output:</Text>
        <Text style={styles.calloutText}>{roiCalculator.exampleOutput}</Text>
      </View>
    </Page>
  );
}

function ChecklistPages({ playbook }: { playbook: Playbook }) {
  return (
    <>
      {playbook.checklistPages.map((page, pageIdx) => (
        <Page key={pageIdx} size="LETTER" style={styles.page}>
          <Text style={styles.pageHeader}>Checklist</Text>
          <Text style={styles.h1}>{page.title}</Text>
          {page.items.map((item, idx) => (
            <View key={idx} style={styles.checkboxRow}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>{item}</Text>
            </View>
          ))}
        </Page>
      ))}
    </>
  );
}

function BackCover() {
  return (
    <Page size="LETTER" style={styles.backCover}>
      <Text style={styles.backTitle}>Ready to implement?</Text>
      <Text style={styles.backText}>
        Clinovyr helps Placer County businesses design, build, and optimize AI
        workflows — from readiness assessments to ongoing operations support.
      </Text>
      <Text style={[styles.backText, { marginTop: 24, color: colors.gold }]}>
        hello@clinovyr.com{"\n"}clinovyr.com
      </Text>
    </Page>
  );
}

export function PlaybookDocument({ playbook }: { playbook: Playbook }) {
  return (
    <Document
      title={playbook.title}
      author="Clinovyr"
      subject={`AI Implementation Playbook — ${playbook.industry}`}
    >
      <CoverPage playbook={playbook} />
      <TableOfContents playbook={playbook} />
      <ChapterPages playbook={playbook} />
      <ToolDirectoryPage playbook={playbook} />
      <PromptLibraryPages playbook={playbook} />
      <RoiCalculatorPage playbook={playbook} />
      <ChecklistPages playbook={playbook} />
      <BackCover />
    </Document>
  );
}
