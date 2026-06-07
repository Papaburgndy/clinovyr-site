export type DeliverableFileType =
  | "pdf"
  | "json"
  | "markdown"
  | "html"
  | "xlsx"
  | "zip";

export type DeliverableRecord = {
  key: string;
  name: string;
  url: string;
  type: DeliverableFileType;
  size: number;
  /** True when this deliverable was produced from fallback (non-Claude) content. */
  usedFallback?: boolean;
};

export type TriggerDeliverableGenerationParams = {
  companyId: string;
  product: string;
  deliverableKeys: string[];
  orderId: string;
};
