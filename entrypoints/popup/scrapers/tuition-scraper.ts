// Only type imports are safe for functions injected via executeScript
import type { SemesterTuitionDetail, TuitionReceiptGroup, TuitionReceiptItem, TuitionSummaryEntry } from "@/types";

type ScrapeResult<T> = { status: "success"; data: T; message: string } | { status: "error"; data: null; message: string };

async function getTuitionData(): Promise<ScrapeResult<{
  summary: TuitionSummaryEntry[];
  details: Record<string, SemesterTuitionDetail>;
}>> {
  const AWAIT_ENABLE = false;

  const parseAmount = (raw: string): number => {
    return Number.parseInt(raw.replace(/[,.\s]/g, ""), 10) || 0;
  };

  const parseSummaryRow = (cols: NodeListOf<Element>): TuitionSummaryEntry | null => {
    const name = (cols[1] as HTMLElement)?.innerText?.trim();
    if (!name?.includes("Học kỳ")) {
      return null;
    }
    return {
      semesterName: name,
      grossAmount: parseAmount((cols[2] as HTMLElement)?.innerText || ""),
      discount: parseAmount((cols[3] as HTMLElement)?.innerText || ""),
      receivable: parseAmount((cols[4] as HTMLElement)?.innerText || ""),
      collected: parseAmount((cols[5] as HTMLElement)?.innerText || ""),
      debt: parseAmount((cols[6] as HTMLElement)?.innerText || "")
    };
  };

  const parseDetailRow = (cols: NodeListOf<Element>): TuitionReceiptItem => ({
    courseCode: (cols[1] as HTMLElement)?.innerText?.trim() || "",
    courseName: (cols[2] as HTMLElement)?.innerText?.trim() || "",
    group: (cols[3] as HTMLElement)?.innerText?.trim() || "",
    credits: Number.parseInt((cols[4] as HTMLElement)?.innerText?.trim() || "0", 10) || 0,
    amount: parseAmount((cols[5] as HTMLElement)?.innerText || "")
  });

  // biome-ignore lint/performance/useTopLevelRegex: must be scoped for executeScript
  const RECEIPT_HEADER_REGEX = /^([AB]\d+)\.\s*(.+)/;
  // biome-ignore lint/performance/useTopLevelRegex: must be scoped for executeScript
  const RECEIPT_NUM_REGEX = /:\s*(\S+)/;
  const RECEIPT_DATE_REGEX = /(\d{2}\/\d{2}\/\d{2,4})/g;

  const parseReceiptHeader = (text: string) => {
    const mh = text.match(RECEIPT_HEADER_REGEX);
    if (!mh) {
      return null;
    }
    const receiptType = mh[1].startsWith("A") ? ("A" as const) : ("B" as const);
    const numMatch = text.match(RECEIPT_NUM_REGEX);
    const dates = text.match(RECEIPT_DATE_REGEX);
    // For B receipts, extract the linked A receipt number (last number in text)
    const allNums = text.match(/(\d{6,})/g);
    const linkedPaymentNumber = receiptType === "B" && allNums && allNums.length >= 2 ? allNums.at(-1) : undefined;
    return {
      receiptLabel: text,
      receiptNumber: numMatch?.[1] || "",
      receiptType,
      createdAt: dates?.[0] || "",
      contractDate: dates?.[1],
      linkedPaymentNumber
    };
  };

  // ── Scrape summary table (Tổng hợp view) ──
  const scrapeSummary = (): TuitionSummaryEntry[] => {
    const entries: TuitionSummaryEntry[] = [];
    const tables = document.querySelectorAll("app-hocphi table");
    for (const table of tables) {
      for (const row of table.querySelectorAll("tbody > tr")) {
        const cols = row.querySelectorAll("td");
        if (cols.length < 7) {
          continue;
        }
        const entry = parseSummaryRow(cols);
        if (entry) {
          entries.push(entry);
        }
      }
    }
    return entries;
  };

  // ── Scrape per-semester detail table ──
  const scrapeDetail = (): SemesterTuitionDetail | null => {
    const container = document.querySelector("app-hocphi");
    if (!container) {
      return null;
    }
    const semesterName = (container.querySelector(".ng-value-label") as HTMLElement)?.innerText?.trim() || "";
    if (
      !semesterName ||
      semesterName.toLowerCase().includes("tổng hợp") ||
      semesterName.toLowerCase().includes("tất cả")
    ) {
      return null;
    }

    const tables = container.querySelectorAll("table");
    const groups: TuitionReceiptGroup[] = [];

    for (const table of tables) {
      const rows = table.querySelectorAll("tbody > tr");
      let cur: TuitionReceiptGroup | null = null;

      for (const row of rows) {
        const cols = row.querySelectorAll("td");
        const rowText = (row as HTMLElement).innerText?.trim() || "";

        if (cols.length === 1 && cols[0].getAttribute("colspan")) {
          const h = parseReceiptHeader(rowText);
          if (h) {
            if (cur) {
              groups.push(cur);
            }
            cur = {
              receiptLabel: h.receiptLabel,
              receiptNumber: h.receiptNumber,
              receiptType: h.receiptType,
              createdAt: h.createdAt,
              contractDate: h.contractDate,
              linkedPaymentNumber: h.linkedPaymentNumber,
              items: [],
              subtotal: 0
            };
          }
          continue;
        }

        // Subtotal (antiquewhite bg): first td has colspan, text "TỔNG"; amount in last td
        if (rowText.startsWith("TỔNG") && cur) {
          const allCols = [...cols] as HTMLElement[];
          cur.subtotal = parseAmount(allCols.at(-1)?.innerText || "");
          groups.push(cur);
          cur = null;
          continue;
        }

        // Data row: 6 tds (Stt, Mã MH, Tên môn học, Nhóm, Số tín chỉ, Số tiền)
        if (cols.length >= 6 && cur) {
          cur.items.push(parseDetailRow(cols));
        }
      }
      if (cur) {
        groups.push(cur);
      }
    }

    const bankEl = container.querySelector("h6");
    return {
      semesterName,
      receiptGroups: groups,
      bankAccount: (bankEl as HTMLElement)?.innerText?.trim() || undefined
    };
  };

  const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

  const getOptions = async (): Promise<string[]> => {
    const container = document.querySelector("app-hocphi");
    if (!container) {
      return [];
    }
    const sel = container.querySelector(".ng-select-container") as HTMLElement;
    if (!sel) {
      return [];
    }

    sel.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    if (AWAIT_ENABLE) {
      await wait(300);
    }

    const opts: string[] = [];
    for (const o of document.querySelectorAll("ng-dropdown-panel .ng-option")) {
      const t = (o as HTMLElement).innerText?.trim();
      if (t) {
        opts.push(t);
      }
    }

    sel.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    if (AWAIT_ENABLE) {
      await wait(200);
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await wait(100);
    }
    return opts;
  };

  const selectOption = async (text: string): Promise<boolean> => {
    const container = document.querySelector("app-hocphi");
    if (!container) {
      return false;
    }

    const currentLabel = (container.querySelector(".ng-value-label") as HTMLElement)?.innerText?.trim();
    if (currentLabel === text) {
      return true;
    }

    const sel = container.querySelector(".ng-select-container") as HTMLElement;
    if (!sel) {
      return false;
    }

    sel.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    if (AWAIT_ENABLE) {
      await wait(300);
    }

    let found = false;
    for (const o of document.querySelectorAll("ng-dropdown-panel .ng-option")) {
      if ((o as HTMLElement).innerText?.trim() === text) {
        (o as HTMLElement).click();
        found = true;
        break;
      }
    }

    if (!found && AWAIT_ENABLE) {
      sel.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      await wait(200);
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    }
    return found;
  };

  /** Two-phase wait: old table disappears → new table appears → settle. */
  const waitTable = (timeoutMs = 15_000): Promise<void> =>
    new Promise((resolve) => {
      const container = document.querySelector("app-hocphi");
      if (!container) {
        resolve();
        return;
      }

      const pollInterval = 100;
      const start = Date.now();

      const isTableGone = () => {
        const t = container.querySelector("table");
        return !t || (t as HTMLElement).offsetParent === null;
      };

      const hasTable = () => {
        const t = container.querySelector("table");
        if (!t) return false;
        // Verify it has actual rows (not just header or empty)
        const rows = t.querySelectorAll("tbody tr");
        return rows.length > 0;
      };

      // Phase 1: Wait for old table to be gone (Angular clearing DOM)
      const waitForGone = () => {
        if (isTableGone()) {
          // Phase 2: Wait for new table to appear
          waitForAppear();
          return;
        }
        if (Date.now() - start > timeoutMs) {
          resolve();
          return;
        }
        setTimeout(waitForGone, pollInterval);
      };

      // Phase 2: Wait for new table to appear
      const waitForAppear = () => {
        if (hasTable()) {
          // Settle: give Angular a moment to finish rendering
          setTimeout(resolve, 500);
          return;
        }
        if (Date.now() - start > timeoutMs) {
          resolve();
          return;
        }
        setTimeout(waitForAppear, pollInterval);
      };

      waitForGone();
    });

  // ── Overlay (progress UI) ──
  const OVERLAY_ID = "mpc-tuition-overlay";
  const PROGRESS_BAR_ID = "mpc-tuition-progress-bar";
  const PROGRESS_TEXT_ID = "mpc-tuition-progress-text";
  const MESSAGE_ID = "mpc-tuition-message";
  const SEMESTER_ID = "mpc-tuition-semester-info";
  const CANCEL_BTN_ID = "mpc-tuition-cancel-btn";

  const _CANCEL_KEY = "__MPC_CANCEL__";
  const _CANCELLED_MSG = "Người dùng đã dừng nhập dữ liệu";
  const isCancelled = (): boolean => !!(window as unknown as Record<string, unknown>)[_CANCEL_KEY];

  const createOverlay = (): HTMLDivElement => {
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif";

    const card = document.createElement("div");
    card.style.cssText =
      "background:#fff;border-radius:8px;padding:24px;width:90%;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.15)";

    const title = document.createElement("h3");
    title.textContent = "Đang đọc học phí";
    title.style.cssText = "margin:0 0 4px 0;font-size:16px;font-weight:600;color:#0f172a";

    const message = document.createElement("p");
    message.id = MESSAGE_ID;
    message.textContent = "Đang lấy danh sách học kỳ...";
    message.style.cssText = "margin:0 0 16px 0;font-size:14px;color:#64748b";

    const progressBg = document.createElement("div");
    progressBg.style.cssText = "background:#f1f5f9;border-radius:4px;height:8px;overflow:hidden;margin-bottom:8px";

    const progressBar = document.createElement("div");
    progressBar.id = PROGRESS_BAR_ID;
    progressBar.style.cssText = "height:100%;background:#0f172a;width:0%;transition:width 0.3s ease";
    progressBg.appendChild(progressBar);

    const info = document.createElement("div");
    info.style.cssText = "display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:16px";

    const progressText = document.createElement("span");
    progressText.id = PROGRESS_TEXT_ID;
    progressText.textContent = "0%";

    const semesterInfo = document.createElement("span");
    semesterInfo.id = SEMESTER_ID;

    info.appendChild(progressText);
    info.appendChild(semesterInfo);

    const cancelBtn = document.createElement("button");
    cancelBtn.id = CANCEL_BTN_ID;
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
      "<strong>⚠️ Lưu ý:</strong> Không tắt hay thu nhỏ cửa sổ, tắt popup hay chuyển trang. Quá trình có thể mất vài phút tùy vào số lượng dữ liệu.";

    card.append(title, message, progressBg, info, cancelBtn, warning);
    overlay.appendChild(card);
    return overlay;
  };

  const showOverlay = (): void => {
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) {
      existing.remove();
    }
    document.body.appendChild(createOverlay());
    document.body.style.overflow = "hidden";
  };

  const updateOverlay = (progress: number, message: string): void => {
    const bar = document.getElementById(PROGRESS_BAR_ID);
    const text = document.getElementById(PROGRESS_TEXT_ID);
    const msg = document.getElementById(MESSAGE_ID);
    if (bar) {
      bar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
    }
    if (text) {
      text.textContent = `${Math.round(progress)}%`;
    }
    if (msg) {
      msg.textContent = message;
    }
  };

  const updateSemesterInfo = (info: string): void => {
    const el = document.getElementById(SEMESTER_ID);
    if (el) {
      el.textContent = info;
    }
  };

  const hideOverlay = (): void => {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = "";
      }, 300);
    }
  };

  // ── Execute ──
  (window as unknown as Record<string, unknown>)[_CANCEL_KEY] = false;
  showOverlay();

  try {
    updateOverlay(0, "Đang đọc bảng tổng hợp...");
    const summary = scrapeSummary();
    if (summary.length === 0) {
      return { status: "error", data: null, message: "Không tìm thấy dữ liệu học phí. Hãy đảm bảo bạn đang ở trang học phí." };
    }

    updateOverlay(5, "Đang lấy danh sách học kỳ...");
    const allOptions = await getOptions();
    const semesterOptions = allOptions.filter(
      (o) => !(o.toLowerCase().includes("tổng hợp") || o.toLowerCase().includes("tất cả"))
    );
    const total = semesterOptions.length;
    const details: Record<string, SemesterTuitionDetail> = {};

    for (let i = 0; i < total; i++) {
      if (isCancelled()) {
        return { status: "error", data: null, message: _CANCELLED_MSG };
      }

      const name = semesterOptions[i];
      const progress = 5 + Math.round(((i + 1) / total) * 90);

      updateOverlay(progress, `Đang đọc học kỳ ${i + 1}/${total}`);
      updateSemesterInfo(name);

      if (!(await selectOption(name))) {
        continue;
      }
      await waitTable();

      if (isCancelled()) {
        return { status: "error", data: null, message: _CANCELLED_MSG };
      }

      const d = scrapeDetail();
      if (d) {
        details[name] = d;
      }
    }

    if (isCancelled()) {
      return { status: "error", data: null, message: _CANCELLED_MSG };
    }

    updateOverlay(97, "Đang quay lại tổng hợp...");
    const back = allOptions.find((o) => o.toLowerCase().includes("tổng hợp") || o.toLowerCase().includes("tất cả"));
    if (back) {
      await selectOption(back);
    }

    updateOverlay(100, "Hoàn tất!");
    await new Promise((r) => setTimeout(r, 500));
    return { status: "success", data: { summary, details }, message: "" };
  } catch (err) {
    return { status: "error", data: null, message: err instanceof Error ? err.message : "Lỗi khi đọc học phí" };
  } finally {
    (window as unknown as Record<string, unknown>)[_CANCEL_KEY] = false;
    hideOverlay();
  }
}

export { getTuitionData };
