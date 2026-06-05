export type CategoryType = "COURSE" | "LAB" | "EXAM" | "HOLIDAY" | "LESSON" | "OTHER";

// biome-ignore lint/performance/noBarrelFile: barrel file is necessary for public API
export * from "./calendar";
export * from "./point";
export * from "./site";
export * from "./tuition";
export * from "./user";
