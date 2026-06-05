import type {
  CalendarEntry,
  ProgressCallback,
  SemesterData,
  WeekData,
} from "@/types";

type ScrapeResult<T> = { status: "success"; data: T; message: string } | { status: "error"; data: null; message: string };

const getCalendars = async (
  onProgress?: ProgressCallback,
): Promise<ScrapeResult<SemesterData[]>> => {
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const SUBJECT_CODE_REGEX = /\((.*?)\)/;
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const WEEK_MATCH_REGEX =
    /Tuần \(\d{2}\/\d{2}\/(\d{4}) - \d{2}\/\d{2}\/(\d{4})\)/;
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const WEEK_SORT_REGEX = /Tuần \((\d{2})\/(\d{2})\/(\d{4})/;
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const DATE_RANGE_REGEX =
    /(\d{2}\/\d{2}\/\d{2})\s*đến\s*(\d{2}\/\d{2}\/\d{2})/;
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const SINGLE_DATE_REGEX = /(\d{2}\/\d{2}\/\d{2})/;
  const PERIOD_TIME_MAP_GROUP_1: Record<
    number,
    { start: string; end: string }
  > = {
    1: { start: "07:00", end: "07:50" },
    2: { start: "07:50", end: "08:40" },
    3: { start: "08:40", end: "09:45" },
    4: { start: "09:45", end: "10:35" },
    5: { start: "10:35", end: "11:25" },
    6: { start: "11:30", end: "12:40" },
    7: { start: "12:45", end: "13:35" },
    8: { start: "13:35", end: "14:25" },
    9: { start: "14:25", end: "15:30" },
    10: { start: "15:30", end: "16:20" },
    11: { start: "16:20", end: "17:10" },
    12: { start: "17:30", end: "18:20" },
    13: { start: "18:20", end: "19:10" },
    14: { start: "19:10", end: "20:00" },
    15: { start: "20:00", end: "20:50" },
    16: { start: "20:50", end: "21:40" },
  };

  const PERIOD_TIME_MAP_GROUP_2: Record<
    number,
    { start: string; end: string }
  > = {
    1: { start: "07:30", end: "08:20" },
    2: { start: "08:20", end: "09:10" },
    3: { start: "09:10", end: "10:15" },
    4: { start: "10:15", end: "11:05" },
    5: { start: "11:05", end: "11:55" },
    6: { start: "12:00", end: "12:55" },
    7: { start: "13:00", end: "13:50" },
    8: { start: "13:50", end: "14:40" },
    9: { start: "14:40", end: "15:45" },
    10: { start: "15:45", end: "16:35" },
    11: { start: "16:35", end: "17:25" },
    12: { start: "17:30", end: "18:20" },
    13: { start: "18:20", end: "19:10" },
    14: { start: "19:10", end: "20:00" },
    15: { start: "20:00", end: "20:50" },
    16: { start: "20:50", end: "21:40" },
  };

  // ==================== CONFIGURATION ====================
  const CONFIG = {
    POLL_INTERVAL: 50, // ms between condition checks
    DROPDOWN_TIMEOUT: 3000, // max ms to wait for dropdown open/close
    TABLE_TIMEOUT: 10_000, // max ms to wait for table data after semester switch
    TABLE_EMPTY_TIMEOUT: 4000, // max ms to wait if table remains empty (no-data scenario)
    SCROLL_RETRIES: 15,
    ERROR_DISPLAY: 2000,
    COMPLETION_DELAY: 500,
    selectors: {
      semesterSelect: "div.col-lg-4 div.ng-input",
      semesterDropdown:
        "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel .ng-dropdown-panel-items",
      semesterItems:
        "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel div.scrollable-content > div",
      table: "#printArea > div.table-responsive-lg table.table",
      tableRows: "tbody tr",
    },
    // ── Legacy nested aliases for backward compat with getExamCalendars ──
    get limits() {
      return { maxScrollRetries: this.SCROLL_RETRIES };
    },
    get timeouts() {
      return {
        get dropdownOpen() {
          return CONFIG.DROPDOWN_TIMEOUT;
        },
        get dropdownClose() {
          return CONFIG.DROPDOWN_TIMEOUT;
        },
        get scrollWait() {
          return CONFIG.POLL_INTERVAL;
        },
        get tableUpdateLong() {
          return CONFIG.TABLE_TIMEOUT;
        },
        tableUpdateShort: 500,
        get errorDisplay() {
          return CONFIG.ERROR_DISPLAY;
        },
        get completionDelay() {
          return CONFIG.COMPLETION_DELAY;
        },
      };
    },
    overlayIds: {
      overlay: "mpc-crawl-overlay",
      progressBar: "mpc-crawl-progress-bar",
      progressText: "mpc-crawl-progress-text",
      message: "mpc-crawl-message",
      semesterInfo: "mpc-crawl-semester-info",
      cancelBtn: "mpc-crawl-cancel-btn",
    },
  };

  const _CANCEL_KEY = "__MPC_CANCEL__";
  const _CANCELLED_MSG = "Người dùng đã dừng nhập dữ liệu";

  const isCancelled = (): boolean => !!(window as unknown as Record<string, unknown>)[_CANCEL_KEY];

  // ── Smart polling: check condition every POLL_INTERVAL ms, resolve early, reject on timeout ──
  const pollUntil = (
    condition: () => boolean,
    timeoutMs: number,
    label?: string,
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      if (condition()) {
        resolve();
        return;
      }
      const start = Date.now();
      const timer = setInterval(() => {
        if (condition()) {
          clearInterval(timer);
          resolve();
        } else if (Date.now() - start >= timeoutMs) {
          clearInterval(timer);
          reject(new Error(label ? `Timeout: ${label}` : "Polling timeout"));
        }
      }, CONFIG.POLL_INTERVAL);
    });

  /** Poll until a selector matches an element in the DOM. */
  const waitForSelector = (
    selector: string,
    timeoutMs: number,
  ): Promise<void> =>
    pollUntil(() => !!document.querySelector(selector), timeoutMs, selector);

  /** Poll until a selector NO LONGER matches (element removed). */
  const waitForSelectorRemoved = (
    selector: string,
    timeoutMs: number,
  ): Promise<void> =>
    pollUntil(
      () => !document.querySelector(selector),
      timeoutMs,
      `removed:${selector}`,
    );

  // ── Legacy wait kept only for non-DOM delays (overlay animations, completion) ──
  const wait = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const createOverlay = (): HTMLDivElement => {
    const overlay = document.createElement("div");
    overlay.id = CONFIG.overlayIds.overlay;
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif";

    const card = document.createElement("div");
    card.style.cssText =
      "background:#fff;border-radius:8px;padding:24px;width:90%;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.15)";

    const title = document.createElement("h3");
    title.textContent = "Đang đọc lịch học";
    title.style.cssText =
      "margin:0 0 4px 0;font-size:16px;font-weight:600;color:#0f172a";

    const message = document.createElement("p");
    message.id = CONFIG.overlayIds.message;
    message.textContent = "Đang lấy danh sách học kỳ...";
    message.style.cssText = "margin:0 0 16px 0;font-size:14px;color:#64748b";

    const progressBg = document.createElement("div");
    progressBg.style.cssText =
      "background:#f1f5f9;border-radius:4px;height:8px;overflow:hidden;margin-bottom:8px";

    const progressBar = document.createElement("div");
    progressBar.id = CONFIG.overlayIds.progressBar;
    progressBar.style.cssText =
      "height:100%;background:#0f172a;width:0%;transition:width 0.3s ease";
    progressBg.appendChild(progressBar);

    const info = document.createElement("div");
    info.style.cssText =
      "display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:16px";

    const progressText = document.createElement("span");
    progressText.id = CONFIG.overlayIds.progressText;
    progressText.textContent = "0%";

    const semesterInfo = document.createElement("span");
    semesterInfo.id = CONFIG.overlayIds.semesterInfo;

    info.appendChild(progressText);
    info.appendChild(semesterInfo);

    const cancelBtn = document.createElement("button");
    cancelBtn.id = CONFIG.overlayIds.cancelBtn;
    cancelBtn.textContent = "Hủy";
    cancelBtn.style.cssText =
      "width:100%;padding:8px 16px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;color:#374151;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:12px;transition:background 0.15s";
    cancelBtn.addEventListener("mouseenter", () => { cancelBtn.style.background = "#f3f4f6"; });
    cancelBtn.addEventListener("mouseleave", () => { cancelBtn.style.background = "#f9fafb"; });
    cancelBtn.addEventListener("click", () => {
      (window as unknown as Record<string, unknown>)[_CANCEL_KEY] = true;
      cancelBtn.textContent = "Đang hủy...";
      cancelBtn.disabled = true;
      cancelBtn.style.opacity = "0.6";
      cancelBtn.style.cursor = "not-allowed";
    });

    const warning = document.createElement("div");
    warning.style.cssText =
      "background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px;font-size:13px;color:#991b1b;line-height:1.5";
    warning.innerHTML =
      "<strong>⚠️ Lưu ý:</strong> Không tắt hay thu nhỏ cửa sổ, tắt popup hay chuyển trang. Quá trình này có thể mất vài phút tùy vào số lượng dữ liệu.";

    card.append(title, message, progressBg, info, cancelBtn, warning);
    overlay.appendChild(card);
    return overlay;
  };

  const showOverlay = (): void => {
    const existing = document.getElementById(CONFIG.overlayIds.overlay);
    if (existing) {
      existing.remove();
    }
    document.body.appendChild(createOverlay());
    document.body.style.overflow = "hidden";
  };

  const updateOverlay = (progress: number, message: string): void => {
    const progressBar = document.getElementById(CONFIG.overlayIds.progressBar);
    const progressText = document.getElementById(
      CONFIG.overlayIds.progressText,
    );
    const messageEl = document.getElementById(CONFIG.overlayIds.message);

    if (progressBar) {
      progressBar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
    }
    if (progressText) {
      progressText.textContent = `${Math.round(progress)}%`;
    }
    if (messageEl) {
      messageEl.textContent = message;
    }
  };

  const updateSemesterInfo = (info: string): void => {
    const el = document.getElementById(CONFIG.overlayIds.semesterInfo);
    if (el) {
      el.textContent = info;
    }
  };

  const hideOverlay = (): void => {
    const overlay = document.getElementById(CONFIG.overlayIds.overlay);
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = "";
      }, 300);
    }
  };

  const scrollDropdownToLoadAll = async (
    scrollableContent: Element,
  ): Promise<void> => {
    const el = scrollableContent as HTMLElement;
    el.scrollTop = el.scrollHeight;
    await wait(250);
  };

  const getSemesters = async (): Promise<string[]> => {
    // Capture the currently selected semester BEFORE any DOM interaction
    const getCurrentSelected = (): string | null => {
      const labelEl =
        document.querySelector(
          "ng-select[bindvalue='hoc_ky'] .ng-value-label",
        ) ||
        document.querySelector(
          "ng-select[bindlabel='ten_hoc_ky'] .ng-value-label",
        ) ||
        document.querySelector(".ng-value-label");
      return labelEl?.textContent?.trim() || null;
    };

    const savedCurrent = getCurrentSelected();

    const semesterSelect = document.querySelector(
      CONFIG.selectors.semesterSelect,
    );
    if (!semesterSelect) {
      if (savedCurrent) {
        return [savedCurrent];
      }
      throw new Error(
        "Không tìm thấy selector học kỳ. Hãy đảm bảo bạn đang ở trang TKB Học kỳ.",
      );
    }

    semesterSelect.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true }),
    );
    await waitForSelector(
      CONFIG.selectors.semesterDropdown,
      CONFIG.DROPDOWN_TIMEOUT,
    );

    // Collect items while scrolling — virtual scroll only keeps viewport items in DOM
    const seen = new Set<string>();
    const scrollEl = document.querySelector(
      CONFIG.selectors.semesterDropdown,
    ) as HTMLElement | null;
    if (scrollEl) {
      const step = scrollEl.clientHeight || 100;
      let pos = 0;
      while (pos < scrollEl.scrollHeight) {
        scrollEl.scrollTop = pos;
        await wait(150);
        const items = document.querySelectorAll(CONFIG.selectors.semesterItems);
        for (const item of items) {
          const t = item.textContent?.trim();
          if (t) seen.add(t);
        }
        pos += step;
      }
      // Final scroll to absolute bottom
      scrollEl.scrollTop = scrollEl.scrollHeight;
      await wait(200);
      const items = document.querySelectorAll(CONFIG.selectors.semesterItems);
      for (const item of items) {
        const t = item.textContent?.trim();
        if (t) seen.add(t);
      }
    }

    const semesters = Array.from(seen);

    semesterSelect.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true }),
    );
    await waitForSelectorRemoved(
      CONFIG.selectors.semesterDropdown,
      CONFIG.DROPDOWN_TIMEOUT,
    );
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await wait(50);

    if (semesters.length === 0 && savedCurrent) {
      console.warn(
        "Dropdown không có items, fallback về học kỳ hiện tại:",
        savedCurrent,
      );
      return [savedCurrent];
    }

    return semesters.reverse();
  };

  /** Two-phase spinner poll: wait for overlay to APPEAR (Angular started), then DISAPPEAR (done), then settle + verify. */
  const waitForSpinnerThenSettle = async (settleMs = 500): Promise<void> => {
    const spinnerSelector = "ngx-spinner .ngx-spinner-overlay";
    const pollInterval = CONFIG.POLL_INTERVAL;
    const maxWait = CONFIG.TABLE_TIMEOUT;

    // Phase 1: Wait for spinner overlay to APPEAR (Angular may take a moment to start)
    const phase1Start = Date.now();
    while (Date.now() - phase1Start < maxWait) {
      if (document.querySelector(spinnerSelector)) break;
      await wait(pollInterval);
    }

    // Phase 2: Wait for spinner overlay to DISAPPEAR (loading done)
    const phase2Start = Date.now();
    while (Date.now() - phase2Start < maxWait) {
      if (!document.querySelector(spinnerSelector)) break;
      await wait(pollInterval);
    }

    // Angular renders data after spinner hides
    await wait(settleMs);

    // Verify table has actual data rows
    const table = document.querySelector(CONFIG.selectors.table);
    if (table) {
      const verifyMax = 5000;
      const verifyStart = Date.now();
      while (Date.now() - verifyStart < verifyMax) {
        const rows = table.querySelectorAll("tbody tr");
        if (
          rows.length > 0 &&
          !rows[0]?.textContent?.includes("Không tìm thấy")
        )
          break;
        await wait(200);
      }
    }
  };

  const selectSemester = async (semesterText: string): Promise<void> => {
    const currentLabel =
      document
        .querySelector("ng-select[bindlabel='ten_hoc_ky'] .ng-value-label")
        ?.textContent?.trim() ||
      document.querySelector("ng-select .ng-value-label")?.textContent?.trim();

    // Already showing the requested semester — still wait for any pending render
    if (currentLabel === semesterText) {
      await waitForSpinnerThenSettle();
      return;
    }

    const semesterSelect = document.querySelector(
      CONFIG.selectors.semesterSelect,
    );
    if (!semesterSelect) {
      throw new Error("Không tìm thấy selector học kỳ");
    }

    semesterSelect.dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true }),
    );
    await waitForSelector(
      CONFIG.selectors.semesterDropdown,
      CONFIG.DROPDOWN_TIMEOUT,
    );

    const scrollableContent = document.querySelector(
      CONFIG.selectors.semesterDropdown,
    );
    if (scrollableContent) {
      await scrollDropdownToLoadAll(scrollableContent);
    }

    const items = document.querySelectorAll(CONFIG.selectors.semesterItems);
    const targetItem = Array.from(items).find(
      (node) => node.textContent?.trim() === semesterText,
    ) as HTMLElement;

    if (!targetItem) {
      semesterSelect.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
      await waitForSelectorRemoved(
        CONFIG.selectors.semesterDropdown,
        CONFIG.DROPDOWN_TIMEOUT,
      );
      console.warn(
        `Không tìm thấy học kỳ "${semesterText}" trong dropdown, dùng dữ liệu hiện tại.`,
      );
      return;
    }

    targetItem.scrollIntoView({ block: "nearest" });
    await wait(CONFIG.POLL_INTERVAL);
    targetItem.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    targetItem.click();

    // Wait for Angular spinner to appear then disappear, then settle for data render.
    // Don't wait for dropdown close separately — the spinner is the reliable loading signal.
    await waitForSpinnerThenSettle();
  };

  const parseDateString = (dateStr: string): Date => {
    const [d, m, y] = dateStr.split("/");
    const fullYear = Number.parseInt(y, 10) + 2000;
    return new Date(
      fullYear,
      Number.parseInt(m, 10) - 1,
      Number.parseInt(d, 10),
    );
  };

  const getDayOffset = (dayStr: string): number => {
    if (dayStr.toUpperCase() === "CN" || dayStr === "8") {
      return 0;
    }
    return Number.parseInt(dayStr, 10) - 1;
  };

  type TempSubject = {
    code: string;
    title: string;
    group: string;
    teacherFallback: string;
  };

  const parseRoomInfo = (
    roomStr: string,
    hasLink: boolean,
  ): {
    category: "COURSE" | "LAB" | "OTHER";
    locationType: "NB" | "MLA" | "VVT" | "GP" | "LB" | "OTHER";
    formattedRoom: string;
  } => {
    let category: "COURSE" | "LAB" | "OTHER" = "COURSE";
    let locationType: "NB" | "MLA" | "VVT" | "GP" | "LB" | "OTHER" = "OTHER";
    let locationText = "";
    const lowerRoom = roomStr.trim();

    const rules = [
      {
        prefix: "NB.PM",
        cat: "LAB",
        locText: "Cơ sở Nhơn Đức (Nhà Bè)",
        locType: "NB",
      },
      {
        prefix: "NB.PDN",
        cat: "OTHER",
        locText: "Cơ sở Nhơn Đức (Nhà Bè)",
        locType: "NB",
      },
      {
        prefix: "NB",
        cat: "COURSE",
        locText: "Cơ sở Nhơn Đức (Nhà Bè)",
        locType: "NB",
      },
      {
        prefix: "LB.GDQP",
        cat: "OTHER",
        locText: "Cơ sở Long Hưng (Long Bình Tân)",
        locType: "LB",
      },
      {
        prefix: "LB",
        cat: "OTHER",
        locText: "Cơ sở Long Hưng (Long Bình Tân)",
        locType: "LB",
      },
      {
        prefix: "MLA",
        cat: "COURSE",
        locText: "Cơ sở Mai Thị Lựu",
        locType: "MLA",
      },
      {
        prefix: "MLD",
        cat: "COURSE",
        locText: "Cơ sở Mai Thị Lựu",
        locType: "MLA",
      },
      {
        prefix: "A.PM",
        cat: "LAB",
        locText: "Cơ sở Võ Văn Tần",
        locType: "VVT",
      },
      {
        prefix: "A",
        cat: "COURSE",
        locText: "Cơ sở Võ Văn Tần",
        locType: "VVT",
      },
      { prefix: "GP", cat: "COURSE", locText: "Cơ sở Gia Phú", locType: "GP" },
    ] as const;

    const matchedRule = rules.find((rule) => lowerRoom.startsWith(rule.prefix));
    if (matchedRule) {
      category = matchedRule.cat as "COURSE" | "LAB" | "OTHER";
      locationText = matchedRule.locText;
      locationType = matchedRule.locType as "NB" | "MLA" | "VVT" | "GP" | "LB";
    }

    if (hasLink || lowerRoom.toLowerCase().includes("online")) {
      locationText = locationText ? `${locationText} (Online)` : "Online";
    }

    const formattedRoom = lowerRoom
      ? `${lowerRoom}${locationText ? `, ${locationText}` : ""}`
      : locationText;
    return { category, locationType, formattedRoom };
  };

  const generateEntriesFromRow = (
    subject: TempSubject,
    dayStr: string,
    startPeriodStr: string,
    numPeriodsStr: string,
    roomText: string,
    link: string,
    teacher: string,
    dateRangeStr: string,
  ): { date: Date; entry: CalendarEntry }[] => {
    const startPeriod = Number.parseInt(startPeriodStr, 10);
    const numPeriods = Number.parseInt(numPeriodsStr, 10);
    const endPeriod = startPeriod + numPeriods - 1;

    const { category, locationType, formattedRoom } = parseRoomInfo(
      roomText,
      !!link,
    );

    const timeMap = ["NB", "LB"].includes(locationType)
      ? PERIOD_TIME_MAP_GROUP_2
      : PERIOD_TIME_MAP_GROUP_1;

    const { start: startTime, end: endTime } = {
      start: timeMap[startPeriod]?.start || "",
      end: timeMap[endPeriod]?.end || "",
    };

    const description = link ? `Link học: ${link}` : "";

    // Parse date range: e.g. "05/02/26 đến 12/03/26"
    const match = dateRangeStr.match(DATE_RANGE_REGEX);
    let startDate: Date;
    let endDate: Date;

    if (match) {
      startDate = parseDateString(match[1]);
      endDate = parseDateString(match[2]);
    } else {
      const singleMatch = dateRangeStr.match(SINGLE_DATE_REGEX);
      if (singleMatch) {
        startDate = parseDateString(singleMatch[1]);
        endDate = startDate;
      } else {
        return [];
      }
    }

    const targetDay = getDayOffset(dayStr);
    const results: { date: Date; entry: CalendarEntry }[] = [];
    const currDate = new Date(startDate);

    while (currDate <= endDate) {
      if (currDate.getDay() === targetDay) {
        const dd = String(currDate.getDate()).padStart(2, "0");
        const mm = String(currDate.getMonth() + 1).padStart(2, "0");
        const formattedDay = `Thứ ${dayStr} (${dd}/${mm})`;

        results.push({
          date: new Date(currDate),
          entry: {
            category,
            eventType: "STUDY",
            locationType,
            day: formattedDay, // Format matching old "Thứ X (dd/mm)"
            startPeriod,
            endPeriod,
            startTime,
            endTime,
            title: subject.title,
            code: subject.code,
            group: subject.group,
            room: formattedRoom,
            teacher,
            description,
            link,
          },
        });
      }
      currDate.setDate(currDate.getDate() + 1);
    }

    return results;
  };

  const getWeekStartEnd = (date: Date): { start: Date; end: Date } => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const start = new Date(date);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const formatWeekString = (start: Date, end: Date): string => {
    const ddStart = String(start.getDate()).padStart(2, "0");
    const mmStart = String(start.getMonth() + 1).padStart(2, "0");
    const yyyyStart = start.getFullYear();

    const ddEnd = String(end.getDate()).padStart(2, "0");
    const mmEnd = String(end.getMonth() + 1).padStart(2, "0");
    const yyyyEnd = end.getFullYear();

    // Format matching "Tuần ... (dd/mm/yyyy - dd/mm/yyyy)" so existing regex works
    return `Tuần (${ddStart}/${mmStart}/${yyyyStart} - ${ddEnd}/${mmEnd}/${yyyyEnd})`;
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: the scraping logic is complex but linear
  const scrapeScheduleTable = (): WeekData[] => {
    const table = document.querySelector(CONFIG.selectors.table);
    if (!table) {
      throw new Error("Không tìm thấy bảng TKB. Hãy đảm bảo bạn đang ở trang TKB Học kỳ.");
    }

    const rows = [...table.querySelectorAll(CONFIG.selectors.tableRows)];
    const allEntries: { date: Date; entry: CalendarEntry }[] = [];
    let currentSubjectInfo: TempSubject | null = null;

    for (const row of rows) {
      const cells = [...row.querySelectorAll("td")];
      if (cells.length === 0) {
        continue;
      }

      if (cells.length >= 15) {
        // First row of a subject (usually 21 columns)
        const getText = (index: number) =>
          cells[index]?.textContent?.trim() || "";
        const codeText = getText(0);
        const titleLine = getText(1);
        const title = titleLine.split("(")[0].trim();
        const code = titleLine.match(SUBJECT_CODE_REGEX)?.[1] || codeText;
        const group = getText(3);

        if (code.startsWith("_")) {
          currentSubjectInfo = null;
          continue;
        }

        const dayStr = getText(9); // 10th col (index 9)
        const startPeriodStr = getText(10);
        const numPeriodsStr = getText(11);

        const roomCell = cells[12];
        let roomText = roomCell?.textContent?.trim() || "";
        const linkEl = roomCell?.querySelector("a");
        let link = linkEl?.href || "";

        if (!link) {
          const urlMatch = roomText.match(/(https?:\/\/[^\s,]+)/);
          if (urlMatch) {
            link = urlMatch[1];
          }
        }

        if (link) {
          const linkTextToRemove = linkEl?.textContent?.trim() || link;
          roomText = roomText
            .replace(linkTextToRemove, "")
            .replace(/(?:,\s*)?Online\s*$/i, "")
            .trim();
        }

        const teacher = getText(14);
        const dateRangeStr = getText(15);

        currentSubjectInfo = {
          code,
          title,
          group,
          teacherFallback: teacher,
        };

        if (numPeriodsStr === "0") {
          continue;
        }

        const entries = generateEntriesFromRow(
          currentSubjectInfo,
          dayStr,
          startPeriodStr,
          numPeriodsStr,
          roomText,
          link,
          teacher,
          dateRangeStr,
        );
        allEntries.push(...entries);
      } else {
        if (!currentSubjectInfo) {
          continue;
        }

        const getText = (index: number) =>
          cells[index]?.textContent?.trim() || "";
        const dayStr = getText(0); // 1st col
        const startPeriodStr = getText(1);
        const numPeriodsStr = getText(2);

        const roomCell = cells[3];
        let roomText = roomCell?.textContent?.trim() || "";
        const linkEl = roomCell?.querySelector("a");
        let link = linkEl?.href || "";

        if (!link) {
          const urlMatch = roomText.match(/(https?:\/\/[^\s,]+)/);
          if (urlMatch) {
            link = urlMatch[1];
          }
        }

        if (link) {
          const linkTextToRemove = linkEl?.textContent?.trim() || link;
          roomText = roomText
            .replace(linkTextToRemove, "")
            .replace(/(?:,\s*)?Online\s*$/i, "")
            .trim();
        }

        let teacher = getText(5);
        if (teacher) {
          currentSubjectInfo.teacherFallback = teacher;
        } else {
          teacher = currentSubjectInfo.teacherFallback;
        }

        const dateRangeStr = getText(6); // 7th col

        if (numPeriodsStr === "0") {
          continue;
        }

        const entries = generateEntriesFromRow(
          currentSubjectInfo,
          dayStr,
          startPeriodStr,
          numPeriodsStr,
          roomText,
          link,
          teacher,
          dateRangeStr,
        );
        allEntries.push(...entries);
      }
    }

    // Group all generated entries by week
    const weekMap = new Map<string, CalendarEntry[]>();

    for (const { date, entry } of allEntries) {
      const { start, end } = getWeekStartEnd(date);
      const weekStr = formatWeekString(start, end);

      if (!weekMap.has(weekStr)) {
        weekMap.set(weekStr, []);
      }
      weekMap.get(weekStr)?.push(entry);
    }

    const sortedWeeks = Array.from(weekMap.entries())
      .map(([week, schedule]) => {
        const match = week.match(WEEK_MATCH_REGEX);
        const year = match ? Number.parseInt(match[1], 10) : 0;
        return { week, schedule };
      })
      .sort((a, b) => {
        const aMatch = a.week.match(WEEK_SORT_REGEX);
        const bMatch = b.week.match(WEEK_SORT_REGEX);
        if (aMatch && bMatch) {
          const dateA = new Date(
            Number.parseInt(aMatch[3], 10),
            Number.parseInt(aMatch[2], 10) - 1,
            Number.parseInt(aMatch[1], 10),
          ).getTime();
          const dateB = new Date(
            Number.parseInt(bMatch[3], 10),
            Number.parseInt(bMatch[2], 10) - 1,
            Number.parseInt(bMatch[1], 10),
          ).getTime();
          return dateA - dateB;
        }
        return 0;
      });

    return sortedWeeks;
  };

  // ==================== MAIN EXECUTION ====================
  try {
    (window as unknown as Record<string, unknown>)[_CANCEL_KEY] = false;

    if (!window.location.hash.includes("/tkb-hocky")) {
      return { status: "error", data: null, message: "Vui lòng chuyển đến trang 'Thời khóa biểu dạng học kỳ' để thực hiện thao tác này." };
    }

    showOverlay();
    onProgress?.(0, "Đang lấy danh sách học kỳ...");
    updateOverlay(0, "Đang lấy danh sách học kỳ...");

    const semesters = await getSemesters();
    if (semesters.length === 0) {
      return { status: "error", data: null, message: "Không tìm thấy học kỳ nào" };
    }

    const allData: SemesterData[] = [];
    const totalSemesters = semesters.length;

    for (
      let semesterIndex = 0;
      semesterIndex < semesters.length;
      semesterIndex++
    ) {
      if (isCancelled()) {
        hideOverlay();
        return { status: "error", data: null, message: _CANCELLED_MSG };
      }

      const semester = semesters[semesterIndex];
      const semesterProgress = (semesterIndex / totalSemesters) * 100;

      onProgress?.(semesterProgress, `Đang xử lý học kỳ: ${semester}`);
      updateOverlay(semesterProgress, `Đang xử lý học kỳ: ${semester}`);
      updateSemesterInfo(`${semesterIndex + 1}/${totalSemesters}`);

      await selectSemester(semester);

      if (isCancelled()) {
        hideOverlay();
        return { status: "error", data: null, message: _CANCELLED_MSG };
      }

      const weeks = scrapeScheduleTable();
      allData.push({ semester, weeks });
    }

    onProgress?.(100, "Hoàn thành!");
    updateOverlay(100, "Hoàn thành! Đang lưu dữ liệu...");

    await wait(CONFIG.timeouts.completionDelay);
    hideOverlay();

    return { status: "success", data: allData, message: "" };
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu lịch học:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);

    onProgress?.(-1, errorMsg);
    updateOverlay(0, `Lỗi: ${errorMsg}`);

    await wait(CONFIG.timeouts.errorDisplay);
    hideOverlay();

    return { status: "error", data: null, message: `Lỗi: ${errorMsg}` };
  } finally {
    (window as unknown as Record<string, unknown>)[_CANCEL_KEY] = false;
  }
};

export type {
  CalendarEntry,
  ProgressCallback,
  SemesterData,
  WeekData,
} from "@/types";
export { getCalendars };
export const getExamCalendars = async (
  onProgress?: ProgressCallback,
): Promise<ScrapeResult<SemesterData[]>> => {
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const WEEK_MATCH_REGEX =
    /Tuần \(\d{2}\/\d{2}\/(\d{4}) - \d{2}\/\d{2}\/(\d{4})\)/;
  // biome-ignore lint/performance/useTopLevelRegex: Must be scoped within function for injection via executeScript
  const WEEK_SORT_REGEX = /Tuần \((\d{2})\/(\d{2})\/(\d{4})/;

  // ==================== CONFIGURATION ====================
  const CONFIG = {
    selectors: {
      semesterSelect: "ng-select[bindlabel='ten_hoc_ky'] div.ng-input",
      semesterDropdown:
        "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel .ng-dropdown-panel-items",
      semesterItems:
        "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel div.scrollable-content > div",
      table: "#printArea div.table-responsive-lg table.table",
      tableRows: "tbody tr",
    },
    timeouts: {
      dropdownOpen: 300,
      dropdownClose: 200,
      scrollWait: 100,
      tableUpdateLong: 15_000,
      tableUpdateShort: 1000,
      errorDisplay: 2000,
      completionDelay: 500,
    },
    limits: {
      maxScrollRetries: 15,
    },
    overlayIds: {
      overlay: "mpc-crawl-overlay",
      progressBar: "mpc-crawl-progress-bar",
      progressText: "mpc-crawl-progress-text",
      message: "mpc-crawl-message",
      semesterInfo: "mpc-crawl-semester-info",
      cancelBtn: "mpc-crawl-cancel-btn",
    },
  };

  // ==================== HELPER FUNCTIONS ====================
  const _CANCEL_KEY = "__MPC_CANCEL__";
  const _CANCELLED_MSG = "Người dùng đã dừng nhập dữ liệu";
  const isCancelled = (): boolean => !!(window as unknown as Record<string, unknown>)[_CANCEL_KEY];

  const wait = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const createOverlay = (): HTMLDivElement => {
    const overlay = document.createElement("div");
    overlay.id = CONFIG.overlayIds.overlay;
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif";

    const card = document.createElement("div");
    card.style.cssText =
      "background:#fff;border-radius:8px;padding:24px;width:90%;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.15)";

    const title = document.createElement("h3");
    title.textContent = "Đang đọc lịch thi";
    title.style.cssText =
      "margin:0 0 4px 0;font-size:16px;font-weight:600;color:#0f172a";

    const message = document.createElement("p");
    message.id = CONFIG.overlayIds.message;
    message.textContent = "Đang lấy danh sách học kỳ...";
    message.style.cssText = "margin:0 0 16px 0;font-size:14px;color:#64748b";

    const progressBg = document.createElement("div");
    progressBg.style.cssText =
      "background:#f1f5f9;border-radius:4px;height:8px;overflow:hidden;margin-bottom:8px";

    const progressBar = document.createElement("div");
    progressBar.id = CONFIG.overlayIds.progressBar;
    progressBar.style.cssText =
      "height:100%;background:#0f172a;width:0%;transition:width 0.3s ease";
    progressBg.appendChild(progressBar);

    const info = document.createElement("div");
    info.style.cssText =
      "display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:16px";

    const progressText = document.createElement("span");
    progressText.id = CONFIG.overlayIds.progressText;
    progressText.textContent = "0%";

    const semesterInfo = document.createElement("span");
    semesterInfo.id = CONFIG.overlayIds.semesterInfo;

    info.appendChild(progressText);
    info.appendChild(semesterInfo);

    const cancelBtn = document.createElement("button");
    cancelBtn.id = CONFIG.overlayIds.cancelBtn;
    cancelBtn.textContent = "Hủy";
    cancelBtn.style.cssText =
      "width:100%;padding:8px 16px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;color:#374151;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:12px;transition:background 0.15s";
    cancelBtn.addEventListener("mouseenter", () => { cancelBtn.style.background = "#f3f4f6"; });
    cancelBtn.addEventListener("mouseleave", () => { cancelBtn.style.background = "#f9fafb"; });
    cancelBtn.addEventListener("click", () => {
      (window as unknown as Record<string, unknown>)[_CANCEL_KEY] = true;
      cancelBtn.textContent = "Đang hủy...";
      cancelBtn.disabled = true;
      cancelBtn.style.opacity = "0.6";
      cancelBtn.style.cursor = "not-allowed";
    });

    const warning = document.createElement("div");
    warning.style.cssText =
      "background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px;font-size:13px;color:#991b1b;line-height:1.5";
    warning.innerHTML =
      "<strong>⚠️ Lưu ý:</strong> Không tắt hay thu nhỏ cửa sổ, tắt popup hay chuyển trang. Quá trình này có thể mất vài phút tùy vào số lượng dữ liệu.";

    card.append(title, message, progressBg, info, cancelBtn, warning);
    overlay.appendChild(card);
    return overlay;
  };

  const showOverlay = (): void => {
    const existing = document.getElementById(CONFIG.overlayIds.overlay);
    if (existing) {
      existing.remove();
    }
    document.body.appendChild(createOverlay());
    document.body.style.overflow = "hidden";
  };

  const updateOverlay = (progress: number, message: string): void => {
    const progressBar = document.getElementById(CONFIG.overlayIds.progressBar);
    const progressText = document.getElementById(
      CONFIG.overlayIds.progressText,
    );
    const messageEl = document.getElementById(CONFIG.overlayIds.message);

    if (progressBar) {
      progressBar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
    }
    if (progressText) {
      progressText.textContent = `${Math.round(progress)}%`;
    }
    if (messageEl) {
      messageEl.textContent = message;
    }
  };

  const updateSemesterInfo = (info: string): void => {
    const el = document.getElementById(CONFIG.overlayIds.semesterInfo);
    if (el) {
      el.textContent = info;
    }
  };

  const hideOverlay = (): void => {
    const overlay = document.getElementById(CONFIG.overlayIds.overlay);
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = "";
      }, 300);
    }
  };

  const scrollDropdownToLoadAll = async (
    scrollableContent: Element,
  ): Promise<void> => {
    const el = scrollableContent as HTMLElement;
    el.scrollTop = el.scrollHeight;
    await wait(250);
  };

  const getSemesters = async (): Promise<string[]> => {
    // Capture the currently selected semester BEFORE any DOM interaction
    const getCurrentSelected = (): string | null => {
      const labelEl =
        document.querySelector(
          "ng-select[bindvalue='hoc_ky'] .ng-value-label",
        ) ||
        document.querySelector(
          "ng-select[bindlabel='ten_hoc_ky'] .ng-value-label",
        ) ||
        document.querySelector(".ng-value-label");
      return labelEl?.textContent?.trim() || null;
    };

    const savedCurrent = getCurrentSelected();

    const inputDiv =
      document.querySelector(
        "ng-select[bindlabel='ten_hoc_ky'] div.ng-input",
      ) || document.querySelector("ng-select div.ng-input");

    if (!inputDiv) {
      if (savedCurrent) {
        return [savedCurrent];
      }
      throw new Error("Không tìm thấy bộ chọn học kỳ");
    }

    inputDiv.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await wait(CONFIG.timeouts.dropdownOpen);

    // Find scroll container — exam dropdown uses .ng-dropdown-panel-items
    const dropdownSelectors = [
      "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel .ng-dropdown-panel-items",
      "ng-select ng-dropdown-panel .ng-dropdown-panel-items",
      "ng-dropdown-panel .ng-dropdown-panel-items",
    ];
    let scrollEl: HTMLElement | null = null;
    for (const sel of dropdownSelectors) {
      scrollEl = document.querySelector(sel);
      if (scrollEl) break;
    }

    // ── Scroll from TOP down — newest semesters are at the top; stop after 15 ──
    const MAX_EXAM_SEMESTERS = 15;
    const seen = new Set<string>();
    if (scrollEl) {
      const itemSelector = "ng-dropdown-panel .ng-option";
      const step = scrollEl.clientHeight || 100;
      let pos = 0;
      while (pos < scrollEl.scrollHeight && seen.size < MAX_EXAM_SEMESTERS) {
        scrollEl.scrollTop = pos;
        await wait(150);
        const items = document.querySelectorAll(itemSelector);
        for (const item of items) {
          const t = item.textContent?.trim();
          if (t) seen.add(t);
        }
        pos += step;
      }
    } else {
      const staticItems = document.querySelectorAll(
        "ng-dropdown-panel .ng-option",
      );
      for (const item of staticItems) {
        const t = item.textContent?.trim();
        if (t) seen.add(t);
      }
    }

    const semesters = Array.from(seen);

    inputDiv.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await wait(CONFIG.timeouts.dropdownClose);
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await wait(100);

    if (semesters.length === 0 && savedCurrent) {
      console.warn(
        "Dropdown không có items, fallback về học kỳ hiện tại:",
        savedCurrent,
      );
      return [savedCurrent];
    }

    return semesters;
  };

  const selectSemester = async (
    semesterName: string,
    _index: number,
  ): Promise<void> => {
    const currentLabel =
      document
        .querySelector("ng-select[bindlabel='ten_hoc_ky'] .ng-value-label")
        ?.textContent?.trim() ||
      document.querySelector("ng-select .ng-value-label")?.textContent?.trim();
    if (currentLabel === semesterName) {
      const spinnerSelector = "ngx-spinner .ngx-spinner-overlay";
      const maxWait = CONFIG.timeouts.tableUpdateLong;
      const p1Start = Date.now();
      while (Date.now() - p1Start < maxWait) {
        if (document.querySelector(spinnerSelector)) break;
        await wait(100);
      }
      const p2Start = Date.now();
      while (Date.now() - p2Start < maxWait) {
        if (!document.querySelector(spinnerSelector)) break;
        await wait(100);
      }
      await wait(500);
      return;
    }

    const inputDiv =
      document.querySelector(
        "ng-select[bindlabel='ten_hoc_ky'] div.ng-input",
      ) || document.querySelector("ng-select div.ng-input");
    const clickTarget =
      inputDiv ||
      (document.querySelector(
        "ng-select[bindlabel='ten_hoc_ky']",
      ) as HTMLElement);

    if (!clickTarget) {
      throw new Error("Không tìm thấy bộ chọn học kỳ để tải dữ liệu");
    }

    // Open dropdown
    clickTarget.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await wait(CONFIG.timeouts.dropdownOpen);

    // Find virtual-scroll host (.ng-dropdown-panel-items)
    const scrollHostSelectors = [
      "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel .ng-dropdown-panel-items",
      "ng-select ng-dropdown-panel .ng-dropdown-panel-items",
      "ng-dropdown-panel .ng-dropdown-panel-items",
    ];
    let scrollHost: HTMLElement | null = null;
    for (const sel of scrollHostSelectors) {
      scrollHost = document.querySelector(sel);
      if (scrollHost) break;
    }

    // ── Scroll step-by-step (like getSemesters) until target item appears in DOM ──
    let targetItem: Element | undefined;
    if (scrollHost) {
      const step = scrollHost.clientHeight || 120;
      let pos = 0;
      while (pos < scrollHost.scrollHeight) {
        scrollHost.scrollTop = pos;
        await wait(150);

        const options = document.querySelectorAll(
          "ng-dropdown-panel .ng-option",
        );
        targetItem = Array.from(options).find(
          (item) => item.textContent?.trim() === semesterName,
        );
        if (targetItem) break;

        pos += step;
      }
    }

    // Fallback: static selectors (if scrollHost wasn't found)
    if (!targetItem) {
      const itemSelectors = [
        "ng-select[bindlabel='ten_hoc_ky'] ng-dropdown-panel .ng-option",
        "ng-select ng-dropdown-panel .ng-option",
        "ng-dropdown-panel .ng-option",
      ];
      for (const sel of itemSelectors) {
        const found = document.querySelectorAll(sel);
        targetItem = Array.from(found).find(
          (item) => item.textContent?.trim() === semesterName,
        );
        if (targetItem) break;
      }
    }

    if (!targetItem) {
      clickTarget.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      await wait(CONFIG.timeouts.dropdownClose);
      console.warn(
        `Không tìm thấy học kỳ "${semesterName}" trong dropdown, dùng dữ liệu hiện tại.`,
      );
      return;
    }

    (targetItem as HTMLElement).scrollIntoView({ block: "nearest" });
    await wait(CONFIG.timeouts.scrollWait);
    (targetItem as HTMLElement).dispatchEvent(
      new MouseEvent("mousedown", { bubbles: true }),
    );
    (targetItem as HTMLElement).click();

    // Two-phase spinner poll: wait for overlay to APPEAR, then DISAPPEAR
    const spinnerSelector = "ngx-spinner .ngx-spinner-overlay";
    const pollMs = 100;
    const maxWait = CONFIG.timeouts.tableUpdateLong;

    const p1Start = Date.now();
    while (Date.now() - p1Start < maxWait) {
      if (document.querySelector(spinnerSelector)) break;
      await wait(pollMs);
    }

    const p2Start = Date.now();
    while (Date.now() - p2Start < maxWait) {
      if (!document.querySelector(spinnerSelector)) break;
      await wait(pollMs);
    }

    await wait(500);

    // Verify table has actual data rows
    const table = document.querySelector(CONFIG.selectors.table);
    if (table) {
      const verifyMax = 5000;
      const verifyStart = Date.now();
      while (Date.now() - verifyStart < verifyMax) {
        const rows = table.querySelectorAll("tbody tr");
        if (
          rows.length > 0 &&
          !rows[0]?.textContent?.includes("Không tìm thấy")
        )
          break;
        await wait(200);
      }
    }
  };

  const getWeekStartEnd = (dateStr: string): { start: Date; end: Date } => {
    const [day, month, year] = dateStr.split("/").map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

    const start = new Date(d.setDate(diff));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  };

  const formatWeekString = (start: Date, end: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const sStr = `${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()}`;
    const eStr = `${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`;
    return `Tuần (${sStr} - ${eStr})`;
  };

  const scrapeScheduleTable = (): WeekData[] => {
    const rows = document.querySelectorAll(CONFIG.selectors.tableRows);
    const allEntries: { date: string; entry: CalendarEntry }[] = [];

    // Filter to data rows: bg-white with enough tds, skip search row & no-data row
    const dataRows = Array.from(rows).filter(
      (row) =>
        row.classList.contains("bg-white") &&
        row.querySelectorAll("td").length >= 10,
    );

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const cells = row.querySelectorAll("td");

      // Exam DOM: Stt(0) | Mã MH(1) | Tên môn(2) | [Nhóm thi(3)?] | [Sĩ số(?)] | Ngày thi | Giờ | Phòng | Địa điểm | ... | Tiết(11)
      const code = cells[1]?.textContent?.trim() || "";
      const title = cells[2]?.textContent?.trim() || "";

      // Nhóm thi & Ngày thi — detect positions by content patterns
      let group = "";
      let date = "";
      let startTime = "";
      let roomStr = "";
      let locationText = "";
      let startPeriod = 1;

      for (let j = 3; j < cells.length; j++) {
        const text = cells[j]?.textContent?.trim() || "";
        if (!text) continue;
        // Date pattern: dd/mm/yyyy
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(text) && !date) {
          date = text;
        }
        // Time pattern: HH:MM
        else if (/^\d{2}:\d{2}$/.test(text) && !startTime) {
          startTime = text;
        }
        // Nhóm thi: after Tên môn, before Ngày, not a number-only string
        else if (!group && !/^\d+$/.test(text) && !date) {
          group = text;
        }
      }

      // Room & location: cells after startTime
      let foundTime = false;
      for (let j = 3; j < cells.length; j++) {
        const text = cells[j]?.textContent?.trim() || "";
        if (text === startTime) {
          foundTime = true;
          continue;
        }
        if (foundTime) {
          if (!roomStr) {
            roomStr = text;
          } else if (!locationText) {
            // Địa điểm thi: has HTML (br tags) or multi-line
            const inner = (cells[j] as HTMLElement)?.innerText?.trim() || text;
            locationText = inner.replace(/\n/g, " - ");
            break;
          }
        }
      }

      // Tiết bắt đầu: last numeric cell
      const lastCellText = cells[cells.length - 1]?.textContent?.trim() || "";
      startPeriod = Number.parseInt(lastCellText, 10) || 1;

      const room = roomStr
        ? `${roomStr}${locationText ? ` - ${locationText}` : ""}`
        : locationText;

      if (!(date && startTime)) {
        continue;
      }

      const [dayPart, monthPart, yearPart] = date.split("/");
      const dDate = new Date(
        Number(yearPart),
        Number(monthPart) - 1,
        Number(dayPart),
      );
      const dayOfWeek = dDate.getDay();
      const dayNames = ["CN", "2", "3", "4", "5", "6", "7"];
      const formattedDay = `Thứ ${dayNames[dayOfWeek]} (${dayPart.padStart(2, "0")}/${monthPart.padStart(2, "0")})`;

      const entry: CalendarEntry = {
        code,
        title,
        group,
        day: formattedDay,
        startPeriod,
        startTime,
        endTime: "", // Cannot compute without period map; left for UI to display startTime
        room,
        teacher: "",
        link: "",
        category: "EXAM" as const,
        eventType: "EXAM" as const,
      };

      allEntries.push({ date, entry });
    }

    const weekMap = new Map<string, CalendarEntry[]>();

    for (const { date, entry } of allEntries) {
      const { start, end } = getWeekStartEnd(date);
      const weekStr = formatWeekString(start, end);

      if (!weekMap.has(weekStr)) {
        weekMap.set(weekStr, []);
      }
      weekMap.get(weekStr)?.push(entry);
    }

    const sortedWeeks = Array.from(weekMap.entries())
      .map(([week, schedule]) => {
        const match = week.match(WEEK_MATCH_REGEX);
        const year = match ? Number.parseInt(match[1], 10) : 0;
        return { week, schedule };
      })
      .sort((a, b) => {
        const aMatch = a.week.match(WEEK_SORT_REGEX);
        const bMatch = b.week.match(WEEK_SORT_REGEX);
        if (aMatch && bMatch) {
          const dateA = new Date(
            Number.parseInt(aMatch[3], 10),
            Number.parseInt(aMatch[2], 10) - 1,
            Number.parseInt(aMatch[1], 10),
          ).getTime();
          const dateB = new Date(
            Number.parseInt(bMatch[3], 10),
            Number.parseInt(bMatch[2], 10) - 1,
            Number.parseInt(bMatch[1], 10),
          ).getTime();
          return dateA - dateB;
        }
        return 0;
      });

    return sortedWeeks;
  };

  // ==================== MAIN EXECUTION ====================
  try {
    (window as unknown as Record<string, unknown>)[_CANCEL_KEY] = false;

    if (!window.location.hash.includes("/lichthi")) {
      return { status: "error", data: null, message: "Vui lòng chuyển đến trang 'Xem lịch thi' để thực hiện thao tác này." };
    }

    showOverlay();
    onProgress?.(0, "Đang lấy danh sách học kỳ...");
    updateOverlay(0, "Đang lấy danh sách học kỳ...");

    const semesters = await getSemesters();
    if (semesters.length === 0) {
      return { status: "error", data: null, message: "Không tìm thấy học kỳ nào" };
    }

    const allData: SemesterData[] = [];
    const totalSemesters = semesters.length;

    for (
      let semesterIndex = 0;
      semesterIndex < semesters.length;
      semesterIndex++
    ) {
      if (isCancelled()) {
        hideOverlay();
        return { status: "error", data: null, message: _CANCELLED_MSG };
      }

      const semester = semesters[semesterIndex];
      const semesterProgress = (semesterIndex / totalSemesters) * 100;

      onProgress?.(semesterProgress, `Đang xử lý học kỳ: ${semester}`);
      updateOverlay(semesterProgress, `Đang xử lý học kỳ: ${semester}`);
      updateSemesterInfo(`${semesterIndex + 1}/${totalSemesters}`);

      await selectSemester(semester, semesterIndex);

      if (isCancelled()) {
        hideOverlay();
        return { status: "error", data: null, message: _CANCELLED_MSG };
      }

      const weeks = scrapeScheduleTable();
      allData.push({ semester, weeks });
    }

    onProgress?.(100, "Hoàn thành!");
    updateOverlay(100, "Hoàn thành! Đang lưu dữ liệu...");

    await wait(CONFIG.timeouts.completionDelay);
    hideOverlay();

    return { status: "success", data: allData, message: "" };
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu lịch thi:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);

    onProgress?.(-1, errorMsg);
    updateOverlay(0, `Lỗi: ${errorMsg}`);

    await wait(CONFIG.timeouts.errorDisplay);
    hideOverlay();

    return { status: "error", data: null, message: `Lỗi: ${errorMsg}` };
  } finally {
    (window as unknown as Record<string, unknown>)[_CANCEL_KEY] = false;
  }
};
