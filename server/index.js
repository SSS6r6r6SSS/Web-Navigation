import express from 'express';
import cors from 'cors';
import Busboy from 'busboy';
import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Directories ───────────────────────────────────────────────────────────────
const dataDir    = path.join(__dirname, '../data');
const uploadsDir = path.join(__dirname, '../uploads');
for (const dir of [dataDir, uploadsDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── SQLite ────────────────────────────────────────────────────────────────────
const db = new Database(path.join(dataDir, 'navsite.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    icon        TEXT    DEFAULT '',
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS links (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    title       TEXT    NOT NULL,
    url         TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    icon        TEXT    DEFAULT '',
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS social_links (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    platform   TEXT    NOT NULL,
    url        TEXT    NOT NULL,
    icon       TEXT    DEFAULT '',
    color      TEXT    DEFAULT '#0288d1',
    sort_order INTEGER DEFAULT 0
  );
`);

// ─── Password ──────────────────────────────────────────────────────────────────
const PASSWORD_HASH = createHash('sha256').update('xiaobuawa').digest('hex').toLowerCase();
console.log(`[auth] password hash prefix: ${PASSWORD_HASH.slice(0, 8)}...`);

// ─── Default config ────────────────────────────────────────────────────────────
const defaults = {
  site_title:       '我的导航站',
  site_subtitle:    '简洁 · 高效 · 美观',
  site_icon:        '🧭',
  bg_image:         '',
  bg_overlay:       '0.3',
  hitokoto_enabled: 'true',
};
const insertCfg = db.prepare('INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)');
for (const [k, v] of Object.entries(defaults)) insertCfg.run(k, v);

// ─── Seed data ─────────────────────────────────────────────────────────────────
if (db.prepare('SELECT COUNT(*) as c FROM categories').get().c === 0) {
  const ic = db.prepare('INSERT INTO categories (name,description,icon,sort_order) VALUES (?,?,?,?)');
  const il = db.prepare('INSERT INTO links (category_id,title,url,description,icon,sort_order) VALUES (?,?,?,?,?,?)');
  const c1 = ic.run('🔍 搜索引擎','常用搜索工具','🔍',0);
  il.run(c1.lastInsertRowid,'Google','https://google.com','全球最大搜索引擎','🌐',0);
  il.run(c1.lastInsertRowid,'百度','https://baidu.com','中文搜索引擎','🔎',1);
  il.run(c1.lastInsertRowid,'Bing','https://bing.com','微软必应搜索','🔵',2);
  const c2 = ic.run('🛠️ 开发工具','开发者常用工具','🛠️',1);
  il.run(c2.lastInsertRowid,'GitHub','https://github.com','代码托管平台','🐙',0);
  il.run(c2.lastInsertRowid,'Stack Overflow','https://stackoverflow.com','开发者问答社区','📚',1);
  il.run(c2.lastInsertRowid,'MDN Web Docs','https://developer.mozilla.org','Web 开发文档','📖',2);
  const c3 = ic.run('🎨 设计资源','设计工具与素材','🎨',2);
  il.run(c3.lastInsertRowid,'Figma','https://figma.com','在线设计工具','🎯',0);
  il.run(c3.lastInsertRowid,'Unsplash','https://unsplash.com','免费高清图片','📷',1);
}
if (db.prepare('SELECT COUNT(*) as c FROM social_links').get().c === 0) {
  const is = db.prepare('INSERT INTO social_links (platform,url,icon,color,sort_order) VALUES (?,?,?,?,?)');
  is.run('GitHub','https://github.com','github','#333333',0);
  is.run('Twitter','https://twitter.com','twitter','#1DA1F2',1);
  is.run('Bilibili','https://bilibili.com','bilibili','#FB7299',2);
}

// ─── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));
app.options('/{*splat}', cors());

// ─── Auth helper ───────────────────────────────────────────────────────────────
function getToken(req) {
  const auth = req.headers['authorization'] || '';
  return (auth.startsWith('Bearer ') ? auth.slice(7) : auth).toLowerCase().trim();
}
function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token || token !== PASSWORD_HASH) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }
  next();
}

// ════════════════════════════════════════════════════════════════════════════════
// UPLOAD ROUTE  ← 必须在 express.json() 之前注册，否则 body stream 会被消费
// ════════════════════════════════════════════════════════════════════════════════
app.post('/api/upload/bg', (req, res) => {
  // 1. 验证 token（只读 header，不碰 body）
  const token = getToken(req);
  console.log(`[upload] token_prefix=${token.slice(0,8)||'(empty)'}...`);
  console.log(`[upload] content-type: ${req.headers['content-type']}`);

  if (!token || token !== PASSWORD_HASH) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  // 2. 检查 Content-Type 是否为 multipart
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('multipart/form-data')) {
    console.error(`[upload] wrong content-type: ${ct}`);
    return res.status(400).json({ error: `Content-Type 必须是 multipart/form-data，收到: ${ct}` });
  }

  // 3. 用 busboy 直接解析原始 stream，完全绕开 express body-parser
  let bb;
  try {
    bb = Busboy({ headers: req.headers, limits: { fileSize: 20 * 1024 * 1024 } });
  } catch (e) {
    console.error('[upload] busboy init error:', e.message);
    return res.status(400).json({ error: '无法解析上传请求: ' + e.message });
  }

  let saved    = false;
  let filename = '';
  let savePath = '';
  let fileErr  = '';

  bb.on('file', (fieldname, fileStream, info) => {
    console.log(`[upload] field="${fieldname}" filename="${info.filename}" mime="${info.mimeType}"`);

    // 校验 MIME
    const allowedMime = /^image\/(jpeg|jpg|png|webp|gif|avif|svg\+xml)$/i;
    if (!allowedMime.test(info.mimeType)) {
      fileErr = `不支持的文件类型: ${info.mimeType}，仅支持 JPG/PNG/WebP/GIF/AVIF/SVG`;
      fileStream.resume(); // 必须消费掉 stream，否则 busboy 会挂起
      return;
    }

    const ext = path.extname(info.filename || '').toLowerCase() || '.jpg';
    filename  = `bg_${Date.now()}${ext}`;
    savePath  = path.join(uploadsDir, filename);

    const writeStream = fs.createWriteStream(savePath);
    fileStream.pipe(writeStream);

    fileStream.on('limit', () => {
      fileErr = '文件超过 20MB 限制';
      fileStream.resume();
      try { fs.unlinkSync(savePath); } catch {}
    });

    writeStream.on('finish', () => {
      if (!fileErr) saved = true;
      console.log(`[upload] write finish: saved=${saved} err=${fileErr}`);
    });

    writeStream.on('error', (e) => {
      fileErr = '文件写入失败: ' + e.message;
      console.error('[upload] write error:', e);
    });
  });

  bb.on('error', (e) => {
    console.error('[upload] busboy error:', e.message);
    if (!res.headersSent) res.status(400).json({ error: '解析上传数据失败: ' + e.message });
  });

  bb.on('finish', () => {
    console.log(`[upload] busboy finish: saved=${saved} fileErr=${fileErr}`);

    if (fileErr) {
      if (savePath && fs.existsSync(savePath)) { try { fs.unlinkSync(savePath); } catch {} }
      return res.status(400).json({ error: fileErr });
    }

    if (!saved) {
      return res.status(400).json({ error: '未收到图片文件，请确认上传字段名为 file，且已选择图片' });
    }

    // 删除旧背景图
    try {
      const prev = db.prepare("SELECT value FROM config WHERE key='bg_image'").get();
      if (prev?.value?.startsWith('/uploads/')) {
        const old = path.join(__dirname, '..', prev.value);
        if (fs.existsSync(old)) { fs.unlinkSync(old); console.log('[upload] deleted old:', old); }
      }
    } catch (e) { console.warn('[upload] cleanup warn:', e.message); }

    const publicUrl = `/uploads/${filename}`;
    console.log(`[upload] success → ${publicUrl}`);
    res.json({ url: publicUrl });
  });

  // 4. 把 req stream pipe 到 busboy
  req.pipe(bb);
});

// ─── Body parsers（在上传路由之后注册）────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ════════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// Health
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Auth
app.post('/api/auth/login', (req, res) => {
  try {
    const { password, passwordHash } = req.body;
    let inputHash = '';
    if (password && typeof password === 'string') {
      inputHash = createHash('sha256').update(password.trim()).digest('hex').toLowerCase();
    } else if (passwordHash && typeof passwordHash === 'string') {
      inputHash = passwordHash.toLowerCase().trim();
    } else {
      return res.status(400).json({ success: false, error: '密码不能为空' });
    }
    console.log(`[login] input=${inputHash.slice(0,8)}... expect=${PASSWORD_HASH.slice(0,8)}... match=${inputHash===PASSWORD_HASH}`);
    if (inputHash === PASSWORD_HASH) return res.json({ success: true, token: PASSWORD_HASH });
    return res.status(401).json({ success: false, error: '密码错误' });
  } catch (e) {
    console.error('[login]', e);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.get('/api/auth/verify', requireAuth, (_req, res) => res.json({ success: true }));

// Config
app.get('/api/config', (_req, res) => {
  try {
    const rows = db.prepare('SELECT key,value FROM config').all();
    res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/config', requireAuth, (req, res) => {
  try {
    const upsert = db.prepare('INSERT OR REPLACE INTO config (key,value) VALUES (?,?)');
    db.transaction(data => { for (const [k,v] of Object.entries(data)) upsert.run(String(k), String(v)); })(req.body);
    const rows = db.prepare('SELECT key,value FROM config').all();
    res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Categories
app.get('/api/categories', (_req, res) => {
  try {
    const cats  = db.prepare('SELECT * FROM categories ORDER BY sort_order,id').all();
    const links = db.prepare('SELECT * FROM links ORDER BY sort_order,id').all();
    res.json(cats.map(c => ({ ...c, links: links.filter(l => l.category_id === c.id) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/categories', requireAuth, (req, res) => {
  try {
    const { name, description='', icon='', sort_order=0 } = req.body;
    if (!name) return res.status(400).json({ error: '分类名称不能为空' });
    const r = db.prepare('INSERT INTO categories (name,description,icon,sort_order) VALUES (?,?,?,?)').run(name,description,icon,Number(sort_order));
    res.json({ ...db.prepare('SELECT * FROM categories WHERE id=?').get(r.lastInsertRowid), links: [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/categories/:id', requireAuth, (req, res) => {
  try {
    const { name, description='', icon='', sort_order=0 } = req.body;
    if (!name) return res.status(400).json({ error: '分类名称不能为空' });
    db.prepare('UPDATE categories SET name=?,description=?,icon=?,sort_order=? WHERE id=?').run(name,description,icon,Number(sort_order),Number(req.params.id));
    const cat = db.prepare('SELECT * FROM categories WHERE id=?').get(Number(req.params.id));
    if (!cat) return res.status(404).json({ error: '分类不存在' });
    res.json(cat);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/categories/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM links WHERE category_id=?').run(Number(req.params.id));
    db.prepare('DELETE FROM categories WHERE id=?').run(Number(req.params.id));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Links
app.post('/api/links', requireAuth, (req, res) => {
  try {
    const { category_id, title, url, description='', icon='', sort_order=0 } = req.body;
    if (!title||!url) return res.status(400).json({ error: '标题和URL不能为空' });
    const r = db.prepare('INSERT INTO links (category_id,title,url,description,icon,sort_order) VALUES (?,?,?,?,?,?)').run(category_id?Number(category_id):null,title,url,description,icon,Number(sort_order));
    res.json(db.prepare('SELECT * FROM links WHERE id=?').get(r.lastInsertRowid));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/links/:id', requireAuth, (req, res) => {
  try {
    const { category_id, title, url, description='', icon='', sort_order=0 } = req.body;
    if (!title||!url) return res.status(400).json({ error: '标题和URL不能为空' });
    db.prepare('UPDATE links SET category_id=?,title=?,url=?,description=?,icon=?,sort_order=? WHERE id=?').run(category_id?Number(category_id):null,title,url,description,icon,Number(sort_order),Number(req.params.id));
    const link = db.prepare('SELECT * FROM links WHERE id=?').get(Number(req.params.id));
    if (!link) return res.status(404).json({ error: '链接不存在' });
    res.json(link);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/links/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM links WHERE id=?').run(Number(req.params.id));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Social links
app.get('/api/social', (_req, res) => {
  try { res.json(db.prepare('SELECT * FROM social_links ORDER BY sort_order,id').all()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/social', requireAuth, (req, res) => {
  try {
    const { platform, url, icon='', color='#0288d1', sort_order=0 } = req.body;
    if (!platform||!url) return res.status(400).json({ error: '平台和URL不能为空' });
    const r = db.prepare('INSERT INTO social_links (platform,url,icon,color,sort_order) VALUES (?,?,?,?,?)').run(platform,url,icon,color,Number(sort_order));
    res.json(db.prepare('SELECT * FROM social_links WHERE id=?').get(r.lastInsertRowid));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/social/:id', requireAuth, (req, res) => {
  try {
    const { platform, url, icon='', color='#0288d1', sort_order=0 } = req.body;
    if (!platform||!url) return res.status(400).json({ error: '平台和URL不能为空' });
    db.prepare('UPDATE social_links SET platform=?,url=?,icon=?,color=?,sort_order=? WHERE id=?').run(platform,url,icon,color,Number(sort_order),Number(req.params.id));
    const s = db.prepare('SELECT * FROM social_links WHERE id=?').get(Number(req.params.id));
    if (!s) return res.status(404).json({ error: '社交链接不存在' });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/social/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM social_links WHERE id=?').run(Number(req.params.id));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Hitokoto proxy
app.get('/api/hitokoto', async (_req, res) => {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch('https://v1.hitokoto.cn/?encode=json', { signal: ctrl.signal });
    clearTimeout(t);
    res.json(await r.json());
  } catch { res.json({ hitokoto: '每一天都是新的开始。', from: '佚名' }); }
});

// ════════════════════════════════════════════════════════════════════════════════
// STATIC FILES
// ════════════════════════════════════════════════════════════════════════════════
app.use('/uploads', express.static(uploadsDir));

const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) app.use(express.static(distPath));

app.get('/{*splat}', (_req, res) => {
  const idx = path.join(distPath, 'index.html');
  if (fs.existsSync(idx)) res.sendFile(idx);
  else res.status(404).send('Build not found. Run: npm run build');
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ NavSite running on http://0.0.0.0:${PORT}`);
  console.log(`📂 Data: ${dataDir}`);
  console.log(`🖼️  Uploads: ${uploadsDir}`);
  console.log(`🔒 Hash prefix: ${PASSWORD_HASH.slice(0,8)}...`);
});
