import express from 'express';
import cors from 'cors';
import {
  createStory,
  getAllStories,
  getStoryById,
  addEntry,
  resetStory,
  joinReservationQueue,
  leaveReservationQueue,
  getReservationQueue,
  MAX_PARTICIPANTS,
  MAX_CHARS_PER_STORY
} from './storage.js';

const app = express();
const PORT = process.env.PORT || 4019;
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/config', (_req, res) => {
  res.json({
    maxParticipants: MAX_PARTICIPANTS,
    maxCharsPerStory: MAX_CHARS_PER_STORY
  });
});

app.get('/api/stories', (_req, res) => {
  try {
    const stories = getAllStories();
    res.json(stories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取故事列表失败' });
  }
});

app.get('/api/stories/:id', (req, res) => {
  try {
    const story = getStoryById(req.params.id);
    if (!story) {
      return res.status(404).json({ error: '故事不存在' });
    }
    res.json(story);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取故事详情失败' });
  }
});

app.post('/api/stories', (req, res) => {
  try {
    const { title, content, author } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ error: '故事标题不能为空' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: '开篇内容不能为空' });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ error: '作者名称不能为空' });
    }
    if (content.length > MAX_CHARS_PER_STORY) {
      return res.status(400).json({ error: `开篇内容不能超过 ${MAX_CHARS_PER_STORY} 字` });
    }
    const story = createStory({
      title: title.trim(),
      content: content.trim(),
      author: author.trim()
    });
    res.status(201).json(story);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建故事失败' });
  }
});

app.post('/api/stories/:id/entries', (req, res) => {
  try {
    const { content, author } = req.body || {};
    if (!content || !content.trim()) {
      return res.status(400).json({ error: '续写内容不能为空' });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ error: '作者名称不能为空' });
    }
    const result = addEntry(req.params.id, {
      content: content.trim(),
      author: author.trim()
    });
    if (!result.success) {
      return res.status(result.code || 400).json({ error: result.error });
    }
    res.json(result.story);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '提交续写失败' });
  }
});

app.get('/api/stories/:id/reservations', (req, res) => {
  try {
    const result = getReservationQueue(req.params.id);
    if (!result.success) {
      return res.status(result.code || 400).json({ error: result.error });
    }
    res.json(result.queue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取预约队列失败' });
  }
});

app.post('/api/stories/:id/reservations', (req, res) => {
  try {
    const { author, remark } = req.body || {};
    if (!author || !author.trim()) {
      return res.status(400).json({ error: '笔名不能为空' });
    }
    const result = joinReservationQueue(req.params.id, {
      author: author.trim(),
      remark: remark || ''
    });
    if (!result.success) {
      return res.status(result.code || 400).json({ error: result.error });
    }
    res.status(201).json(result.story);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '加入预约队列失败' });
  }
});

app.delete('/api/stories/:id/reservations', (req, res) => {
  try {
    const { author } = req.body || {};
    if (!author || !author.trim()) {
      return res.status(400).json({ error: '笔名不能为空' });
    }
    const result = leaveReservationQueue(req.params.id, {
      author: author.trim()
    });
    if (!result.success) {
      return res.status(result.code || 400).json({ error: result.error });
    }
    res.json(result.story);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '退出预约队列失败' });
  }
});

app.post('/api/admin/stories/:id/reset', (req, res) => {
  try {
    const result = resetStory(req.params.id);
    if (!result.success) {
      return res.status(result.code || 400).json({ error: result.error });
    }
    res.json({
      message: '故事已重置',
      story: result.story
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '重置故事失败' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`微小说接力服务已启动: http://localhost:${PORT}`);
});
