import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  webExt: {},
  modules: [],
  vite: () => ({
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
            return;
          }
          warn(warning);
        }
      }
    }
  }),
  manifest: {
    name: "MPC Extension",
    version: "1.1.0",
    description: "Extension hỗ trợ sinh viên trường Đại học Mở TP. HCM trong việc lên kế hoạch học tập.",
    permissions: ["scripting", "activeTab", "storage"]
  },
  manifestVersion: 3
});
