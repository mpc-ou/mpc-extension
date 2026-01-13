# MPC EXTENSION

[![🛡️ GPLv3 License](https://img.shields.io/badge/License-GPLv3-red?style=for-the-badge&logo=gnu)](/LICENSE)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

Ngôn ngữ:
- [Tiếng Anh](README.md)
- [Tiếng Việt](README.vi.md)

Extension hỗ trợ sinh viên trường Đại học Mở TP. HCM trong việc lên kế hoạch học tập. Công cụ này giúp tối ưu hóa quá trình học tập và lập kế hoạch học tập cá nhân, giúp sinh viên theo dõi kết quả học tập, tính toán điểm trung bình và lên lộ trình học hiệu quả hơn.

## Tải và sử dụng

### Chrome Web Store (khuyến nghị)

Truy cập [MPC Extension trên Chrome Web Store](https://chromewebstore.google.com/detail/mpc-extension/lidfnknnjlblinmhnbbkbodjkjoheanj) và nhấn "Thêm vào Chrome".

### Release trên GitHub

Truy cập [MPC Extension Releases](https://github.com/mpc-ou/mpc-extension/releases) và tải về phiên bản mới nhất, bao gồm:

- Chrome Web Store (dành cho các trình duyệt nhân Chromium như Chrome, Edge, Brave,...)
- Mozilla Add-ons (dành cho trình duyệt Firefox)

Sau khi tải về, làm theo hướng dẫn sau để cài đặt thủ công:

1. Giải nén file đã tải về.
2. Vào trình duyệt lõi Chromium (Chrome, Edge, Brave,...) -> Setting -> Extensions -> Manage Extension.
3. Bật Developer Mode -> Chọn Load unpacked -> Chọn folder vừa giải nén.
4. Mở extension và tận hưởng các tính năng.

### Build từ mã nguồn (pnpm)

```bash
git clone https://github.com/mpc-ou/mpc-extension.git
cd mpc-extension

pnpm install

pnpm build
pnpm build:firefox # Dành cho Firefox
```

Sau khi build, folder **.output** sẽ được tạo ra. Bên trong có các folder tương ứng cho từng trình duyệt. Sử dụng folder này để cài đặt thủ công như hướng dẫn ở trên.

## Công nghệ chính của mã nguồn

- [WXT (React + TypeScript)](https://wxt.dev/)
- [Shadcn UI](https://ui.shadcn.com/)

## Cách đóng góp mã nguồn

Xem tại [CONTRIBUTING.md](https://github.com/mpc-ou/mpc-extension/blob/dev/CONTRIBUTING.md)

## Giấy phép

[GNU GPLv3](/LICENSE)

## Tác giả

[@mpc](https://www.facebook.com/CLBLapTrinhTrenThietBiDiDong)
