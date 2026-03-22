const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// 确保 uploads 目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// 解码中文文件名的辅助函数
function decodeFilename(filename) {
  try {
    // 处理 UTF-8 被误解析为 Latin-1 的情况
    // 将字符串作为 Latin-1 转回原始字节，再作为 UTF-8 解码
    const buffer = Buffer.from(filename, 'latin1');
    const decoded = buffer.toString('utf8');
    // 如果解码后包含中文字符，返回解码结果
    if (/[\u4e00-\u9fa5]/.test(decoded)) {
      return decoded;
    }
    return filename;
  } catch (e) {
    return filename;
  }
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // 解码中文文件名
    const decodedName = decodeFilename(file.originalname);
    cb(null, decodedName);
  }
});

const upload = multer({ storage: storage });

// 根路径重定向到 pdf-viewer.html
app.get('/', (req, res) => {
  res.redirect('/pdf-viewer.html');
});

// 静态文件服务
app.use(express.static(__dirname, {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    }
  }
}));
app.use('/uploads', express.static(uploadsDir));
app.use('/node_modules/pdfjs-dist/cmaps', express.static(path.join(__dirname, 'node_modules', 'pdfjs-dist', 'cmaps')));
app.use('/node_modules/pdfjs-dist/standard_fonts', express.static(path.join(__dirname, 'node_modules', 'pdfjs-dist', 'standard_fonts')));
app.use('/node_modules/pdfjs-dist/wasm', express.static(path.join(__dirname, 'node_modules', 'pdfjs-dist', 'wasm')));
app.use('/node_modules/pdfjs-dist/icc', express.static(path.join(__dirname, 'node_modules', 'pdfjs-dist', 'iccs')));

// 文件上传路由
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('Upload received:', req.file);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ success: true, fileUrl: `/uploads/${req.file.filename}` });
});

// 获取已上传文件列表
app.get('/files', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read files' });
      return;
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({ files: files.map(file => ({
      name: decodeFilename(file),
      url: `/uploads/${file}`
    })) });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});