<script setup lang="ts">
import { useData } from "vitepress";
import { computed, onMounted, ref } from "vue";
const { isDark } = useData();
const mainContent = ref<HTMLElement>();
// Match the server render before reading the browser color preference.
const mounted = ref(false);
const displayedDark = computed(() => mounted.value && isDark.value);
onMounted(() => {
  mounted.value = true;
});
</script>

<template>
  <div class="site site-sequence" id="top">
    <a class="skip-link" href="#main-content" @click="mainContent?.focus()"
      >Skip to content</a
    >
    <header class="site-header">
      <a class="brand-link" href="/">
        <span class="wordmark" aria-label="Rensai home">
          <span class="wordmark-frames" aria-hidden="true"
            ><i></i><i></i><i></i
          ></span>
          <b>Rensai</b>
        </span></a
      >
      <nav aria-label="Primary navigation">
        <a href="/download">Download</a><a href="#reading">Reading</a
        ><a href="#library">Library</a><a href="#docs">Guides</a>
      </nav>
      <div class="header-actions">
        <button
          class="theme-toggle"
          type="button"
          :aria-label="`Switch to ${displayedDark ? 'light' : 'dark'} theme`"
          @click="isDark = !isDark"
        >
          {{ displayedDark ? "Light" : "Dark" }}
        </button>
        <a
          class="source-link"
          href="https://github.com/yash-278/rensai"
          target="_blank"
          rel="noreferrer"
          >Source <span class="arrow" aria-hidden="true">↗</span></a
        >
      </div>
    </header>
    <main id="main-content" ref="mainContent" tabindex="-1">
      <section class="hero hero-sequence">
        <div class="hero-copy">
          <p class="hero-context">
            A desktop manga reader for your own collection.
          </p>
          <h1>Your manga.<span>Kept in sequence.</span></h1>
          <p class="hero-summary">
            Build your shelf, choose how pages flow, and return without hunting
            for your place.
          </p>
          <div class="hero-actions">
            <a class="button primary" href="/download"
              >Get Rensai <span class="arrow" aria-hidden="true">↗</span></a
            ><a class="button quiet" href="/guides/getting-started"
              >Read the guides</a
            >
          </div>
        </div>

        <figure class="campaign-image hero-media">
          <img
            fetchpriority="high"
            src="/rensai-hero.webp"
            alt="Black laptop displaying abstract sequential ink artwork beside storyboard sheets"
            width="1536"
            height="1024"
          />
        </figure>
      </section>
      <section class="reading" id="reading">
        <div class="reading-lead">
          <p class="plain-label">The reader</p>
          <h2>Choose how the pages move.</h2>
          <p>
            Read right-to-left or left-to-right. Fit artwork to the screen, hide
            the chrome, and keep the controls close when you need them.
          </p>
        </div>

        <div class="mode-list" aria-label="Reading styles">
          <article>
            <span>Single page</span
            ><strong>Give every page the whole screen.</strong>
            <p>Move at your own pace with clean, focused page turns.</p>
          </article>
          <article>
            <span>Facing pages</span
            ><strong>Read spreads as they were composed.</strong>
            <p>Pair portrait pages and keep wide artwork intact.</p>
          </article>
          <article>
            <span>Vertical flow</span
            ><strong>Let long chapters keep moving.</strong>
            <p>
              Scroll through continuous artwork without breaking its rhythm.
            </p>
          </article>
        </div>
      </section>
      <section class="product product-sequence" id="library">
        <div class="product-copy">
          <p class="plain-label">Your library</p>
          <h2>Find a series. Keep going.</h2>
          <p>
            Bring the chapters already on your computer into one shelf, see what
            is unfinished, and move back into the story.
          </p>
          <div class="capability-list" aria-label="Library features">
            <article>
              <strong>Bring your files</strong>
              <p>
                Add ZIP, RAR, CBZ, and CBR chapters already stored on your
                computer.
              </p>
            </article>
            <article>
              <strong>See what is unread</strong>
              <p>
                Filter the shelf and spot unfinished series without keeping a
                separate list.
              </p>
            </article>
            <article>
              <strong>Keep moving</strong>
              <p>
                Finished chapters stay marked and keyboard controls take you
                straight into the next one.
              </p>
            </article>
          </div>
        </div>

        <figure class="app-proof double-bezel">
          <div>
            <img
              class="library-dark"
              src="/rensai-library-dark.webp"
              alt="Rensai library in dark mode with sample series, reading progress, and filters"
              width="1440"
              height="900"
              loading="lazy"
            /><img
              class="library-light"
              src="/rensai-library-light.webp"
              alt="Rensai library in light mode with sample series, reading progress, and filters"
              width="1440"
              height="900"
              loading="lazy"
            />
          </div>
          <figcaption>
            The current Rensai library, shown with fictional sample titles.
          </figcaption>
        </figure>
      </section>

      <section class="docs" id="docs">
        <div class="docs-lead">
          <p class="plain-label">Reader guides</p>
          <h2>Everything you need to start reading.</h2>
          <p>
            Learn how to bring in a collection, tune the page view, use the
            keyboard, and settle into a chapter.
          </p>
          <a class="text-link" href="/guides/getting-started"
            >Browse the guides
            <span class="arrow" aria-hidden="true">↗</span></a
          >
        </div>
        <div class="guide-index" id="guide">
          <a href="/guides/getting-started"
            ><span>Start here</span><strong>Open your first chapter</strong
            ><small>From shelf to page</small></a
          >
          <a href="/guides/adding-content/filesystem"
            ><span>Your collection</span><strong>Build the library</strong
            ><small>Archives, covers, and unread chapters</small></a
          >
          <a href="/guides/customize"
            ><span>Make it yours</span><strong>Choose a page style</strong
            ><small>Single, double, or vertical</small></a
          >
          <a href="/guides/customize#keybinds"
            ><span>Stay in the story</span
            ><strong>Keyboard and navigation</strong
            ><small>Page turns, chapters, and fullscreen</small></a
          >
        </div>
      </section>
      <section class="connected" aria-labelledby="connected-title">
        <div class="connected-lead">
          <p class="plain-label">Beyond your files</p>
          <h2 id="connected-title">Keep the next chapter close.</h2>
          <p>
            Add series from supported websites, save chapters for offline
            reading, and sync your progress with a tracking account.
          </p>
        </div>
        <div class="capability-list">
          <article>
            <strong
              ><a href="/guides/adding-content/websites"
                >Website sources</a
              ></strong
            >
            <p>
              Find series through Rensai Sources and bring them into your
              library.
            </p>
          </article>
          <article>
            <strong><a href="/guides/offline-download">Read offline</a></strong>
            <p>
              Queue chapters ahead of time and manage downloads in one place.
            </p>
          </article>
          <article>
            <strong><a href="/guides/trackers">Sync your progress</a></strong>
            <p>Link series to AniList, MyAnimeList, or MangaUpdates.</p>
          </article>
        </div>
      </section>
      <section class="lineage" id="lineage">
        <div>
          <p class="plain-label">About Rensai</p>
          <h2>A new chapter for an open-source reader.</h2>
        </div>
        <div class="lineage-copy">
          <p>
            <strong
              >Rensai continues the open-source work that began with
              Houdoku.</strong
            >
            The project keeps that history and credit visible while giving the
            reader its own name, experience, and future.
          </p>
          <a class="text-link" href="/about"
            >Read the project history
            <span class="arrow" aria-hidden="true">↗</span></a
          >
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <span class="wordmark" aria-label="Rensai">
        <span class="wordmark-frames" aria-hidden="true"
          ><i></i><i></i><i></i
        ></span>
        <b>Rensai</b>
      </span>
      <p>Free and open source. Made for the desktop.</p>
      <nav>
        <a href="/guides/getting-started">Guides</a
        ><a href="/about">About &amp; license</a
        ><a
          href="https://github.com/yash-278/rensai"
          target="_blank"
          rel="noreferrer"
          >GitHub</a
        >
      </nav>
    </footer>
  </div>
</template>

<style scoped>
.app-proof .library-dark {
  display: none;
}
:global(.dark .app-proof .library-dark) {
  display: block;
}
:global(.dark .app-proof .library-light) {
  display: none;
}
.site {
  line-height: normal;
}
img {
  display: block;
  width: 100%;
  height: auto;
}
figure {
  margin: 0;
}
p {
  text-wrap: pretty;
}
h1,
h2 {
  text-wrap: balance;
}
section {
  scroll-margin-top: 90px;
}
.connected {
  display: grid;
  grid-template-columns: 0.82fr 1.18fr;
  gap: clamp(70px, 11vw, 180px);
  max-width: var(--max);
  margin: 0 auto;
  padding: 130px clamp(24px, 6vw, 96px);
  border-bottom: 1px solid var(--line);
}
.connected h2 {
  margin: 20px 0;
  font-family: var(--font-display);
  font-size: clamp(48px, 5vw, 76px);
  font-weight: 700;
  letter-spacing: -0.055em;
  line-height: 0.98;
}
.connected-lead > p:last-child {
  color: var(--muted);
  font-size: 18px;
  line-height: 1.65;
}
.connected .capability-list {
  margin-top: 0;
  align-self: center;
}
.connected a:hover {
  color: var(--accent);
}

.site {
  min-height: 100vh;
  overflow: clip;
  background: var(--page);
}
.skip-link {
  position: fixed;
  z-index: 100;
  top: 10px;
  left: 10px;
  padding: 10px 14px;
  color: var(--accent-ink);
  background: var(--accent-fill);
  transform: translateY(-160%);
}
.skip-link:focus {
  transform: translateY(0);
}

.site-header {
  position: sticky;
  z-index: 20;
  top: 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 78px;
  max-width: var(--max);
  margin: 0 auto;
  padding: 0 clamp(20px, 4.2vw, 68px);
  border-bottom: 1px solid var(--line);
  background: var(--header);
  backdrop-filter: blur(20px);
}
.site-header nav {
  display: flex;
  gap: 32px;
  align-items: center;
}
.site-header nav a,
.source-link,
.theme-toggle {
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.02em;
}
.site-header nav a,
.theme-toggle {
  color: var(--muted);
}
.site-header nav a:hover,
.theme-toggle:hover {
  color: var(--ink);
}
.header-actions {
  display: flex;
  justify-self: end;
  align-items: center;
  gap: 20px;
}
.theme-toggle {
  padding: 7px 0;
  border: 0;
  background: transparent;
}
.source-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.wordmark {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.wordmark b {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 750;
  letter-spacing: -0.025em;
}
.wordmark-frames {
  display: grid;
  grid-template-columns: 5px 8px 5px;
  gap: 2px;
  height: 18px;
  align-items: stretch;
}
.wordmark-frames i {
  display: block;
  border: 1px solid var(--ink);
  background: transparent;
}
.wordmark-frames i:nth-child(2) {
  background: var(--accent-fill);
  border-color: var(--accent);
  transform: translateY(-2px);
}

.hero {
  max-width: var(--max);
  margin: 0 auto;
}
.hero-context,
.plain-label {
  margin: 0;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}
.hero h1,
.hero h2,
.product h2,
.docs h2,
.lineage h2 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.055em;
}
.hero-summary,
.product-copy > p,
.docs-lead > p,
.lineage-copy > p {
  color: var(--muted);
  font-size: clamp(15px, 1.25vw, 18px);
  line-height: 1.65;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.button {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 5px 6px 5px 20px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 750;
}
.button .arrow,
.source-link .arrow,
.text-link .arrow {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  border-radius: 50%;
}
.button.primary {
  color: var(--accent-ink);
  border-color: var(--accent);
  background: var(--accent-fill);
}
.button.primary .arrow {
  color: var(--ink);
  background: var(--page);
}
.button.quiet {
  padding-right: 20px;
  background: transparent;
}
.button:hover {
  transform: translateY(-2px);
}
.text-link {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: fit-content;
  font-size: 12px;
  font-weight: 750;
}
.text-link .arrow {
  color: var(--accent-ink);
  background: var(--accent-fill);
}
.button,
.text-link,
.site-header a,
.theme-toggle,
.guide-index a {
  transition:
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1),
    color 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease;
}

.campaign-image {
  position: relative;
  overflow: hidden;
  background: #08090b;
}
.campaign-image img {
  height: 100%;
  object-fit: cover;
}
.app-proof > div {
  padding: 6px;
  border: 1px solid var(--line-strong);
  border-radius: 18px;
  background: var(--surface-2);
  box-shadow: 0 32px 80px var(--shadow);
}
.app-proof img {
  border-radius: 12px;
}
.app-proof figcaption {
  max-width: 620px;
  margin-top: 14px;
  color: var(--quiet);
  font-size: 10px;
  line-height: 1.5;
}
.double-bezel {
  padding: 7px;
  border: 1px solid var(--line);
  border-radius: 24px;
}

.capability-list {
  margin-top: 46px;
}
.capability-list article {
  display: grid;
  grid-template-columns: minmax(120px, 0.55fr) 1fr;
  gap: 24px;
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
}
.capability-list article:first-child {
  border-top: 1px solid var(--line);
}
.capability-list strong {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: -0.025em;
}
.capability-list p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}

/* Direction A: copy and image enter as two unequal chapter frames. */
.hero-sequence {
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.22fr);
  min-height: calc(100vh - 78px);
}
.hero-sequence .hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(72px, 9vw, 142px) clamp(28px, 5.6vw, 90px);
}
.hero-sequence h1 {
  max-width: 680px;
  margin-top: 26px;
  font-size: clamp(68px, 7.8vw, 116px);
  line-height: 0.84;
}
.hero-sequence h1 span {
  display: block;
  color: var(--accent-fill);
}
.hero-sequence .hero-summary {
  max-width: 470px;
  margin: 34px 0;
}
.hero-sequence .hero-media {
  min-height: 640px;
  border-radius: 0 0 0 24px;
}
.hero-sequence .hero-media img {
  object-position: 62% center;
}
.product {
  max-width: var(--max);
  margin: 0 auto;
}
.product-sequence {
  display: grid;
  grid-template-columns: 0.78fr 1.22fr;
  gap: clamp(60px, 8vw, 126px);
  align-items: center;
  padding: 150px clamp(24px, 5vw, 78px);
}
.product-copy h2 {
  max-width: 570px;
  margin-top: 20px;
  font-size: clamp(48px, 5vw, 76px);
  line-height: 0.98;
}
.product-copy > p {
  max-width: 560px;
  margin: 26px 0 0;
}
.product-sequence .app-proof {
  transform: rotate(1.2deg);
}

.reading {
  display: grid;
  grid-template-columns: 0.72fr 1.28fr;
  gap: clamp(70px, 10vw, 160px);
  max-width: var(--max);
  margin: 0 auto;
  padding: 150px clamp(24px, 6vw, 96px);
  background: var(--surface);
}
.reading-lead h2 {
  max-width: 610px;
  margin: 20px 0 0;
  font-family: var(--font-display);
  font-size: clamp(54px, 6vw, 92px);
  font-weight: 700;
  line-height: 0.92;
  letter-spacing: -0.055em;
}
.reading-lead > p:last-child {
  max-width: 560px;
  margin: 28px 0 0;
  color: var(--muted);
  font-size: clamp(15px, 1.25vw, 18px);
  line-height: 1.65;
}
.mode-list {
  align-self: center;
  border-top: 1px solid var(--line-strong);
}
.mode-list article {
  display: grid;
  grid-template-columns: 110px 1.2fr 0.8fr;
  gap: 26px;
  align-items: baseline;
  padding: 27px 0;
  border-bottom: 1px solid var(--line);
}
.mode-list span {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.mode-list strong {
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 1.15;
  letter-spacing: -0.025em;
}
.mode-list p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.55;
}

.docs {
  display: grid;
  grid-template-columns: 0.82fr 1.18fr;
  gap: clamp(70px, 11vw, 180px);
  max-width: var(--max);
  margin: 0 auto;
  padding: 150px clamp(24px, 6vw, 96px);
  background: var(--surface);
}
.docs-lead {
  max-width: 600px;
}
.docs h2,
.lineage h2 {
  margin-top: 20px;
  font-size: clamp(52px, 6vw, 90px);
  line-height: 0.92;
}
.docs-lead > p {
  margin: 28px 0 32px;
}
.guide-index {
  align-self: center;
  border-top: 1px solid var(--line-strong);
}
.guide-index a {
  display: grid;
  grid-template-columns: 0.7fr 1.2fr 1fr 24px;
  gap: 26px;
  align-items: center;
  padding: 26px 0;
  border-bottom: 1px solid var(--line);
}
.guide-index a::after {
  content: "↗";
  justify-self: end;
  color: var(--accent);
}
.guide-index a:hover {
  transform: translateX(6px);
}
.guide-index span {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.guide-index strong {
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: -0.02em;
}
.guide-index small {
  color: var(--muted);
  font-size: 10px;
  line-height: 1.45;
}

.lineage {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: clamp(70px, 11vw, 180px);
  max-width: var(--max);
  margin: 0 auto;
  padding: 150px clamp(24px, 6vw, 96px);
}
.lineage-copy > p {
  margin: 0 0 44px;
}
.lineage-copy > p strong {
  color: var(--ink);
}
.site-footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 126px;
  max-width: var(--max);
  margin: 0 auto;
  padding: 26px clamp(24px, 4.2vw, 68px) 92px;
  border-top: 1px solid var(--line);
}
.site-footer p {
  margin: 0;
  color: var(--quiet);
  font-size: 10px;
}
.site-footer nav {
  display: flex;
  justify-self: end;
  gap: 28px;
  font-size: 11px;
}

a:focus-visible,
button:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 4px;
}

@media (prefers-reduced-motion: no-preference) {
  .hero-copy > * {
    animation: enter 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .hero-copy > *:nth-child(2) {
    animation-delay: 80ms;
  }
  .hero-copy > *:nth-child(3) {
    animation-delay: 150ms;
  }
  .hero-copy > *:nth-child(4) {
    animation-delay: 220ms;
  }
  .campaign-image {
    animation: image-enter 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes enter {
    from {
      opacity: 0;
      transform: translateY(22px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes image-enter {
    from {
      opacity: 0;
      transform: scale(0.985);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
}

@media (max-width: 1100px) {
  .site-header {
    grid-template-columns: 1fr auto;
  }
  .site-header > nav {
    grid-row: 2;
    grid-column: 1 / -1;
    justify-content: center;
    gap: 24px;
    padding-bottom: 15px;
  }
  .site-header {
    padding-top: 16px;
    row-gap: 12px;
  }
  .hero-sequence {
    grid-template-columns: 1fr;
  }
  .hero-sequence .hero-media {
    height: 620px;
    min-height: 0;
    border-radius: 0;
  }
  .reading,
  .product-sequence,
  .docs,
  .lineage,
  .connected {
    grid-template-columns: 1fr;
  }
  .product-sequence .app-proof {
    grid-column: 1;
  }
}

@media (max-width: 760px) {
  .site-header {
    min-height: 66px;
    padding: 0 18px;
  }
  .header-actions {
    gap: 14px;
  }
  .source-link {
    display: none;
  }
  .hero-sequence .hero-copy {
    min-height: 570px;
    padding: 74px 22px;
  }
  .hero-sequence h1 {
    font-size: clamp(62px, 19vw, 88px);
  }
  .hero-sequence .hero-media {
    height: 430px;
    min-height: 0;
  }
  .hero-sequence .hero-media img {
    object-position: 62% center;
  }
  .reading,
  .product-sequence,
  .docs,
  .lineage,
  .connected {
    gap: 52px;
    padding: 92px 20px;
  }
  .reading-lead h2 {
    font-size: 50px;
  }
  .mode-list article {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .product-copy h2,
  .docs h2,
  .lineage h2 {
    font-size: 50px;
  }
  .app-proof {
    padding: 4px;
    border-radius: 15px;
  }
  .app-proof > div {
    padding: 3px;
    border-radius: 10px;
  }
  .app-proof img {
    border-radius: 7px;
  }
  .capability-list article {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .guide-index a {
    grid-template-columns: 1fr 24px;
    gap: 8px 18px;
  }
  .guide-index span {
    grid-column: 1;
  }
  .guide-index strong {
    grid-column: 1;
  }
  .guide-index small {
    grid-column: 1;
  }
  .guide-index a::after {
    grid-column: 2;
    grid-row: 1 / 4;
  }
  .site-footer {
    grid-template-columns: 1fr auto;
    padding: 24px 20px 40px;
  }
  .site-footer p {
    display: none;
  }
  .site-footer nav {
    gap: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
