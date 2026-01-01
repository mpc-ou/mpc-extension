import { browser } from "wxt/browser";
import { _GET_CURRENT_URL, _GET_POINT_DATA } from "@/constants/chrome";
import { getPointData } from "../popup/PointTab/scripts";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === _GET_CURRENT_URL) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        sendResponse(tab.url);
      });

      return true;
    }

    if (msg.type === _GET_POINT_DATA) {
      browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (!tab.id) {
          return;
        }

        browser.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: getPointData
          })
          .then((results) => {
            const data = results[0].result;
            sendResponse(data);
          });
      });

      return true;
    }
  });
});
