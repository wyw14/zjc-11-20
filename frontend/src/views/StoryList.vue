<template>
  <div class="story-list">
    <div class="container">
      <section class="hero card">
        <div class="hero-left">
          <h1>开启你的微小说之旅 ✍️</h1>
          <p class="hero-desc">
            每篇故事最多允许 <strong>{{ config?.maxParticipants || 10 }}</strong> 位作者参与接龙，
            总字数上限 <strong>{{ config?.maxCharsPerStory || 5000 }}</strong> 字。
            邀请你的朋友们一起创作有趣的故事吧！
          </p>
          <button class="btn-primary" @click="showCreate = true">
            + 创建新故事
          </button>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-num">{{ stories.length }}</span>
            <span class="stat-label">故事总数</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ ongoingCount }}</span>
            <span class="stat-label">进行中</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ lockedCount }}</span>
            <span class="stat-label">已完结</span>
          </div>
        </div>
      </section>

      <section class="list-section">
        <div class="section-header">
          <h2>📚 故事广场</h2>
        </div>

        <div v-if="loading" class="loading card">正在加载故事列表</div>

        <div v-else-if="stories.length === 0" class="empty card">
          <div class="empty-icon">📝</div>
          <p>还没有故事，点击上方按钮创建第一个吧！</p>
        </div>

        <div v-else class="story-grid">
          <router-link
            v-for="s in stories"
            :key="s.id"
            :to="`/story/${s.id}`"
            class="story-card"
          >
            <div class="story-card-header">
              <h3 class="story-title">{{ s.title }}</h3>
              <span
                :class="['tag', s.locked ? 'tag-success' : 'tag-warning']"
              >{{ s.locked ? '已完结' : '接龙中' }}</span>
            </div>
            <div class="story-card-body">
              <div class="story-meta">
                <span class="meta-item">
                  <span class="meta-icon">👥</span>
                  <span>{{ s.participantCount }}/{{ config?.maxParticipants || 10 }} 人</span>
                </span>
                <span class="meta-item">
                  <span class="meta-icon">✏️</span>
                  <span>{{ s.entryCount }} 段</span>
                </span>
                <span class="meta-item">
                  <span class="meta-icon">📝</span>
                  <span>{{ s.totalChars }}/{{ config?.maxCharsPerStory || 5000 }} 字</span>
                </span>
              </div>
              <div class="progress-wrap">
                <div
                  class="progress-bar"
                  :style="{
                    width: Math.min(
                      Math.max(
                        (s.participantCount / (config?.maxParticipants || 10)) * 100,
                        (s.totalChars / (config?.maxCharsPerStory || 5000)) * 100
                      ),
                      100
                    ) + '%'
                  }"
                ></div>
              </div>
            </div>
            <div class="story-card-footer">
              <span class="time">更新于 {{ formatTime(s.updatedAt) }}</span>
            </div>
          </router-link>
        </div>
      </section>
    </div>

    <div v-if="showCreate" class="modal-mask" @click.self="showCreate = false">
      <div class="modal card">
        <div class="modal-header">
          <h3>✨ 创建新故事</h3>
          <button class="close-btn" @click="showCreate = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>故事标题</label>
            <input v-model="form.title" placeholder="请输入故事标题..." maxlength="50" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>你的笔名</label>
              <input v-model="form.author" placeholder="请输入笔名..." maxlength="20" />
            </div>
          </div>
          <div class="form-group">
            <label>开篇内容</label>
            <textarea
              v-model="form.content"
              placeholder="写下故事的第一段吧..."
              rows="6"
              :maxlength="config?.maxCharsPerStory || 5000"
            ></textarea>
            <div class="hint">
              {{ form.content.length }} / {{ config?.maxCharsPerStory || 5000 }} 字
            </div>
          </div>
          <div v-if="submitError" class="error-text">{{ submitError }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showCreate = false">取消</button>
          <button class="btn-primary" :disabled="submitting" @click="handleCreate">
            {{ submitting ? '创建中...' : '开始创作' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api.js'
import { formatTime } from '../utils.js'

const router = useRouter()
const stories = ref([])
const config = ref(null)
const loading = ref(false)
const showCreate = ref(false)
const submitting = ref(false)
const submitError = ref('')
const form = ref({
  title: '',
  author: '',
  content: ''
})

const ongoingCount = computed(() => stories.value.filter(s => !s.locked).length)
const lockedCount = computed(() => stories.value.filter(s => s.locked).length)

async function loadData() {
  loading.value = true
  try {
    const [list, cfg] = await Promise.all([api.getStories(), api.getConfig()])
    stories.value = list
    config.value = cfg
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  submitError.value = ''
  if (!form.value.title.trim()) {
    submitError.value = '请填写故事标题'
    return
  }
  if (!form.value.author.trim()) {
    submitError.value = '请填写你的笔名'
    return
  }
  if (!form.value.content.trim()) {
    submitError.value = '请填写开篇内容'
    return
  }
  submitting.value = true
  try {
    const story = await api.createStory({
      title: form.value.title.trim(),
      author: form.value.author.trim(),
      content: form.value.content.trim()
    })
    showCreate.value = false
    form.value = { title: '', author: '', content: '' }
    router.push(`/story/${story.id}`)
  } catch (e) {
    submitError.value = e.message
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.hero {
  display: flex;
  gap: 40px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  background: linear-gradient(135deg, #eef2ff 0%, #fdf2f8 100%);
  border-color: #e0e7ff;
}

.hero-left {
  flex: 1;
}

.hero h1 {
  font-size: 28px;
  margin-bottom: 12px;
  color: var(--text);
}

.hero-desc {
  color: var(--text-muted);
  margin-bottom: 20px;
  font-size: 15px;
  max-width: 500px;
}

.hero-desc strong {
  color: var(--primary);
}

.hero-stats {
  display: flex;
  gap: 24px;
  flex-shrink: 0;
}

.stat-item {
  text-align: center;
  padding: 16px 24px;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  min-width: 90px;
}

.stat-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.section-header {
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 20px;
}

.story-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.story-card {
  display: block;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  color: var(--text);
  transition: all 0.25s;
  cursor: pointer;
}

.story-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-light);
  color: var(--text);
}

.story-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.story-title {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.4;
}

.story-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.progress-wrap {
  height: 6px;
  background: var(--surface-alt);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: 3px;
  transition: width 0.3s;
}

.story-card-footer {
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.time {
  font-size: 12px;
  color: var(--text-light);
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 18px;
}

.close-btn {
  background: none;
  font-size: 28px;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  padding: 0;
  line-height: 1;
  border-radius: 50%;
}

.close-btn:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  margin-top: 8px;
}

@media (max-width: 640px) {
  .hero {
    flex-direction: column;
    gap: 24px;
  }
  .hero-stats {
    width: 100%;
    justify-content: space-around;
  }
}
</style>
