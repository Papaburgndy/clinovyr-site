declare module "pdf-parse" {
  type PdfParseResult = {
    numpages: number;
    text?: string;
  };

  function pdfParse(buffer: Buffer): Promise<PdfParseResult>;
  export default pdfParse;
}
