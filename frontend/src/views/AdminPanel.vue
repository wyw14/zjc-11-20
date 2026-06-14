<template>
  <div class="admin-panel">
    <div class="container">
      <header class="admin-header card">
        <div class="admin-header-inner">
          <div>
            <h1>🛠️ 故事管理中心</h1>
            <p class="admin-subtitle">管理所有社区微小说，支持重置故事内容</p>
          </div>
          <button class="btn-secondary" @click="loadStories">
            🔄 刷新列表
          </button>
        </div>
      </header>

      <section class="admin-content card">
        <div v-if="loading" class="loading">正在加载...</div>

        <div v-else-if="stories.length === 0" class="empty">
          <div class="empty-icon">📭</div>
          <p>暂无故事数据</p>
        </div>

        <template v-else>
          <div class="table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>故事标题</th>
                  <th class="num-col">参与人数</th>
                  <th class="num-col">段数</th>
                  <th class="num-col">字数</th>
                  <th class="status-col">状态</th>
                  <th class="time-col">最后更新</th>
                  <th class="action-col">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in stories" :key="s.id">
                  <td class="title-cell">
                    <router-link :to="`/story/${s.id}`" class="story-link">
                      <span class="story-name">{{ s.title }}</span>
                    </router-link>
                    <span class="story-id">#{{ s.id.slice(0, 8) }}</span>
                  </td>
                  <td class="num-col">
                    <span
                      :class="['num-val', s.participantCount >= 10 ? 'num-warn' : '']"
                    >
                      {{ s.participantCount }}/10
                    </span>
                  </td>
                  <td class="num-col">{{ s.entryCount }}</td>
                  <td class="num-col">
                    <span
                      :class="['num-val', s.totalChars >= 5000 ? 'num-warn' : '']"
                    >
                      {{ s.totalChars }}/5000
                    </span>
                  </td>
                  <td class="status-col">
                    <span
                      :class="['tag', s.locked ? 'tag-success' : 'tag-warning']"
                    >
                      {{ s.locked ? '已完结' : '进行中' }}
                    </span>
                  </td>
                  <td class="time-col">
                    <span class="time">{{ formatTime(s.updatedAt) }}</span>
                  </td>
                  <td class="action-col">
                    <div class="actions">
                      <button
                        class="btn-secondary btn-sm"
                        @click="viewStory(s.id)"
                      >查看</button>
                      <button
                        class="btn-danger btn-sm"
                        :disabled="resetting === s.id || s.entryCount <= 1"
                        @click="askReset(s)"
                      >
                        {{ resetting === s.id ? '重置中...' : '重置' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="table-footer">
            共 <strong>{{ stories.length }}</strong> 篇故事
          </div>
        </template>
      </section>
    </div>

    <div
      v-if="confirmVisible"
      class="modal-mask"
      @click.self="confirmVisible = false"
    >
      <div class="modal card confirm-modal">
        <div class="modal-header danger">
          <h3>⚠️ 确认重置</h3>
          <button class="close-btn" @click="confirmVisible = false">×</button>
        </div>
        <div class="modal-body">
          <div class="confirm-content">
            <div class="confirm-icon">💥</div>
            <p class="confirm-text">
              确定要重置故事 <strong>{{ targetStory?.title }}</strong> 吗？
            </p>
            <ul class="confirm-info">
              <li>当前 <strong>{{ targetStory?.entryCount }}</strong> 段接龙将被清除</li>
              <li>只保留开篇第一段内容</li>
              <li>重置后状态将变为「进行中」</li>
              <li>此操作不可撤销</li>
            </ul>
          </div>
          <div v-if="resetError" class="error-text">{{ resetError }}</div>
        </div>
        <div class="modal-footer">
          <button
            class="btn-secondary"
            :disabled="resetting === targetStory?.id"
            @click="confirmVisible = false"
          >
            取消
          </button>
          <button
            class="btn-danger"
            :disabled="resetting === targetStory?.id"
            @click="doReset"
          >
            {{ resetting === targetStory?.id ? '正在重置...' : '确认重置' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="toast.show" :class="['toast', toast.type]">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api.js'
import { formatTime } from '../utils.js'

const router = useRouter()
const stories = ref([])
const loading = ref(false)
const resetting = ref(null)
const resetError = ref('')
const confirmVisible = ref(false)
const targetStory = ref(null)

const toast = ref({ show: false, message: '', type: 'success' })

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => (toast.value.show = false), 2800)
}

async function loadStories() {
  loading.value = true
  try {
    stories.value = await api.getStories()
  } catch (e) {
    showToast('加载失败：' + e.message, 'error')
  } finally {
    loading.value = false
  }
}

function viewStory(id) {
  router.push(`/story/${id}`)
}

function askReset(story) {
  targetStory.value = story
  resetError.value = ''
  confirmVisible.value = true
}

async function doReset() {
  if (!targetStory.value) return
  resetError.value = ''
  resetting.value = targetStory.value.id
  try {
    await api.resetStory(targetStory.value.id)
    confirmVisible.value = false
    showToast('故事已重置成功')
    await loadStories()
  } catch (e) {
    resetError.value = e.message
  } finally {
    resetting.value = null
  }
}

onMounted(loadStories)
</script>

<style scoped>
.admin-header {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #fef3c7 0%, #fee2e2 100%);
  border-color: #fed7aa;
}

.admin-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.admin-header h1 {
  font-size: 22px;
  margin-bottom: 4px;
}

.admin-subtitle {
  color: var(--text-muted);
  font-size: 14px;
}

.table-wrap {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.admin-table thead th {
  text-align: left;
  padding: 12px 14px;
  background: var(--surface-alt);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.admin-table tbody td {
  padding: 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.admin-table tbody tr:hover {
  background: var(--surface-alt);
}

.admin-table tbody tr:last-child td {
  border-bottom: none;
}

.num-col {
  text-align: center;
  white-space: nowrap;
}

.status-col,
.time-col,
.action-col {
  text-align: center;
  white-space: nowrap;
}

.title-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.story-link {
  display: inline;
}

.story-name {
  font-weight: 500;
  color: var(--text);
}

.story-link:hover .story-name {
  color: var(--primary);
}

.story-id {
  font-size: 11px;
  color: var(--text-light);
  font-family: monospace;
}

.num-val {
  font-variant-numeric: tabular-nums;
}

.num-warn {
  color: var(--error);
  font-weight: 600;
}

.time {
  font-size: 13px;
  color: var(--text-muted);
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.table-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  text-align: right;
  color: var(--text-muted);
  font-size: 13px;
}

.table-footer strong {
  color: var(--primary);
  font-size: 16px;
  margin: 0 4px;
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
  max-width: 460px;
}

.confirm-modal {
  animation: zoomIn 0.2s ease;
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
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

.modal-header.danger h3 {
  color: var(--error);
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

.confirm-content {
  text-align: center;
  margin-bottom: 16px;
}

.confirm-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.confirm-text {
  font-size: 16px;
  margin-bottom: 14px;
}

.confirm-text strong {
  color: var(--primary);
}

.confirm-info {
  text-align: left;
  list-style: none;
  background: var(--surface-alt);
  padding: 14px 18px;
  border-radius: var(--radius-sm);
}

.confirm-info li {
  padding: 4px 0;
  color: var(--text-muted);
  font-size: 13px;
}

.confirm-info li::before {
  content: '• ';
  color: var(--error);
  font-weight: bold;
}

.confirm-info strong {
  color: var(--error);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  margin-top: 8px;
}

.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 14px;
  font-weight: 500;
  z-index: 2000;
  box-shadow: var(--shadow-lg);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.toast.success {
  background: var(--success);
}

.toast.error {
  background: var(--error);
}

@media (max-width: 640px) {
  .admin-header-inner {
    flex-direction: column;
    align-items: flex-start;
  }
  .confirm-info {
    padding: 12px 14px;
  }
}
</style>
