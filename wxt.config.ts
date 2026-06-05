import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  webExt: {},
  modules: [],
  vite: () => ({
    plugins: [tailwindcss()],
    define: {
      __MPC_KEY__: JSON.stringify(process.env.MPC_KEY || "MPC")
    },
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
    version: "1.6.0",
    description: "Extension hỗ trợ sinh viên trường Đại học Mở TP. HCM trong việc lên kế hoạch học tập.",
    permissions: ["scripting", "activeTab", "storage", "sidePanel", "alarms", "notifications"],
    host_permissions: ["https://tienichsv.ou.edu.vn/*", "https://tienichkcq.oude.edu.vn/*"],
    action: {
      default_title: "MPC Extension"
    },
    page_action: {
      default_title: "MPC Extension"
    }
  },
  manifestVersion: 3
});
