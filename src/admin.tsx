import { InjectAIPage } from "./components/InjectAIPage.js";
import { StatusWidget }  from "./components/StatusWidget.js";
import type { PluginAdminExports } from "emdash";

export { InjectAIPage, StatusWidget };

export const pages: PluginAdminExports["pages"] = {
  "/":         InjectAIPage,
  "/settings": InjectAIPage,
};

export const widgets: PluginAdminExports["widgets"] = {
  "injectai-status": StatusWidget,
};
