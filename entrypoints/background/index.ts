import {
  _GET_BASIC_INFO,
  _GET_CLASS_CALENDAR_DATA,
  _GET_CURRENT_URL,
  _GET_EXAM_CALENDAR_DATA,
  _GET_POINT_DATA,
  _GET_TUITION_DATA,
  _GET_USER_DATA,
  _NAVIGATE_TO_URL,
  _OPEN_NEW_TAB
} from "@/constants/chrome";
import { getBasicInfo } from "@/entrypoints/popup/scrapers/basic-info-scraper";
import { getCalendars, getExamCalendars } from "@/entrypoints/popup/scrapers/calendar-scraper";
import { getUserData } from "@/entrypoints/popup/scrapers/info-scraper";
import { getPointData } from "@/entrypoints/popup/scrapers/score-scraper";
import { getTuitionData } from "@/entrypoints/popup/scrapers/tuition-scraper";

async function executeScraper<T>(scraperFn: () => T | Promise<T>, sendResponse: (data: unknown) => void) {
  const TIMEOUT_MS = 60_000;
  let settled = false;
  const done = (data: unknown) => {
    if (!settled) {
      settled = true;
      sendResponse(data);
    }
  };

  const timer = setTimeout(() => {
    done({ status: "error", data: null, message: "Mạng của bạn không ổn định, vui lòng thử lại" });
  }, TIMEOUT_MS);

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      clearTimeout(timer);
      done({ status: "error", data: null, message: "Không tìm thấy tab hiện tại" });
      return;
    }
    const results = await browser.scripting.executeScript({ target: { tabId: tab.id }, func: scraperFn });
    clearTimeout(timer);
    done(results[0].result);
  } catch (error) {
    clearTimeout(timer);
    done({ status: "error", data: null, message: error instanceof Error ? error.message : "Lỗi không xác định" });
  }
}

const SCRAPER_REGISTRY: Record<string, () => unknown | Promise<unknown>> = {
  [_GET_POINT_DATA]: getPointData,
  [_GET_USER_DATA]: getUserData,
  [_GET_BASIC_INFO]: getBasicInfo,
  [_GET_CLASS_CALENDAR_DATA]: getCalendars,
  [_GET_EXAM_CALENDAR_DATA]: getExamCalendars,
  [_GET_TUITION_DATA]: getTuitionData
};

export default defineBackground(() => {
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === _GET_CURRENT_URL) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => sendResponse(tab.url));
      return true;
    }

    if (msg.type === _OPEN_NEW_TAB) {
      browser.tabs.create({ url: msg.url });
      return true;
    }

    if (msg.type === _NAVIGATE_TO_URL) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (!tab.id) {
          sendResponse({ status: "error", data: null, message: "Không tìm thấy tab hiện tại" });
          return;
        }
        if (tab.url !== msg.url) {
          browser.tabs.update(tab.id, { url: msg.url });
        }
      });
      return true;
    }

    const scraperFn = SCRAPER_REGISTRY[msg.type as string];
    if (scraperFn) {
      executeScraper(scraperFn, sendResponse);
      return true;
    }

    return false;
  });
});
