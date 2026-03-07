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

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// 静态文件服务
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadsDir));

// 文件上传路由
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('Upload received:', req.file);
  res.json({ success: true, fileUrl: `/uploads/${req.file.filename}` });
});

// 获取已上传文件列表
app.get('/files', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read files' });
      return;
    }
    res.json({ files: files.map(file => ({
      name: file,
      url: `/uploads/${file}`
    })) });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});