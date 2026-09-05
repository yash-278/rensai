import { defineConfig } from "vitepress";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Rensai",
  description: "A free, open-source manga reader for your desktop collection",
  cleanUrls: true,
  appearance: true,
  sitemap: { hostname: "https://rensai.yashkadam.com" },
  head: [
    ["link", { rel: "icon", href: "/logo.svg" }],
    ["meta", { property: "og:site_name", content: "Rensai" }],
    ["meta", { property: "og:type", content: "website" }],
    [
      "meta",
      {
        property: "og:image",
        content: "https://rensai.yashkadam.com/rensai-hero.webp",
      },
    ],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
  ],
  transformHead({ pageData }) {
    const path = pageData.relativePath
      .replace(/index\.md$/, "")
      .replace(/\.md$/, "");
    const url = `https://rensai.yashkadam.com/${path}`;
    return [
      ["link", { rel: "canonical", href: url }],
      ["meta", { property: "og:url", content: url }],
      [
        "meta",
        {
          property: "og:title",
          content: `${pageData.title || "Your manga. Kept in sequence."} | Rensai`,
        },
      ],
      [
        "meta",
        {
          property: "og:description",
          content:
            pageData.description ||
            "A free, open-source manga reader for your desktop collection.",
        },
      ],
    ];
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Download", link: "/download" },
      { text: "Guides", link: "/guides/getting-started" },
      { text: "About", link: "/about" },
    ],

    logo: "/logo.svg",

    sidebar: [
      {
        text: "Download",
        link: "/download",
      },
      {
        text: "Repository",
        link: "https://github.com/yash-278/rensai",
      },
      {
        text: "Guides",
        items: [
          { text: "Getting started", link: "/guides/getting-started" },
          {
            text: "Adding content",
            collapsed: false,
            items: [
              {
                text: "Local files and archives",
                link: "/guides/adding-content/filesystem",
              },
              {
                text: "Website sources",
                link: "/guides/adding-content/websites",
              },
            ],
          },
          { text: "Customize", link: "/guides/customize" },
          { text: "Offline downloads", link: "/guides/offline-download" },
          { text: "Trackers", link: "/guides/trackers" },
        ],
      },
    ],

    footer: {
      message:
        'Free and open source. <a href="/about">About Rensai and its license</a>.',
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/yash-278/rensai" },
    ],

    search: {
      provider: "local",
    },
  },
  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin);
    },
  },
});
