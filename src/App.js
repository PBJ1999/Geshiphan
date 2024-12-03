import React, { useState, useEffect } from 'react';
import './App.css';



// 게시글 목록을 가져오는 함수
const fetchPosts = async () => {
  const response = await fetch('http://localhost:5000/api/posts');
  const data = await response.json();
  return data;
};

// 게시글 작성 함수
const createPost = async (title, content, author) => {
  const response = await fetch('http://localhost:5000/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content, author }),
  });
  const data = await response.json();
  return data;
};

// 게시글 수정 함수
const editPost = async (id, title, content) => {
  const response = await fetch(`http://localhost:5000/api/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content }),
  });
  const data = await response.json();
  return data;
};

// 게시글 삭제 함수
const deletePost = async (id) => {
  const response = await fetch(`http://localhost:5000/api/posts/${id}`, {
    method: 'DELETE',
  });
  if (response.ok) {
    return id;
  }
  throw new Error('Error deleting post');
};

// 댓글 추가 함수
const addComment = async (postId, comment) => {
  const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  });
  const data = await response.json();
  return data;
};

// 댓글 가져오기 함수
const fetchComments = async (postId) => {
  const response = await fetch(`http://localhost:5000/api/posts/${postId}/comments`);
  const data = await response.json();
  return data;
};

function App() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');

  // 게시글 목록 가져오기
  useEffect(() => {
    const getPosts = async () => {
      const fetchedPosts = await fetchPosts();
      setPosts(fetchedPosts);
    };
    getPosts();
  }, []);

  // 게시글 작성
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !author) {
      alert("제목, 내용, 작성자는 필수 항목입니다.");
      return;
    }
    const newPost = await createPost(title, content, author);
    setPosts([newPost, ...posts]);
    setTitle('');
    setContent('');
    setAuthor('');
  };

  // 게시글 수정
  const handleEditPost = (post) => {
    setTitle(post.title);
    setContent(post.content);
    setAuthor(post.author);
    const handleSubmitEdit = async (e) => {
      e.preventDefault();
      if (!title || !content) return;
      await editPost(post.id, title, content);
      const updatedPosts = posts.map((p) =>
        p.id === post.id ? { ...p, title, content } : p
      );
      setPosts(updatedPosts);
      setTitle('');
      setContent('');
    };

    return (
      <form onSubmit={handleSubmitEdit}>
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
        <button type="submit">게시글 수정</button>
      </form>
    );
  };

  // 게시글 삭제
  const handleDeletePost = async (id) => {
    try {
      await deletePost(id);
      setPosts(posts.filter((post) => post.id !== id)); // 상태에서 삭제된 게시글 제거
    } catch (error) {
      console.error('삭제 중 오류 발생:', error);
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (postId) => {
    const comment = prompt('댓글을 입력하세요');
    if (comment) {
      await addComment(postId, comment);
      const updatedComments = await fetchComments(postId);
      setPosts(posts.map((post) =>
        post.id === postId ? { ...post, comments: updatedComments } : post
      ));
    }
  };

  return (
    <div className="App">
      <h1>게시판</h1>

      {/* 게시글 작성 폼 */}
      <form onSubmit={handlePostSubmit}>
        <input
          type="text"
          placeholder="작성자"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
        <button type="submit">게시글 작성</button>
      </form>

      {/* 게시글 목록 */}
      <div>
        {posts.map((post) => (
          <div key={post.id} className="post">
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <p><small>{new Date(post.created_at).toLocaleString()}</small></p>
            <button onClick={() => handleEditPost(post)}>수정</button>
            <button onClick={() => handleDeletePost(post.id)}>삭제</button>

            {/* 댓글 표시 */}
            <div>
              <button onClick={() => handleCommentSubmit(post.id)}>댓글 추가</button>
              {post.comments && post.comments.map((comment, idx) => (
                <p key={idx}>{comment.comment}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
