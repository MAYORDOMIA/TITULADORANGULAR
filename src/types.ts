export interface TitlerPreset {
  id: string;
  label: string;
  type: "static" | "crawl" | "section"; // Added 'section' type
  name: string;
  role: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  fontFamily: string;
  animationType: "slide" | "fade" | "scale" | "bounce";
  position: "bottom-left" | "bottom-right" | "top-left" | "top-right" | "center-bottom" | "full-bottom";
  width: number;
  height: number;
  backgroundImage: string;
  crawlSpeed: number; // Speed for the scrolling text
}

export interface TitlerState {
  presets: TitlerPreset[];
  activePresetId: string | null;
  visible: boolean;
}
