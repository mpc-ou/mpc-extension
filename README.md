# MPC EXTENSION

[![🛡️ GPLv3 License](https://img.shields.io/badge/License-GPLv3-red?style=for-the-badge&logo=gnu)](/LICENSE)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

Language:
- [English](README.md)
- [Vietnamese](README.vi.md)

An extension designed to assist Ho Chi Minh City Open University students with study planning. This tool optimizes the learning process and personal study scheduling, enabling students to track academic performance, calculate GPAs, and create more effective study roadmaps.

## Download and Usage

### Chrome Web Store (Recommended)

Visit [MPC Extension on Chrome Web Store](https://chromewebstore.google.com/detail/mpc-extension/lidfnknnjlblinmhnbbkbodjkjoheanj) and click "Add to Chrome".

### Release on GitHub

Visit [MPC Extension Releases](https://github.com/mpc-ou/mpc-extension/releases) and download the latest version, which includes:

- Chrome Web Store (for Chromium-based browsers like Chrome, Edge, Brave, etc.)
- Mozilla Add-ons (for Firefox)

After downloading, follow these instructions to install manually:

1. Extract the downloaded file.
2. In your Chromium-based browser (Chrome, Edge, Brave, etc.), go to Settings -> Extensions -> Manage Extensions.
3. Enable Developer Mode -> Click Load unpacked -> Select the extracted folder.
4. Open the extension and enjoy the features.

### Build from source (pnpm)
```bash
git clone https://github.com/mpc-ou/mpc-extension.git
cd mpc-extension

pnpm install

pnpm build
pnpm build:firefox # For Firefox
```

After building, the **.output** folder will be created. Inside, there are folders corresponding to each browser. Use these folders to install manually as described above.

## Core Technologies

- [WXT (React + TypeScript)](https://wxt.dev/)
- [Shadcn UI](https://ui.shadcn.com/)

## Contributing to the source code

See [CONTRIBUTING.md](https://github.com/mpc-ou/mpc-extension/blob/dev/CONTRIBUTING.md)

## License

[GNU GPLv3](/LICENSE)

## Author

[@mpc](https://www.facebook.com/CLBLapTrinhTrenThietBiDiDong)
