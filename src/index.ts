/**
 * InjectAI Plugin — descriptor factory.
 * Runs at build time in Vite. Imported in astro.config.mjs.
 * Must be side-effect-free. No runtime imports.
 */
import type { PluginDescriptor } from "emdash";

export interface InjectAIOptions extends Record<string, unknown> {
  id?: string;
}

export function injectAI(options: InjectAIOptions = {}): PluginDescriptor<InjectAIOptions> {
  return {
    id: options.id ?? "injectai",
    version: "1.0.0",
    format: "native",
    entrypoint: "@emdash/injectai/sandbox",
    options,
    componentsEntry: "@emdash/injectai/astro",
    adminEntry: "@emdash/injectai/admin",
    adminPages: [
      { path: "/", label: "InjectAI", icon: "puzzle-piece" },
    ],
    adminWidgets: [
      { id: "injectai-status", title: "InjectAI", size: "half" },
    ],
    capabilities: ["network:fetch"],
    allowedHosts: ["*", "*.modal.run", "*.injectailabs.space", "localhost"],
  };
}
