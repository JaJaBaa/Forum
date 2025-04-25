import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../contexts/AuthContext";

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  async function fetchPost() {
    try {
      const { data, error } = await supabase
        .from("forum_post")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error("Error fetching post:", error);
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments() {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }

  async function handleUpvote() {
    try {
      const { data, error } = await supabase
        .from("forum_post")
        .update({ upvotes: (post.upvotes || 0) + 1 })
        .eq("id", id)
        .select();

      if (error) throw error;
      setPost(data[0]);
    } catch (error) {
      console.error("Error upvoting post:", error);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!newComment.trim()) return;

    try {
      const { error } = await supabase.from("comments").insert([
        {
          post_id: id,
          content: newComment.trim(),
          author_id: user.id,
        },
      ]);

      if (error) throw error;

      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase
        .from("forum_post")
        .delete()
        .eq("id", id)
        .eq("author_id", user.id);

      if (error) throw error;
      navigate("/");
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div className="post-detail">
      <h1>{post.title}</h1>

      <div className="post-meta">
        <span>Posted {formatDistanceToNow(new Date(post.created_at))} ago</span>
        <span>⬆️ {post.upvotes || 0} upvotes</span>
      </div>

      {post.image_url && (
        <img src={post.image_url} alt={post.title} className="post-image" />
      )}

      <p className="post-content">{post.content}</p>

      <div className="post-actions">
        <button onClick={handleUpvote}>⬆️ Upvote</button>

        {user && post.author_id === user.id && (
          <>
            <Link to={`/edit/${id}`} className="edit-button">
              Edit Post
            </Link>
            <button onClick={handleDelete} className="delete-button">
              Delete Post
            </button>
          </>
        )}
      </div>

      <div className="comments-section">
        <h2>Comments</h2>

        <form onSubmit={handleAddComment} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Add a comment..." : "Please login to comment"}
            required
            disabled={!user}
          />
          <button type="submit" disabled={!user}>
            Add Comment
          </button>
        </form>

        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment">
              <p>{comment.content}</p>
              <span className="comment-meta">
                {formatDistanceToNow(new Date(comment.created_at))} ago
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PostDetail;
