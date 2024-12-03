const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 5000;

// CORS 설정
app.use(cors());
app.use(express.json());

// SQLite 데이터베이스 연결
const db = new sqlite3.Database('./database.db');

// 테이블 생성 및 컬럼 추가
db.serialize(() => {
  // 기존 테이블에 author 컬럼을 추가 (필요시)
  db.run(`ALTER TABLE posts ADD COLUMN author TEXT NOT NULL DEFAULT 'Unknown'`);

  // 테이블이 없으면 새로 생성
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'Unknown',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 댓글 테이블 생성
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      comment TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id)
    )
  `);
});

// 게시글 작성 API
app.post('/api/posts', (req, res) => {
  const { title, content, author } = req.body;

  if (!title || !content || !author) {
    return res.status(400).send('Title, content, and author are required');
  }

  const stmt = db.prepare('INSERT INTO posts (title, content, author) VALUES (?, ?, ?)');
  stmt.run(title, content, author, function (err) {
    if (err) {
      console.error('Error saving post:', err);
      return res.status(500).send('Error saving post');
    }
    res.status(201).json({ id: this.lastID, title, content, author });
  });
  stmt.finalize();
});

// 게시글 목록 조회 API
app.get('/api/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error retrieving posts:', err);
      return res.status(500).send('Error retrieving posts');
    }
    res.json(rows);
  });
});

// 게시글 수정 API
app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, author } = req.body;

  if (!title || !content || !author) {
    return res.status(400).send('Title, content, and author are required');
  }

  const stmt = db.prepare('UPDATE posts SET title = ?, content = ?, author = ? WHERE id = ?');
  stmt.run(title, content, author, id, function (err) {
    if (err) {
      console.error('Error updating post:', err);
      return res.status(500).send('Error updating post');
    }
    if (this.changes === 0) {
      return res.status(404).send('Post not found');
    }
    res.status(200).json({ id, title, content, author });
  });
  stmt.finalize();
});

// 게시글 삭제 API
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;

  // 댓글 삭제
  const deleteCommentsStmt = db.prepare('DELETE FROM comments WHERE post_id = ?');
  deleteCommentsStmt.run(id, (err) => {
    if (err) {
      console.error('Error deleting comments:', err);
      return res.status(500).send('Error deleting comments');
    }

    // 게시글 삭제
    const deletePostStmt = db.prepare('DELETE FROM posts WHERE id = ?');
    deletePostStmt.run(id, function (err) {
      if (err) {
        console.error('Error deleting post:', err);
        return res.status(500).send('Error deleting post');
      }
      if (this.changes === 0) {
        return res.status(404).send('Post not found');
      }
      res.status(200).send('Post and associated comments deleted');
    });
    deletePostStmt.finalize();
  });
  deleteCommentsStmt.finalize();
});

// 댓글 추가 API
app.post('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const { comment, author } = req.body;

  if (!comment || !author) {
    return res.status(400).send('Comment and author are required');
  }

  const stmt = db.prepare('INSERT INTO comments (post_id, comment, author) VALUES (?, ?, ?)');
  stmt.run(id, comment, author, function (err) {
    if (err) {
      console.error('Error adding comment:', err);
      return res.status(500).send('Error adding comment');
    }
    res.status(201).json({ id: this.lastID, post_id: id, comment, author });
  });
  stmt.finalize();
});

// 댓글 조회 API
app.get('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;

  db.all('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC', [id], (err, rows) => {
    if (err) {
      console.error('Error retrieving comments:', err);
      return res.status(500).send('Error retrieving comments');
    }
    res.json(rows);
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
