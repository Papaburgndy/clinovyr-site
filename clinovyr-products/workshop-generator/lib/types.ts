export type AgendaItemType = "intro" | "education" | "demo" | "exercise" | "q&a";

export type SlideType =
  | "title"
  | "agenda"
  | "education"
  | "stat"
  | "demo"
  | "exercise"
  | "cta";

export type WorkshopOutline = {
  title: string;
  agenda: Array<{
    timeMinutes: number;
    title: string;
    type: AgendaItemType;
  }>;
  slides: Array<{
    slideNumber: number;
    title: string;
    type: SlideType;
    bullets: string[];
    speakerNotes: string;
    demoDescription?: string;
  }>;
};

export type WorkshopInput = {
  industry: string;
  company: string;
  audience: string;
  durationMinutes: number;
};
