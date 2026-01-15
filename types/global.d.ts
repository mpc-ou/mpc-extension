type _CHROME_STORAGE_CATE = "local" | "session" | "sync" | "managed";

type _SITE_CATE = "sv" | "kcq";
type _SITE_MAPPING = Record<
  _SITE_CATE,
  {
    label: string;
    homepage: string;
    point: string;
    info: string;
    classCalendar: string;
    examCalendar: string;
  }
>;

declare module "*.htm" {
  const content: string;
  export default content;
}
