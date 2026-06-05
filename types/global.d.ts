type _CHROME_STORAGE_CATE = "local" | "session" | "sync" | "managed";

type _SITE_CATE = "sv" | "kcq";
type _PAGE_CATE = "point" | "classCalendar" | "examCalendar" | "info" | "tuition";

type _PAGE_CONFIG = {
  tailUrl: string;
  regex: string;
  label: string;
};

type _SITE_CONFIG = {
  label: string;
  homepage: {
    url: string;
    regex: string;
  };
  baseRegexPrefix: string;
  pages: Record<_PAGE_CATE, _PAGE_CONFIG>;
};

type _SITE_MAPPING = Record<_SITE_CATE, _SITE_CONFIG>;

declare module "*.htm" {
  const content: string;
  export default content;
}

declare module "*.md?raw" {
  const content: string;
  export default content;
}
