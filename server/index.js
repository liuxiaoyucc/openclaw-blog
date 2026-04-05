const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const redis = require('redis');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// Redis client
let redisClient = null;
let useRedis = false;

async function connectRedis() {
  try {
    redisClient = redis.createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis Error:', err));
    await redisClient.connect();
    useRedis = true;
    console.log('✅ Connected to Redis');
  } catch (error) {
    console.log('⚠️ Redis not available, using in-memory storage');
    useRedis = false;
  }
}

// ==================== CACHE MANAGER ====================

/**
 * 内存缓存管理器
 * - 支持 TTL（生存时间）
 * - 自动清理过期缓存
 * - 默认缓存时间 5 分钟
 */
const DEFAULT_TTL = 5 * 60 * 1000; // 5 分钟（毫秒）
const CLEANUP_INTERVAL = 60 * 1000; // 每分钟清理一次过期缓存

// 使用 Map 存储缓存数据
const cache = new Map();

// 缓存项结构: { value, expiresAt }

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @returns {any|null} - 缓存值，如果不存在或已过期返回 null
 */
function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  // 检查是否过期
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {any} value - 缓存值
 * @param {number} ttlSeconds - 生存时间（秒），默认 300 秒（5 分钟）
 */
function setCache(key, value, ttlSeconds = 300) {
  const expiresAt = Date.now() + (ttlSeconds * 1000);
  cache.set(key, { value, expiresAt });
}

/**
 * 清除指定缓存
 * @param {string} key - 缓存键
 * @returns {boolean} - 是否成功删除
 */
function clearCache(key) {
  return cache.delete(key);
}

/**
 * 清除所有缓存
 */
function clearAllCache() {
  cache.clear();
}

/**
 * 清理过期缓存
 */
function cleanupExpiredCache() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, item] of cache.entries()) {
    if (now > item.expiresAt) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cache cleanup: removed ${cleaned} expired items`);
  }
}

// 启动定时清理任务
const cleanupTimer = setInterval(cleanupExpiredCache, CLEANUP_INTERVAL);

// 防止定时器阻止进程退出
cleanupTimer.unref();

/**
 * 缓存装饰器 - 包装异步函数，自动缓存结果
 * @param {string} key - 缓存键
 * @param {Function} fn - 要缓存的异步函数
 * @param {number} ttlSeconds - 缓存时间（秒）
 * @returns {Promise<any>} - 缓存值或函数执行结果
 */
async function withCache(key, fn, ttlSeconds = 300) {
  const cached = getCache(key);
  if (cached !== null) {
    return cached;
  }
  
  const result = await fn();
  setCache(key, result, ttlSeconds);
  return result;
}

/**
 * 使缓存失效 - 清除指定键并返回新值
 * @param {string} key - 缓存键
 * @param {Function} fn - 重新获取数据的异步函数
 * @param {number} ttlSeconds - 缓存时间（秒）
 * @returns {Promise<any>} - 新的函数执行结果
 */
async function invalidateCache(key, fn, ttlSeconds = 300) {
  clearCache(key);
  const result = await fn();
  setCache(key, result, ttlSeconds);
  return result;
}

// 导出缓存管理函数（供外部使用或测试）
module.exports.cacheManager = {
  getCache,
  setCache,
  clearCache,
  clearAllCache,
  withCache,
  invalidateCache,
  getStats: () => ({
    size: cache.size,
    keys: Array.from(cache.keys())
  })
};

// ==================== STORAGE HELPERS ====================

// Storage helpers
const POSTS_KEY = 'blog:posts';
const USERS_KEY = 'blog:users';
const COMMENTS_KEY = 'blog:comments';
const VIEWS_KEY = 'blog:views';
const SESSIONS_KEY = 'blog:sessions';
const CATEGORIES_KEY = 'blog:categories';

async function getData(key, defaultValue = []) {
  if (useRedis) {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : defaultValue;
  }
  return defaultValue;
}

async function setData(key, value) {
  if (useRedis) {
    await redisClient.set(key, JSON.stringify(value));
  }
}

// In-memory storage fallback
const memoryStore = {
  posts: [],
  users: [],
  comments: [],
  views: {},
  sessions: {},
  categories: []
};

async function getPosts() {
  return useRedis ? await getData(POSTS_KEY) : memoryStore.posts;
}

async function savePosts(posts) {
  useRedis ? await setData(POSTS_KEY, posts) : memoryStore.posts = posts;
}

async function getUsers() {
  return useRedis ? await getData(USERS_KEY) : memoryStore.users;
}

async function saveUsers(users) {
  useRedis ? await setData(USERS_KEY, users) : memoryStore.users = users;
}

async function getComments() {
  return useRedis ? await getData(COMMENTS_KEY) : memoryStore.comments;
}

async function saveComments(comments) {
  useRedis ? await setData(COMMENTS_KEY, comments) : memoryStore.comments = comments;
}

async function getCategories() {
  return useRedis ? await getData(CATEGORIES_KEY) : memoryStore.categories;
}

async function saveCategories(categories) {
  useRedis ? await setData(CATEGORIES_KEY, categories) : memoryStore.categories = categories;
}

// Simple hash function for passwords
function hashPassword(password) {
  return crypto.createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

// Generate simple token
function generateToken(userId) {
  return crypto.randomBytes(32).toString('hex');
}

// Admin authentication middleware
async function requireAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    const sessions = useRedis ? await getData(SESSIONS_KEY, {}) : memoryStore.sessions;
    const session = sessions[token];
    if (!session) return res.status(401).json({ error: 'Invalid token' });
    
    const users = await getUsers();
    const user = users.find(u => u.id === session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==================== API ROUTES ====================

// Image upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.json({ url: imageUrl, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const users = await getUsers();
    if (users.find(u => u.username === username)) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    const newUser = {
      id: uuidv4(),
      username,
      password: hashPassword(password),
      displayName: displayName || username,
      avatar: null,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await saveUsers(users);
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await getUsers();
    const user = users.find(u => u.username === username);
    
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user.id);
    const sessions = useRedis ? await getData(SESSIONS_KEY, {}) : memoryStore.sessions;
    sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
    useRedis ? await setData(SESSIONS_KEY, sessions) : memoryStore.sessions = sessions;
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    const sessions = useRedis ? await getData(SESSIONS_KEY, {}) : memoryStore.sessions;
    const session = sessions[token];
    if (!session) return res.status(401).json({ error: 'Invalid token' });
    
    const users = await getUsers();
    const user = users.find(u => u.id === session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CATEGORY ROUTES ====================

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category (admin only)
app.post('/api/categories', requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const categories = await getCategories();
    
    // Check for duplicate name
    if (categories.find(c => c.name === name)) {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    
    const newCategory = {
      id: uuidv4(),
      name,
      description: description || '',
      createdAt: new Date().toISOString()
    };
    
    categories.push(newCategory);
    await saveCategories(categories);
    
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update category (admin only)
app.put('/api/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const categories = await getCategories();
    const index = categories.findIndex(c => c.id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Category not found' });
    
    // Check for duplicate name if changing name
    if (name && name !== categories[index].name) {
      if (categories.find(c => c.name === name)) {
        return res.status(409).json({ error: 'Category name already exists' });
      }
    }
    
    categories[index] = {
      ...categories[index],
      name: name || categories[index].name,
      description: description !== undefined ? description : categories[index].description
    };
    
    await saveCategories(categories);
    res.json(categories[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete category (admin only)
app.delete('/api/categories/:id', requireAdmin, async (req, res) => {
  try {
    const categories = await getCategories();
    const index = categories.findIndex(c => c.id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Category not found' });
    
    const deletedCategory = categories.splice(index, 1)[0];
    await saveCategories(categories);
    
    // Remove categoryId from posts that use this category
    const posts = await getPosts();
    let postsUpdated = false;
    posts.forEach(post => {
      if (post.categoryId === req.params.id) {
        delete post.categoryId;
        postsUpdated = true;
      }
    });
    if (postsUpdated) {
      await savePosts(posts);
    }
    
    res.json({ message: 'Category deleted', category: deletedCategory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== POST ROUTES ====================

// Get all posts (with pagination, search and filter)
// IMPORTANT: Keep /api/posts/search before /api/posts/:id to avoid route conflict
app.get('/api/posts', async (req, res) => {
  try {
    let posts = await getPosts();
    const categories = await getCategories();
    const { search, tag, author, status, categoryId, page = 1, limit = 10 } = req.query;
    
    // Parse pagination params
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    
    // Filter by status (published/draft)
    if (status) {
      posts = posts.filter(p => p.status === status);
    } else {
      posts = posts.filter(p => p.status !== 'draft');
    }
    
    // Filter by author
    if (author) {
      posts = posts.filter(p => p.author === author);
    }
    
    // Filter by tag
    if (tag) {
      posts = posts.filter(p => p.tags && p.tags.includes(tag));
    }
    
    // Filter by category
    if (categoryId) {
      posts = posts.filter(p => p.categoryId === categoryId);
    }
    
    // Search in title and content
    if (search) {
      const searchLower = search.toLowerCase();
      posts = posts.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.content.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by pinned first, then by date
    posts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    const total = posts.length;
    const totalPages = Math.ceil(total / limitNum);
    const start = (pageNum - 1) * limitNum;
    const pagedPosts = posts.slice(start, start + limitNum);
    
    // Add category info to each post
    const postsWithCategory = pagedPosts.map(post => {
      const postWithCat = { ...post };
      if (post.categoryId) {
        const category = categories.find(c => c.id === post.categoryId);
        if (category) {
          postWithCat.category = category;
        }
      }
      return postWithCat;
    });
    
    res.json({ posts: postsWithCategory, total, page: pageNum, totalPages, limit: limitNum });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search posts (full-text search via Redis fuzzy matching or string contains)
app.get('/api/posts/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }
    
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const keyword = q.trim();
    
    let posts = await getPosts();
    const categories = await getCategories();
    
    // Filter to published posts only
    posts = posts.filter(p => p.status !== 'draft');
    
    // Try Redis fuzzy search first, fall back to simple string contains
    let matchedPosts = [];
    
    if (useRedis) {
      // Use in-memory filter on posts array (already fetched from Redis as a whole)
      // Redis SCAN approach requires posts stored as individual keys, which is not our structure
      const keywordLower = keyword.toLowerCase();
      matchedPosts = posts.filter(p =>
        p.title.toLowerCase().includes(keywordLower) ||
        p.content.toLowerCase().includes(keywordLower)
      );
    } else {
      // In-memory string contains match (case-insensitive)
      const keywordLower = keyword.toLowerCase();
      matchedPosts = posts.filter(p =>
        p.title.toLowerCase().includes(keywordLower) ||
        p.content.toLowerCase().includes(keywordLower)
      );
    }
    
    // Sort by pinned first, then by relevance (date)
    matchedPosts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    const total = matchedPosts.length;
    const totalPages = Math.ceil(total / limitNum);
    const start = (pageNum - 1) * limitNum;
    const pagedPosts = matchedPosts.slice(start, start + limitNum);
    
    // Add category info
    const postsWithCategory = pagedPosts.map(post => {
      const postWithCat = { ...post };
      if (post.categoryId) {
        const category = categories.find(c => c.id === post.categoryId);
        if (category) {
          postWithCat.category = category;
        }
      }
      return postWithCat;
    });
    
    res.json({ posts: postsWithCategory, total, page: pageNum, totalPages, limit: limitNum });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top viewed posts (reading ranking) - MUST be before /api/posts/:id
app.get('/api/posts/rank', async (req, res) => {
  try {
    let posts = await getPosts();
    
    // Filter to published posts only
    posts = posts.filter(p => p.status === 'published');
    
    // Sort by views descending
    posts.sort((a, b) => (b.views || 0) - (a.views || 0));
    
    // Take top 5
    const topPosts = posts.slice(0, 5).map(post => ({
      id: post.id,
      title: post.title,
      views: post.views || 0
    }));
    
    res.json(topPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get posts by date (simplified format) - MUST be before /api/posts/:id
app.get('/api/posts/by-date', async (req, res) => {
  try {
    const { year, month, day } = req.query;
    const posts = await getPosts();
    const categories = await getCategories();
    
    // 筛选文章
    const filteredPosts = posts.filter(post => {
      // 只返回已发布的文章
      if (post.status === 'draft') return false;
      
      const date = new Date(post.createdAt);
      const postYear = date.getFullYear();
      const postMonth = date.getMonth() + 1;
      const postDay = date.getDate();
      
      if (year && parseInt(year) !== postYear) return false;
      if (month && parseInt(month) !== postMonth) return false;
      if (day && parseInt(day) !== postDay) return false;
      
      return true;
    });
    
    // 按时间倒序排列
    filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 简化输出格式
    const result = filteredPosts.map(post => {
      const postWithCat = {
        id: post.id,
        title: post.title,
        author: post.author,
        createdAt: post.createdAt,
        views: post.views || 0,
        likes: post.likes || 0,
        tags: post.tags || []
      };
      
      // 添加分类信息
      if (post.categoryId) {
        const category = categories.find(c => c.id === post.categoryId);
        if (category) {
          postWithCat.category = category;
        }
      }
      
      return postWithCat;
    });
    
    res.json({
      year: year ? parseInt(year) : null,
      month: month ? parseInt(month) : null,
      day: day ? parseInt(day) : null,
      total: result.length,
      posts: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single post (with view count) - MUST be after /api/posts/search and /api/posts/rank
app.get('/api/posts/:id', async (req, res) => {
  try {
    const posts = await getPosts();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // Increment view count
    post.views = (post.views || 0) + 1;
    await savePosts(posts);
    
    // Add category info to response
    const responsePost = { ...post };
    if (post.categoryId) {
      const categories = await getCategories();
      const category = categories.find(c => c.id === post.categoryId);
      if (category) {
        responsePost.category = category;
      }
    }
    
    res.json(responsePost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, author, tags, status = 'published', pinned = false, categoryId } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }
    
    // Validate categoryId if provided
    if (categoryId) {
      const categories = await getCategories();
      const category = categories.find(c => c.id === categoryId);
      if (!category) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }
    }
    
    const newPost = {
      id: uuidv4(),
      title,
      content,
      author: author || 'Anonymous',
      tags: tags || [],
      status,
      pinned,
      categoryId: categoryId || null,
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const posts = await getPosts();
    posts.unshift(newPost);
    await savePosts(posts);
    
    // Add category info to response
    const responsePost = { ...newPost };
    if (newPost.categoryId) {
      const categories = await getCategories();
      const category = categories.find(c => c.id === newPost.categoryId);
      if (category) {
        responsePost.category = category;
      }
    }
    
    res.status(201).json(responsePost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const { title, content, tags, status, pinned, categoryId } = req.body;
    const posts = await getPosts();
    const index = posts.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Post not found' });
    
    // Validate categoryId if provided
    if (categoryId !== undefined && categoryId !== null) {
      const categories = await getCategories();
      const category = categories.find(c => c.id === categoryId);
      if (!category) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }
    }
    
    posts[index] = {
      ...posts[index],
      title: title || posts[index].title,
      content: content || posts[index].content,
      tags: tags || posts[index].tags,
      status: status || posts[index].status,
      pinned: pinned !== undefined ? pinned : posts[index].pinned,
      categoryId: categoryId !== undefined ? (categoryId || null) : posts[index].categoryId,
      updatedAt: new Date().toISOString()
    };
    
    await savePosts(posts);
    
    // Add category info to response
    const responsePost = { ...posts[index] };
    if (posts[index].categoryId) {
      const categories = await getCategories();
      const category = categories.find(c => c.id === posts[index].categoryId);
      if (category) {
        responsePost.category = category;
      }
    }
    
    res.json(responsePost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const posts = await getPosts();
    const index = posts.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Post not found' });
    
    posts.splice(index, 1);
    await savePosts(posts);
    
    // Also delete related comments
    const comments = await getComments();
    const filteredComments = comments.filter(c => c.postId !== req.params.id);
    await saveComments(filteredComments);
    
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const posts = await getPosts();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    post.likes = (post.likes || 0) + 1;
    await savePosts(posts);
    
    res.json({ likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMMENT ROUTES ====================

// Get comments for a post
app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const comments = await getComments();
    const postComments = comments
      .filter(c => c.postId === req.params.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(postComments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { content, author } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    
    const posts = await getPosts();
    const post = posts.find(p => p.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const newComment = {
      id: uuidv4(),
      postId: req.params.id,
      content,
      author: author || 'Anonymous',
      createdAt: new Date().toISOString()
    };
    
    const comments = await getComments();
    comments.push(newComment);
    await saveComments(comments);
    
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete comment
app.delete('/api/comments/:id', async (req, res) => {
  try {
    const comments = await getComments();
    const index = comments.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Comment not found' });
    
    comments.splice(index, 1);
    await saveComments(comments);
    
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATS & ARCHIVE ROUTES ====================

// Get blog stats
app.get('/api/stats', async (req, res) => {
  try {
    const posts = await getPosts();
    const comments = await getComments();
    const users = await getUsers();
    
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    
    // Get all unique tags
    const allTags = posts.flatMap(p => p.tags || []);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
    
    // Archive by month
    const archive = posts.reduce((acc, post) => {
      const date = new Date(post.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      totalPosts: posts.length,
      totalComments: comments.length,
      totalUsers: users.length,
      totalViews,
      totalLikes,
      tags: tagCounts,
      archive
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get archive data (with optional date filtering)
app.get('/api/archive', async (req, res) => {
  try {
    const { year, month, day } = req.query;
    const posts = await getPosts();
    const archive = {};
    
    posts.forEach(post => {
      const date = new Date(post.createdAt);
      const postYear = date.getFullYear();
      const postMonth = String(date.getMonth() + 1).padStart(2, '0');
      const postDay = String(date.getDate()).padStart(2, '0');
      
      // 筛选逻辑
      if (year && parseInt(year) !== postYear) return;
      if (month && parseInt(month) !== parseInt(postMonth)) return;
      if (day && parseInt(day) !== parseInt(postDay)) return;
      
      const yearKey = String(postYear);
      const monthKey = postMonth;
      
      if (!archive[yearKey]) archive[yearKey] = {};
      if (!archive[yearKey][monthKey]) archive[yearKey][monthKey] = [];
      
      archive[yearKey][monthKey].push({
        id: post.id,
        title: post.title,
        createdAt: post.createdAt
      });
    });
    
    res.json(archive);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RSS FEED ====================

app.get('/api/rss', async (req, res) => {
  try {
    const posts = await getPosts();
    const publishedPosts = posts
      .filter(p => p.status !== 'draft')
      .slice(0, 20);
    
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Dev Blog</title>
    <link>http://localhost:3000</link>
    <description>A geek-style blog built with React and Node.js</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${publishedPosts.map(post => `
    <item>
      <title>${post.title}</title>
      <link>http://localhost:3000/post/${post.id}</link>
      <guid>http://localhost:3000/post/${post.id}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <author>${post.author}</author>
      <description><![CDATA[${post.content.substring(0, 200)}...]]></description>
    </item>
    `).join('')}
  </channel>
</rss>`;
    
    res.set('Content-Type', 'application/rss+xml');
    res.send(rss);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    storage: useRedis ? 'redis' : 'memory',
    cache: {
      enabled: true,
      size: cache.size,
      defaultTTL: DEFAULT_TTL / 1000 + 's'
    },
    timestamp: new Date().toISOString() 
  });
});

// Cache status API
app.get('/api/cache/status', (req, res) => {
  const stats = [];
  for (const [key, item] of cache.entries()) {
    stats.push({
      key,
      expiresAt: new Date(item.expiresAt).toISOString(),
      ttlRemaining: Math.max(0, Math.round((item.expiresAt - Date.now()) / 1000)) + 's'
    });
  }
  res.json({
    size: cache.size,
    defaultTTL: DEFAULT_TTL / 1000 + 's',
    items: stats
  });
});

// Clear cache API (admin only)
app.delete('/api/cache', requireAdmin, (req, res) => {
  const { key } = req.query;
  if (key) {
    const deleted = clearCache(key);
    res.json({ message: deleted ? `Cache key '${key}' cleared` : `Cache key '${key}' not found` });
  } else {
    clearAllCache();
    res.json({ message: 'All cache cleared' });
  }
});

// Error handling
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 5MB)' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Initialize default admin user
async function initAdminUser() {
  const users = await getUsers();
  const adminExists = users.find(u => u.username === 'admin');
  
  if (!adminExists) {
    const adminUser = {
      id: uuidv4(),
      username: 'admin',
      password: hashPassword('admin123'),
      displayName: 'Master',
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    users.push(adminUser);
    await saveUsers(users);
    console.log('✅ Admin user created: username=admin, password=admin123');
  }
}

// Start server
async function startServer() {
  await connectRedis();
  await initAdminUser();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`💾 Storage: ${useRedis ? 'Redis' : 'Memory'}`);
    console.log(`📸 Image uploads enabled`);
    console.log(`🔐 Auth system enabled`);
    console.log(`💬 Comments enabled`);
    console.log(`📊 Stats & Archive enabled`);
    console.log(`📡 RSS feed: /api/rss`);
    console.log(`👤 Default admin: admin / admin123`);
  });
}

startServer();
