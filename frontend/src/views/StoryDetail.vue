<template>
  <div class="story-detail">
    <div class="container">
      <div class="back-bar">
        <router-link to="/" class="back-link">← 返回故事广场</router-link>
      </div>

      <div v-if="loading" class="loading card">正在加载故事...</div>

      <div v-else-if="!story" class="empty card">
        <div class="empty-icon">❓</div>
        <p>故事不存在或已被删除</p>
        <router-link to="/" class="btn-primary" style="margin-top: 16px; display: inline-block;">
          返回广场
        </router-link>
      </div>

      <template v-else>
        <header class="story-header card">
          <div class="header-top">
            <h1 class="story-title">{{ story.title }}</h1>
            <span
              :class="['tag', story.locked ? 'tag-success' : 'tag-warning']"
            >
              {{ story.locked ? '已完结' : '接龙中' }}
            </span>
          </div>
          <div v-if="story.locked && story.lockedReason" class="lock-reason">
            🔒 {{ story.lockedReason }}
          </div>
          <div class="story-stats">
            <div class="stat">
              <span class="stat-label">参与人数</span>
              <span class="stat-value">
                <strong>{{ story.participantCount }}</strong>
                <span class="stat-max">/ {{ story.maxParticipants }}</span>
              </span>
            </div>
            <div class="stat">
              <span class="stat-label">接龙段数</span>
              <span class="stat-value">
                <strong>{{ story.entryCount }}</strong> 段
              </span>
            </div>
            <div class="stat">
              <span class="stat-label">总字数</span>
              <span class="stat-value">
                <strong>{{ story.totalChars }}</strong>
                <span class="stat-max">/ {{ story.maxChars }}</span>
              </span>
            </div>
          </div>
          <div class="progress-section">
            <div class="progress-label">
              <span>创作进度</span>
              <span>{{ progressPct }}%</span>
            </div>
            <div class="progress-wrap-lg">
              <div
                class="progress-bar-fill"
                :style="{ width: progressPct + '%' }"
              ></div>
            </div>
          </div>
        </header>

        <section class="chat-section card">
          <h2 class="section-title">💬 接龙对话</h2>
          <div class="chat-list">
            <div
              v-for="(entry, idx) in story.entries"
              :key="entry.id"
              :class="['bubble-row', idx % 2 === 0 ? 'left' : 'right']"
            >
              <div class="avatar" :style="{ background: avatarColor(entry.author) }">
                {{ entry.author.slice(0, 1) }}
              </div>
              <div class="bubble-wrapper">
                <div class="bubble-meta">
                  <span class="bubble-author">{{ entry.author }}</span>
                  <span class="bubble-order">第 {{ entry.order }} 棒</span>
                  <span class="bubble-time">{{ formatTime(entry.createdAt) }}</span>
                </div>
                <div
                  :class="['bubble', idx % 2 === 0 ? 'bubble-left' : 'bubble-right']"
                >
                  <p>{{ entry.content }}</p>
                  <div class="bubble-footer">
                    <span class="char-count">{{ entry.content.length }} 字</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="!story.locked" class="write-section card">
          <h2 class="section-title">✏️ 参与续写</h2>
          <div class="form-group">
            <label>你的笔名</label>
            <input
              v-model="form.author"
              placeholder="请输入你的笔名..."
              maxlength="20"
            />
            <div class="hint">同一笔名只计为一位参与者</div>
          </div>
          <div class="form-group">
            <label>续写内容</label>
            <textarea
              v-model="form.content"
              placeholder="继续这个故事，让它更精彩..."
              rows="5"
              :maxlength="maxAllowedChars"
            ></textarea>
            <div class="hint-row">
              <span>
                {{ form.content.length }} 字
                <span v-if="form.content.length > maxAllowedChars" class="error-text">
                  （超出上限）
                </span>
              </span>
              <span>剩余可容纳 {{ remainingChars }} 字</span>
            </div>
          </div>
          <div v-if="submitError" class="error-text">{{ submitError }}</div>
          <button
            class="btn-primary"
            :disabled="submitting || !canSubmit"
            @click="handleSubmit"
          >
            {{ submitting ? '提交中...' : '发布续写' }}
          </button>
        </section>

        <section v-else class="locked-section card">
          <div class="locked-content">
            <div class="locked-icon">🎉</div>
            <h3>恭喜！这篇故事已创作完成</h3>
            <p class="locked-reason-detail">{{ story.lockedReason }}</p>
            <p class="locked-tip">
              共 <strong>{{ story.participantCount }}</strong> 位作者参与，
              累计 <strong>{{ story.entryCount }}</strong> 段、
              <strong>{{ story.totalChars }}</strong> 字。
            </p>
            <button class="btn-secondary" @click="scrollToTop">
              ↑ 从头阅读
            </button>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api.js'
import { formatTime } from '../utils.js'

const props = defineProps({
  id: { type: String, required: true }
})

const route = useRoute()
const story = ref(null)
const loading = ref(false)
const submitting = ref(false)
const submitError = ref('')
const form = ref({ author: '', content: '' })
const chatListRef = ref(null)

const progressPct = computed(() => {
  if (!story.value) return 0
  const pct = Math.max(
    (story.value.participantCount / story.value.maxParticipants) * 100,
    (story.value.totalChars / story.value.maxChars) * 100
  )
  return Math.min(Math.round(pct), 100)
})

const remainingChars = computed(() => {
  if (!story.value) return 0
  return Math.max(0, story.value.maxChars - story.value.totalChars)
})

const maxAllowedChars = computed(() => Math.max(1, remainingChars.value))

const canSubmit = computed(() => {
  return (
    form.value.author.trim().length > 0 &&
    form.value.content.trim().length > 0 &&
    form.value.content.length <= maxAllowedChars.value
  )
})

const avatarColors = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4'
]

function avatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return avatarColors[hash % avatarColors.length]
}

async function loadStory() {
  loading.value = true
  try {
    story.value = await api.getStory(props.id || route.params.id)
  } catch (e) {
    console.error(e)
    story.value = null
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  submitError.value = ''
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const updated = await api.addEntry(story.value.id, {
      author: form.value.author.trim(),
      content: form.value.content.trim()
    })
    story.value = updated
    form.value.content = ''
    await nextTick()
    scrollToBottom()
  } catch (e) {
    submitError.value = e.message
  } finally {
    submitting.value = false
  }
}

function scrollToBottom() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(() => route.params.id, loadStory)
onMounted(loadStory)
</script>

<style scoped>
.back-bar {
  margin-bottom: 16px;
}

.back-link {
  font-size: 14px;
  color: var(--text-muted);
}

.back-link:hover {
  color: var(--primary);
}

.story-header {
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.story-title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
}

.lock-reason {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: var(--success);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  font-size: 14px;
}

.story-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat {
  text-align: center;
  padding: 12px;
  background: var(--surface-alt);
  border-radius: var(--radius-sm);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-value strong {
  color: var(--primary);
  font-size: 22px;
}

.stat-max {
  color: var(--text-light);
  font-size: 14px;
  font-weight: 400;
}

.progress-section {
  margin-top: 8px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.progress-wrap-lg {
  height: 10px;
  background: var(--surface-alt);
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: 5px;
  transition: width 0.4s ease;
}

.section-title {
  font-size: 17px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.chat-section {
  margin-bottom: 20px;
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bubble-row {
  display: flex;
  gap: 12px;
  max-width: 100%;
}

.bubble-row.right {
  flex-direction: row-reverse;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.bubble-wrapper {
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 60px);
}

.bubble-row.right .bubble-wrapper {
  align-items: flex-end;
}

.bubble-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.bubble-author {
  font-weight: 600;
  color: var(--text);
}

.bubble-order {
  background: var(--surface-alt);
  padding: 1px 8px;
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 11px;
}

.bubble {
  padding: 14px 18px;
  border-radius: 16px;
  line-height: 1.8;
  box-shadow: var(--shadow-sm);
  position: relative;
}

.bubble p {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 15px;
}

.bubble-left {
  background: var(--surface-alt);
  border-top-left-radius: 4px;
  color: var(--text);
}

.bubble-right {
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  color: white;
  border-top-right-radius: 4px;
}

.bubble-right .char-count {
  color: rgba(255, 255, 255, 0.7);
}

.bubble-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(100, 116, 139, 0.2);
  display: flex;
  justify-content: flex-end;
}

.char-count {
  font-size: 11px;
  color: var(--text-light);
}

.write-section {
  margin-bottom: 20px;
}

.hint-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.locked-section {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%);
  border-color: #bbf7d0;
}

.locked-content {
  text-align: center;
  padding: 20px 10px;
}

.locked-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.locked-content h3 {
  font-size: 20px;
  margin-bottom: 8px;
  color: var(--success);
}

.locked-reason-detail {
  color: var(--text-muted);
  margin-bottom: 12px;
  font-size: 14px;
}

.locked-tip {
  margin-bottom: 20px;
  color: var(--text);
}

.locked-tip strong {
  color: var(--primary);
}

@media (max-width: 640px) {
  .story-stats {
    grid-template-columns: 1fr;
  }
  .bubble-row {
    gap: 8px;
  }
  .avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
  .bubble-wrapper {
    max-width: calc(100% - 48px);
  }
}
</style>
