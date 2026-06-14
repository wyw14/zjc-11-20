<template>
  <div class="app">
    <header class="app-header">
      <div class="container header-inner">
        <router-link to="/" class="logo">
          <span class="logo-icon">📖</span>
          <span class="logo-text">微小说接力</span>
        </router-link>
        <nav class="nav">
          <router-link to="/" class="nav-link" exact-active-class="active">故事广场</router-link>
          <router-link to="/admin" class="nav-link" active-class="active">管理中心</router-link>
        </nav>
      </div>
    </header>
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <footer class="app-footer">
      <div class="container">
        <p>社区微小说接力创作工具 · 每篇故事最多10人接龙 · 字数上限5000字</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 20px;
  font-weight: 700;
}

.logo:hover {
  color: white;
}

.logo-icon {
  font-size: 28px;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav-link {
  color: rgba(255, 255, 255, 0.85);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: all 0.2s;
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.15);
}

.nav-link.active {
  color: white;
  background: rgba(255, 255, 255, 0.2);
}

.app-main {
  flex: 1;
}

.app-footer {
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 20px 0;
  margin-top: 40px;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
