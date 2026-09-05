import { h } from "vue";
import { useData, type Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { enhanceAppWithTabs } from "vitepress-plugin-tabs/client";
import RensaiHome from "./components/RensaiHome.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout: {
    setup() {
      const { frontmatter } = useData();
      return () =>
        h(
          frontmatter.value.layout === "home"
            ? RensaiHome
            : DefaultTheme.Layout,
        );
    },
  },
  enhanceApp({ app }) {
    enhanceAppWithTabs(app);
  },
} satisfies Theme;
