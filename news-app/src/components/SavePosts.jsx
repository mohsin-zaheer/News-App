import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../stylesheets/post.module.css';
import { Icon } from '@iconify/react';
import t from '../assets/t.png';
import { useNewsStore } from '../store/useNewsStore';

const SavePosts = () => {
  const [view, setView] = useState('grid');

  const savedPosts = useNewsStore((s) => s.savedPosts);
  const loading = useNewsStore((s) => s.loading);
  const error = useNewsStore((s) => s.error);

  const posts = savedPosts ?? [];

  const renderGridCard = (article, index) => (
    <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={article?.id ?? article?.link ?? index}>
      <Link className={styles.postCard} to={`/posts/${article?.id ?? ''}`}>
        {article?.image_url && (
          <img
            src={article.image_url}
            alt={article?.title || 'Article'}
            className={styles.articleImg}
          />
        )}
        <h3 className={styles.postTitle}>{article?.title}</h3>
        <p className={styles.pContent}>{article?.description || 'No description available.'}</p>

        <div className={styles.pauthorBg}>
          <div className={styles.pauthor}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                article?.author || 'Unknown'
              )}&background=random`}
              alt="Author"
              className={styles.pauthorImg}
            />
            <div className={styles.authorInfo}>
              <h6 className={styles.aName}>{article?.author || 'Unknown Author'}</h6>
              <p className={styles.pDate}>
                {article?.pubDate
                  ? new Date(article.pubDate).toLocaleDateString('en-US', {
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
    <div className="col-12" key={article?.id ?? article?.link ?? index}>
      <Link
        to={`/posts/${article?.id ?? ''}`}
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
          {article?.image_url ? (
            <img
              src={article.image_url}
              alt={article?.title || 'Article'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '16/9' }}
            />
          ) : (
            <div style={{ width: '100%', paddingTop: '56.25%' }} />
          )}
        </div>

        <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <h3 className={styles.postTitle} style={{ marginBottom: 8 }}>
            {article?.title}
          </h3>
          <p className={styles.pContent} style={{ marginBottom: 12 }}>
            {article?.description || 'No description available.'}
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
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  article?.author || 'Unknown'
                )}&background=random`}
                alt="Author"
                className={styles.pauthorImg}
              />
              <div className={styles.authorInfo}>
                <h6 className={styles.aName}>{article?.author || 'Unknown Author'}</h6>
                <p className={styles.pDate}>
                  {article?.pubDate
                    ? new Date(article.pubDate).toLocaleDateString('en-US', {
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
          <span className={styles.active}>Saved Posts</span>
        </div>

        <div className={styles.filter}>
          <div className={styles.filters}>
            <div className={styles.cFilter} style={{ color: '#F81539' }}>new</div>
            <div className={styles.cFilter}>trendy</div>
            <div className={styles.cFilter}>popular</div>
            <div className={styles.cFilter}>top</div>
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
            Saved posts
          </h2>

          {error && <p style={{ color: 'red' }}>{error}</p>}
          {loading && <p>Loading…</p>}
          {!loading && posts.length === 0 && <p>No posts found.</p>}

          <div className="row">
            {view === 'grid'
              ? posts.map((article, index) => renderGridCard(article, index))
              : posts.map((article, index) => renderListRow(article, index))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavePosts;
