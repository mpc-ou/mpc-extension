type ScrapeResult<T> = { status: "success"; data: T; message: string } | { status: "error"; data: null; message: string };

export function getBasicInfo(): ScrapeResult<{ displayName: string; studentId: string; avatar: string }> {
  const _CANCEL_KEY = "__MPC_CANCEL__";
  const _CANCELLED_MSG = "Người dùng đã dừng nhập dữ liệu";

  if ((window as unknown as Record<string, unknown>)[_CANCEL_KEY]) {
    return { status: "error", data: null, message: _CANCELLED_MSG };
  }

  try {
    const userText = document.querySelector<HTMLDivElement>(".user-text");
    if (!userText) {
      return { status: "error", data: null, message: "Không tìm thấy thông tin người dùng. Hãy đảm bảo bạn đang ở trang chủ." };
    }

    const span = userText.querySelector("span");
    const displayName = span?.textContent?.trim();
    if (!displayName) {
      return { status: "error", data: null, message: "Không thể đọc tên người dùng" };
    }

    const fullText = userText.textContent || "";
    const afterName = fullText.replace(span?.textContent || "", "").trim();
    const studentId = afterName.split(/\s+/).pop() || "";
    if (!(studentId && /^\d+$/.test(studentId))) {
      return { status: "error", data: null, message: "Không tìm thấy MSSV hợp lệ" };
    }

    const avatarImg = document.querySelector<HTMLImageElement>("img.avatar");
    const avatar = avatarImg?.src || "";

    return { status: "success", data: { displayName, studentId, avatar }, message: "" };
  } catch (err) {
    return { status: "error", data: null, message: err instanceof Error ? err.message : "Lỗi khi đọc thông tin cơ bản" };
  }
}
