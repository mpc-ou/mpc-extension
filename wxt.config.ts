import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  webExt: {},
  modules: ["@wxt-dev/webextension-polyfill"],
  vite: () => ({
    plugins: [tailwindcss()]
  }),
  manifest: {
    name: "MPC Extension",
    version: "0.3.6", // TODO: Update version before build
    description: "Extension hỗ trợ sinh viên trường Đại học Mở TP. HCM trong việc lên kế hoạch học tập.",
    permissions: ["scripting", "activeTab", "storage"]
  },
  manifestVersion: 3
});
