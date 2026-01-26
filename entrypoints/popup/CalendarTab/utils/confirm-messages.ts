export function getConfirmMessage(type: "import" | "delete" | null, hasData: boolean): string {
  if (type === "import") {
    return hasData
      ? "Bạn đang có dữ liệu TKB. Nhập dữ liệu mới sẽ ghi đè lên dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục?"
      : "Bạn có chắc chắn muốn nhập dữ liệu TKB? Quá trình này có thể mất vài phút.";
  }
  return "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu TKB? Hành động này không thể hoàn tác.";
}
