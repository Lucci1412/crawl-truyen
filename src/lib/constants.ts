// Client-side constants
export const AVAILABLE_SOURCES = ["Tàng Thư Viện"] as const;

export type SourceName = (typeof AVAILABLE_SOURCES)[number];
