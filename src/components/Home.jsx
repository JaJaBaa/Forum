import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../contexts/AuthContext";

function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState("created_at");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

  async function fetchPosts() {
    try {
      setLoading(true);
      let query = supabase.from("forum_post").select("*");

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query.order(sortBy, { ascending: false });

      if (error) throw error;
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  return (
    <div className="home-container">
      <div className="controls">
        <div className="sort-controls">
          <label>Sort by: </label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="created_at">Creation Time</option>
            <option value="upvotes">Upvotes</option>
          </select>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {loading ? (
        <div>Loading posts...</div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <Link to={`/post/${post.id}`} key={post.id} className="post-card">
              <div className="post-info">
                <h2>{post.title}</h2>
                <div className="post-meta">
                  <span>⬆️ {post.upvotes || 0}</span>
                  <span>
                    🕒 {formatDistanceToNow(new Date(post.created_at))} ago
                  </span>
                  {post.author_id === user?.id && (
                    <span className="author-badge">My Post</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
