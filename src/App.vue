<script setup>
import {onMounted, ref} from 'vue'
import Main from './components/Main.vue'

const version = __APP_VERSION__
const iconUrl = import.meta.env.BASE_URL + 'icon.png'

// Dark mode is applied synchronously in index.html,
// so here we just read back whatever state that left
// us in and keep it in sync with further toggles.
const isDark = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('app-dark')
})

function toggleDarkMode() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('app-dark', isDark.value)
  try {
    localStorage.setItem('pca-theme', isDark.value ? 'dark' : 'light')
  } catch (e) {
    // Ignore - localStorage may be unavailable (e.g. privacy mode).
  }
}
</script>

<template>
  <div class="page-shell">
    <header class="top-bar">
      <div class="top-bar-inner">
        <div class="brand">
          <img :src="iconUrl" alt="" class="brand-icon" />
          <div class="brand-text">
            <span class="brand-title">Plugin Creator</span>
            <span class="brand-subtitle">for TheoTown</span>
          </div>
        </div>

        <nav class="top-bar-links">
          <span class="version-badge">v{{ version }}</span>
          <a
            class="top-bar-link"
            href="https://pca.svetikas.lt/docs/getting-started/writing-a-sample-plugin/"
            target="_blank"
            rel="noopener"
          >
            <i class="pi pi-book"></i>
            <span>Docs</span>
          </a>
          <a
            class="top-bar-link"
            href="https://github.com/svetikas/Plugin-creator-website"
            target="_blank"
            rel="noopener"
          >
            <i class="pi pi-github"></i>
            <span>GitHub</span>
          </a>
          <button
              type="button"
              class="theme-toggle"
              :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              @click="toggleDarkMode"
          >
            <i class="pi" :class="isDark ? 'pi-sun' : 'pi-moon'"></i>
          </button>
        </nav>
      </div>
    </header>

    <div class="maintenance-banner">
      <i class="pi pi-info-circle"></i>
      <span>As of 2026, this site is in maintenance mode and will not receive new features.</span>
    </div>

    <main class="page-container">
      <Main />
    </main>

    <footer class="site-footer">
      <a href="https://github.com/svetikas/Plugin-creator-website">
        &copy; Plugin creator website v{{ version }} by JustAnyone, 2026
      </a>
    </footer>
  </div>
</template>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* -------------------------------------------------- Top bar -- */
.top-bar {
  background: linear-gradient(135deg, var(--app-primary-dark), var(--app-primary));
  color: #fff;
  box-shadow: var(--app-shadow);
}

.top-bar-inner {
  max-width: var(--app-max-width);
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-title {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.brand-subtitle {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.75);
}

.top-bar-links {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.version-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  margin-right: 0.35rem;
}

.top-bar-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  padding: 0.4rem 0.7rem;
  border-radius: var(--app-radius-sm);
  transition: background-color .15s ease;
}

.top-bar-link:hover {
  background: rgba(255, 255, 255, 0.14);
  text-decoration: none;
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  padding: 0;
  margin-left: 0.15rem;
  border: none;
  border-radius: var(--app-radius-sm);
  background: transparent;
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color .15s ease;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.14);
}

.theme-toggle:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.8);
  outline-offset: 2px;
}

/* -------------------------------------------------- Maintenance banner -- */
.maintenance-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--app-warning-bg);
  border-bottom: 1px solid var(--app-warning-border);
  color: var(--app-warning-text);
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.55rem 1rem;
  text-align: center;
}

/* -------------------------------------------------- Page container -- */
.page-container {
  flex: 1;
  width: 100%;
  max-width: var(--app-max-width);
  margin: 0 auto;
  padding: 1.75rem 1.5rem 2.5rem;
}

/* -------------------------------------------------- Footer -- */
.site-footer {
  text-align: center;
  background: var(--app-surface);
  border-top: 1px solid var(--app-border);
  color: var(--app-text-faint);
  padding: 1rem 0;
  font-size: 0.85rem;
}

.site-footer a {
  color: var(--app-text-faint);
  font-weight: 500;
}

.site-footer a:hover {
  color: var(--app-primary);
}

@media (max-width: 640px) {
  .top-bar-inner {
    justify-content: center;
    text-align: center;
  }

  .top-bar-link span {
    display: none;
  }
}
</style>
