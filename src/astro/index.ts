// Block components for site-side rendering of injectai-chat PT blocks.
// Auto-wired into <PortableText> via componentsEntry — site authors don't need to import anything.
// Reuses the same self-contained component as the manual import path.

// @ts-ignore — .astro files are resolved by Astro's Vite plugin, not tsc
import InjectAIChatBlock from "../components/InjectAIChat.astro";

// Required export name — automatically merged into every <PortableText> on the site
export const blockComponents = {
  "injectai-chat": InjectAIChatBlock,
};
