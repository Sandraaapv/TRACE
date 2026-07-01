'use client';

import { useState, useEffect } from 'react';
import { Search, Heart, Share2, MessageSquare, ChevronRight, Menu } from 'lucide-react';

export default function DecoyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [likes, setLikes] = useState(24);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    document.title = 'Home Gardening Tips';
    // Push an extra state so there is an entry to pop when back is clicked
    window.history.pushState(null, null, window.location.href);

    const handlePopState = () => {
      window.location.replace('/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleLike = () => {
    if (hasLiked) {
      setLikes(likes - 1);
      setHasLiked(false);
    } else {
      setLikes(likes + 1);
      setHasLiked(true);
    }
  };

  return (
    <div style={styles.page}>
      {/* Blog Top Bar */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🌱</span> GrowSpace
          </div>
          <nav style={styles.nav}>
            <a href="#" onClick={(e) => { e.preventDefault(); window.location.replace('/'); }} style={styles.navLink}>Hide</a>
            <a href="#" style={styles.navLink}>Vegetables</a>
            <a href="#" style={styles.navLink}>Houseplants</a>
            <a href="#" style={styles.navLink}>Design</a>
          </nav>
          <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
            <input
              type="text"
              placeholder="Search gardening tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchBtn}>
              <Search size={16} />
            </button>
          </form>
          <button style={styles.menuBtn}>
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={styles.main}>
        <article style={styles.article}>
          <div style={styles.articleHeader}>
            <span style={styles.category}>Urban Gardening</span>
            <h1 style={styles.title}>Gardening in Small Spaces: Soil, Sunlight, and Moisture Tips</h1>
            <div style={styles.authorMeta}>
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100"
                alt="Author"
                style={styles.authorAvatar}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div>
                <div style={styles.authorName}>Elena Rostova</div>
                <div style={styles.articleDate}>Published June 26, 2026 • 5 min read</div>
              </div>
            </div>
          </div>

          <div style={styles.heroImageWrapper}>
            <img
              src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80&w=1200"
              alt="Balcony garden with herbs"
              style={styles.heroImage}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="800" height="400" fill="%23d8c3a5"/><text x="400" y="200" font-family="sans-serif" font-size="24" fill="%232d423f" text-anchor="middle">Balcony Herb Garden Setup</text></svg>';
              }}
            />
          </div>

          <div style={styles.articleBody}>
            <p style={styles.paragraph}>
              You don’t need a sprawling backyard to experience the joy of growing your own plants.
              Whether you have a small apartment balcony, a tiny fire escape, or just a sunny windowsill,
              container gardening allows you to cultivate everything from fresh herbs to salad greens and even dwarf fruit trees.
            </p>

            <h2 style={styles.subheading}>1. Decoding Your Sunlight (The 6-Hour Rule)</h2>
            <p style={styles.paragraph}>
              Most vegetable crops and flowering plants require at least <strong>six hours of direct sunlight</strong> daily.
              Before purchasing seeds or starter plants, spend a weekend observing how light moves across your space.
              South and west-facing windows or balconies receive the most intense, long-lasting sunlight,
              making them ideal for tomatoes, peppers, and sun-loving herbs like basil and rosemary.
            </p>
            <p style={styles.paragraph}>
              If your space faces north or is heavily shaded by adjacent buildings, don't despair. You can still grow
              leafy greens (spinach, kale, lettuce) and root vegetables (radishes, carrots) which thrive in partial shade
              and require only three to four hours of light per day.
            </p>

            <h2 style={styles.subheading}>2. Selecting the Right Soil Matrix</h2>
            <p style={styles.paragraph}>
              Never fill your containers with regular garden soil or topsoil dug straight from the ground.
              Garden soil is too heavy, compacts easily in pots, and will suffocate your plants' roots.
              Instead, invest in a premium, organic <strong>potting mix</strong>. These mixes are soil-less blends typically
              composed of peat moss, pine bark, perlite, and vermiculite. They are lightweight, retain moisture well,
              and leave plenty of air spaces for root growth.
            </p>

            <h2 style={styles.subheading}>3. Watering: The Moisture Balance</h2>
            <p style={styles.paragraph}>
              Overwatering is the single most common cause of container plant failure. When roots sit in soggy soil,
              they are deprived of oxygen and begin to rot. Make sure every container you use has drainage holes in the bottom.
              To check if your plants need water, insert your index finger about an inch into the soil. If it feels dry,
              water thoroughly until you see it draining out the bottom. If it feels damp, wait a day or two.
            </p>
          </div>

          <div style={styles.socialInteractions}>
            <button
              onClick={handleLike}
              style={{
                ...styles.interactionBtn,
                color: hasLiked ? '#e63946' : 'var(--color-earth)',
              }}
            >
              <Heart size={20} fill={hasLiked ? '#e63946' : 'none'} />
              <span>{likes} Likes</span>
            </button>
            <button style={styles.interactionBtn}>
              <MessageSquare size={20} />
              <span>8 Comments</span>
            </button>
            <button style={styles.interactionBtn}>
              <Share2 size={20} />
              <span>Share</span>
            </button>
          </div>
        </article>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarWidget}>
            <h3 style={styles.widgetTitle}>Featured Guides</h3>
            <ul style={styles.widgetList}>
              <li style={styles.widgetListItem}>
                <a href="#" style={styles.widgetLink}>
                  <span>How to grow organic heirloom tomatoes in pots</span>
                  <ChevronRight size={16} />
                </a>
              </li>
              <li style={styles.widgetListItem}>
                <a href="#" style={styles.widgetLink}>
                  <span>5 easy houseplants that improve air quality</span>
                  <ChevronRight size={16} />
                </a>
              </li>
              <li style={styles.widgetListItem}>
                <a href="#" style={styles.widgetLink}>
                  <span>Understanding organic fertilizers and NPK ratios</span>
                  <ChevronRight size={16} />
                </a>
              </li>
            </ul>
          </div>

          <div style={styles.sidebarWidget}>
            <h3 style={styles.widgetTitle}>Weekly Newsletter</h3>
            <p style={styles.widgetText}>Get organic gardening guides, design inspiration, and plant care tips sent straight to your inbox.</p>
            <input type="email" placeholder="Your email address" style={styles.newsletterInput} />
            <button style={styles.newsletterBtn}>Subscribe</button>
          </div>
        </aside>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>© 2026 GrowSpace Lifestyle Blog. All rights reserved. Designed for plant enthusiasts.</p>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: '#FAF9F6',
    color: '#333333',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #eaeaea',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#2e7d32',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  logoIcon: {
    fontSize: '1.5rem',
  },
  nav: {
    display: 'flex',
    gap: '1.5rem',
  },
  navLink: {
    color: '#555555',
    fontWeight: '500',
    fontSize: '0.95rem',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderRadius: '20px',
    padding: '0.25rem 0.5rem 0.25rem 1rem',
  },
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    padding: '0.35rem 0',
    fontSize: '0.85rem',
    width: '180px',
    color: '#333333',
  },
  searchBtn: {
    background: 'none',
    border: 'none',
    color: '#555555',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    display: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  main: {
    maxWidth: '1200px',
    margin: '2rem auto',
    padding: '0 1.5rem',
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '2.5rem',
    flex: 1,
  },
  article: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '2.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #f0f0f0',
  },
  articleHeader: {
    marginBottom: '1.5rem',
  },
  category: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#2e7d32',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    display: 'inline-block',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: '1.25',
    marginBottom: '1rem',
  },
  authorMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  authorAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid #ddd',
  },
  authorName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#333',
  },
  articleDate: {
    fontSize: '0.8rem',
    color: '#777',
  },
  heroImageWrapper: {
    margin: '1.5rem -2.5rem 2rem -2.5rem',
  },
  heroImage: {
    width: '100%',
    height: '400px',
    objectFit: 'cover',
  },
  articleBody: {
    fontSize: '1.05rem',
    lineHeight: '1.8',
    color: '#2c3e50',
  },
  paragraph: {
    marginBottom: '1.5rem',
  },
  subheading: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#2e7d32',
    marginTop: '2rem',
    marginBottom: '1rem',
  },
  socialInteractions: {
    display: 'flex',
    gap: '1.5rem',
    borderTop: '1px solid #f0f0f0',
    paddingTop: '1.5rem',
    marginTop: '2rem',
  },
  interactionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: '#555555',
    fontWeight: '500',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  sidebarWidget: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.75rem',
    border: '1px solid #f0f0f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  widgetTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1a1a1a',
    borderBottom: '2px solid #eaeaea',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
  },
  widgetList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  widgetListItem: {
    borderBottom: '1px solid #f5f5f5',
    paddingBottom: '0.75rem',
  },
  widgetLink: {
    color: '#444444',
    fontSize: '0.9rem',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    lineHeight: '1.4',
    transition: 'color 0.2s',
  },
  widgetText: {
    fontSize: '0.85rem',
    color: '#666666',
    lineHeight: '1.5',
    marginBottom: '1rem',
  },
  newsletterInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '0.85rem',
    marginBottom: '0.75rem',
    outline: 'none',
  },
  newsletterBtn: {
    width: '100%',
    backgroundColor: '#2e7d32',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  footer: {
    borderTop: '1px solid #eaeaea',
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    textAlign: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: '0.85rem',
    color: '#777777',
    margin: 0,
  },
};
