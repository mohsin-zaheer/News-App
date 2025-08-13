import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../stylesheets/post.module.css';
import { Icon } from '@iconify/react';
import t from '../assets/t.png';
import { useBlogPosts } from '../store/useBlogPosts';

const getNumber = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
const toDate = (d) => (d ? new Date(d) : null);

const Blogs = () => {
  const [view, setView] = useState('grid');
  const [activeFilter, setActiveFilter] = useState('new'); // 'new' | 'trendy' | 'popular' | 'top'

  const { posts, berror, bloading, fetchPosts } = useBlogPosts();

  useEffect(() => { fetchPosts({ number: 200 }); }, [fetchPosts]);

  // Compute engagement metrics with robust fallbacks
  const scoredPosts = useMemo(() => {
    const now = Date.now();

    const enriched = posts.map((article) => {
      const date =
        article.date ||
        article.publishedAt ||
        article.created_at ||
        article.publishDate ||
        article.modified ||
        null;

      const publishedAt = toDate(date);
      const ageMs = publishedAt ? Math.max(0, now - publishedAt.getTime()) : Number.POSITIVE_INFINITY;
      const ageHours = Number.isFinite(ageMs) ? Math.max(1, ageMs / 36e5) : 1; // avoid /0

      // Fallback-friendly field picks
      const likes =
        getNumber(article.likeCount) ||
        getNumber(article.likes) 
      const comments =
        getNumber(article.commentCount) ||
        getNumber(article.comments) 
      const views =
        getNumber(article.viewCount) ||
        getNumber(article.views) 

      // Total engagement (tune weights if you like)
      const engagement = likes + comments * 2 + views * 0.1;

      // Trend velocity: engagement per sqrt(hours) (damp early spikes but still favor momentum)
      const trendyScore = engagement / Math.sqrt(ageHours);

      // Popularity: raw engagement
      const popularScore = engagement;

      // Time-decayed top score (30-day half-life-ish via exp decay)
      const ageDays = Number.isFinite(ageMs) ? ageMs / 8.64e7 : 365;
      const decay = Math.exp(-ageDays / 30);
      const topScore = (popularScore * 0.6 + trendyScore * 0.4) * (0.5 + 0.5 * decay);

      return {
        ...article,
        __metrics: {
          publishedAt,
          likes,
          comments,
          views,
          engagement,
          trendyScore,
          popularScore,
          topScore,
        },
      };
    });

    // Normalize optional (handy if you want badges later)
    const max = (key) => Math.max(1, ...enriched.map((p) => p.__metrics[key] || 0));
    const maxPopular = max('popularScore');
    const maxTrendy = max('trendyScore');
    const maxTop = max('topScore');

    return enriched.map((p) => ({
      ...p,
      __metrics: {
        ...p.__metrics,
        popularNorm: p.__metrics.popularScore / maxPopular,
        trendyNorm: p.__metrics.trendyScore / maxTrendy,
        topNorm: p.__metrics.topScore / maxTop,
      },
    }));
  }, [posts]);

  const sortedPosts = useMemo(() => {
    const copy = [...scoredPosts];
    switch (activeFilter) {
      case 'new':
        return copy.sort((a, b) => {
          const ad = a.__metrics.publishedAt ? a.__metrics.publishedAt.getTime() : 0;
          const bd = b.__metrics.publishedAt ? b.__metrics.publishedAt.getTime() : 0;
          return bd - ad; // newest first
        });
      case 'trendy':
        return copy.sort((a, b) => b.__metrics.trendyScore - a.__metrics.trendyScore);
      case 'popular':
        return copy.sort((a, b) => b.__metrics.popularScore - a.__metrics.popularScore);
      case 'top':
        return copy.sort((a, b) => b.__metrics.topScore - a.__metrics.topScore);
      default:
        return copy;
    }
  }, [scoredPosts, activeFilter]);

  const FilterChip = ({ id, label }) => (
    <div
      className={styles.cFilter}
      style={{ color: activeFilter === id ? '#F81539' : undefined, cursor: 'pointer' }}
      onClick={() => setActiveFilter(id)}
    >
      {label}
    </div>
  );

  const renderGridCard = (article, index) => (
    <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={article.id || index}>
      <Link className={styles.postCard} to={`/posts/${article.id}`}>
        {article.coverImage && (
          <img
            src={article.coverImage}
            alt={article.title || 'Article'}
            className={styles.articleImg}
          />
        )}
        <h3 className={styles.postTitle}>{article.title}</h3>
        <p className={styles.pContent}>{article.description || 'No description available.'}</p>

        <div className={styles.pauthorBg}>
          <div className={styles.pauthor}>
            <img
              src={
                article.authorImage
                  ? article.authorImage
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      article.authorName || 'Unknown'
                    )}&background=random`
              }
              alt="Author"
              className={styles.pauthorImg}
            />
            <div className={styles.authorInfo}>
              <h6 className={styles.aName}>{article.authorName || 'Unknown Author'}</h6>
              <p className={styles.pDate}>
                {article.date
                  ? new Date(article.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>
          <Icon icon="akar-icons:ribbon" className={styles.saveIco} />
        </div>
      </Link>
    </div>
  );

  const renderListRow = (article, index) => (
    <div className="col-12" key={article.id || index}>
      <Link
        to={`/posts/${article.id}`}
        className={styles.postCard}
        style={{
          display: 'flex',
          gap: '16px',
          padding: '16px',
          alignItems: 'stretch',
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            flex: '0 0 220px',
            maxWidth: '220px',
            background: '#f6f6f6',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt={article.title || 'Article'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '16/9' }}
            />
          ) : (
            <div style={{ width: '100%', paddingTop: '56.25%' }} />
          )}
        </div>

        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <h3 className={styles.postTitle} style={{ marginBottom: 8 }}>
            {article.title}
          </h3>
          <p className={styles.pContent} style={{ marginBottom: 12 }}>
            {article.description || 'No description available.'}
          </p>

          <div
            className={styles.pauthorBg}
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className={styles.pauthor}>
              <img
                src={
                  article.authorImage
                    ? article.authorImage
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        article.authorName || 'Unknown'
                      )}&background=random`
                }
                alt="Author"
                className={styles.pauthorImg}
              />
              <div className={styles.authorInfo}>
                <h6 className={styles.aName}>{article.authorName || 'Unknown Author'}</h6>
                <p className={styles.pDate}>
                  {article.date
                    ? new Date(article.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
            </div>
            <Icon icon="akar-icons:ribbon" className={styles.saveIco} />
          </div>
        </div>
      </Link>
      <hr style={{ margin: '16px 0', opacity: 0.15 }} />
    </div>
  );

  return (
    <div className={styles.CategoryBg}>
      <div className="container">
        <div className={styles.breadcrumb}>
          <Link to="/" className={styles.breadcrumbItem}>
            Home
          </Link>
          <Icon icon="material-symbols-light:keyboard-arrow-right" className={styles.breadcrumbIcon} />
          <span className={styles.breadcrumbItem}>Blog Posts</span>
        </div>

        <div className={styles.filter}>
          <div className={styles.filters}>
            <FilterChip id="new" label="new" />
            <FilterChip id="trendy" label="trendy" />
            <FilterChip id="popular" label="popular" />
            <FilterChip id="top" label="top" />
          </div>

          <div className={styles.sort}>
            <Icon
              icon="pepicons-print:list"
              className={styles.sortIcon}
              style={{ opacity: view === 'list' ? 1 : 0.5, cursor: 'pointer' }}
              onClick={() => setView('list')}
            />
            <Icon
              icon="pepicons-print:grid"
              className={styles.sortIcon}
              style={{ opacity: view === 'grid' ? 1 : 0.5, cursor: 'pointer' }}
              onClick={() => setView('grid')}
            />
          </div>
        </div>

        <div className={styles.categoryPosts}>
          <h2 className={styles.stitle}>
            <img src={t} alt="" className={styles.t} />
            Blog Posts
          </h2>

          {berror && <p style={{ color: 'red' }}>{String(berror)}</p>}
          {bloading && <p>Loading…</p>}
          {!bloading && sortedPosts.length === 0 && <p>No posts found.</p>}

          <div className="row">
            {view === 'grid'
              ? sortedPosts.map((article, index) => renderGridCard(article, index))
              : sortedPosts.map((article, index) => renderListRow(article, index))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blogs;
