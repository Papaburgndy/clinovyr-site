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
};

export type TriggerDeliverableGenerationParams = {
  companyId: string;
  product: string;
  deliverableKeys: string[];
  orderId: string;
};
