jest.mock("@/lib/monthly-report-pdf", () => ({
  renderMonthlyReportPdfToBuffer: jest.fn(async () =>
    Buffer.alloc(60 * 1024, "x")
  ),
}));

import fs from "fs/promises";
import { generateMonthlyReport } from "@/lib/monthly-report";

const mockResendSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: (...args: unknown[]) => mockResendSend(...args) },
  })),
}));

describe("Report generation", () => {
  const clientId = "granite-bay-dental";
  const reportMonth = 5;
  const reportYear = 2026;

  beforeAll(() => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.ANTHROPIC_API_KEY = "";
  });

  beforeEach(() => {
    mockResendSend.mockReset();
    mockResendSend.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  it("sends email and returns narrative sections", async () => {
    const result = await generateMonthlyReport(
      clientId,
      reportMonth,
      reportYear
    );

    const stats = await fs.stat(result.pdfPath);
    expect(stats.size).toBeGreaterThan(50 * 1024);

    expect(result.narrative.executiveSummary).toEqual(expect.any(String));
    expect(result.narrative.winsThisMonth.length).toBeGreaterThanOrEqual(3);
    expect(result.narrative.lookingAhead).toEqual(expect.any(String));

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const emailPayload = mockResendSend.mock.calls[0][0] as {
      to: string;
      subject: string;
    };
    expect(emailPayload.to).toBe("ops@granitebaydental.test");
    expect(emailPayload.subject).toContain("May");
  });
});
