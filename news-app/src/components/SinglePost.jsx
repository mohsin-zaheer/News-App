import React, { useEffect, useMemo } from 'react';
import styles from '../stylesheets/post.module.css';
import postImg from '../assets/postImg.png';
import { Icon } from '@iconify/react';
import { useNewsStore } from '../store/useNewsStore';
import { useParams, Link } from 'react-router-dom';
import t from '../assets/t.png';
import ad1 from '../assets/ad1.png';
import ad2 from '../assets/ad2.png';
import toast, { Toaster } from 'react-hot-toast';
import { useBlogPosts } from '../store/useBlogPosts';

const SinglePost = () => {
  const { id } = useParams();

  const articles = useNewsStore((s) => s.articles);
  const newPosts = useNewsStore((s) => s.newPosts);
  const fetchArticleById = useNewsStore((s) => s.fetchArticleById);
  const fetchAllIfNeeded = useNewsStore((s) => s.fetchAllIfNeeded);
  const addPostToSave = useNewsStore((s) => s.addPostToSave);
  const removePostFromSave = useNewsStore((s) => s.removePostFromSave);
  const loading = useNewsStore((s) => s.loading);

  const { fetchPostByID } = useBlogPosts();

  useEffect(() => {
    fetchAllIfNeeded();
  }, [fetchAllIfNeeded]);

  // Try news store first, then blog posts
  const article = useMemo(() => {
    if (!id) return null;

    const found = fetchArticleById(id);
    if (found) return found;

    const blogPost = fetchPostByID(id);
    if (blogPost) {
      return {
        id: blogPost.id,
        title: blogPost.title,
        description: blogPost.description,
        image_url: blogPost.coverImage,
        pubDate: blogPost.date,
        author: blogPost.authorName,
        category: 'Blog',
        link: blogPost.link,
        creator: blogPost.authorName,
        authorImage: blogPost.authorImage
      };
    }

    return null;
  }, [id, fetchArticleById, fetchPostByID]);

  // Handle loading & not found
  if (loading) {
    return (
      <div className="container">
        <div className={styles.postContainer}><p>Loading…</p></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container">
        <div className={styles.postContainer}><p>Post not found.</p></div>
      </div>
    );
  }

  const savedSelector = useMemo(() => {
    const key = article?.id ?? article?.link ?? '';
    return (s) => (key ? s.isSaved(key) : false);
  }, [article?.id, article?.link]);

  const isSaved = useNewsStore(savedSelector);

  const onToggleSave = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const key = article?.id ?? article?.link;
    if (!key) return;

    if (isSaved) {
      const removed = removePostFromSave(key);
      if (removed) toast('Removed from saved', { icon: '🗑️' });
    } else {
      const added = addPostToSave(article);
      if (added) toast.success('Post saved!');
    }
  };

  return (
    <div className="container">
      <div className={styles.postContainer}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <a href="/" className={styles.breadcrumbItem}>Home</a>
          <Icon icon="material-symbols-light:keyboard-arrow-right" className={styles.breadcrumbIcon} />
          <a href="/featured" className={styles.breadcrumbItem}>Featured</a>
          <Icon icon="material-symbols-light:keyboard-arrow-right" className={styles.breadcrumbIcon} />
          <span className={styles.active}>{article.title || 'Post'}</span>
        </div>

        <div className="row">
          {/* Main Content */}
          <div className="col-9">
            <div className={styles.postBg}>
              <div className={styles.postTitleBg}>
                <h2 className={styles.title}>{article.title}</h2>
                <img
                  src={article.image_url || postImg}
                  alt={article.title || 'post image'}
                  className={styles.postImg}
                />
              </div>

              <div className={styles.spacer}></div>

              <div className={styles.postMeta}>
                <div className={styles.meta}>
                  <Icon icon="uit:calender" className={styles.metaIcon} />
                  {new Date(article.pubDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className={styles.meta}>
                  <Icon icon="solar:user-outline" className={styles.metaIcon} />
                  {article.author || 'Unknown Author'}
                </div>
                <div className={styles.meta}>
                  <Icon icon="solar:file-linear" className={styles.metaIcon} />
                  Category : {article.category}
                </div>
              </div>

              <div className={styles.postDescription}>
                {article.description || 'No description available.'}
                {article.link && (
                  <>
                    <br /><br />
                    <a href={article.link} target="_blank" rel="noreferrer">Read original source</a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-3">
            <div className={styles.sidebar}>
              <div className={styles.btnsBg}>
                <button className={styles.pbtn}>
                  <Icon icon="bitcoin-icons:share-outline" className={styles.pIcon} />
                  Share
                </button>
                <button className={styles.pbtn} onClick={onToggleSave}>
                  <Icon icon={isSaved ? 'stash:save-ribbon' : 'akar-icons:ribbon'} className={styles.pIcon} />
                  {isSaved ? 'Unsave' : 'Save'}
                </button>
              </div>

              <div className={styles.authorBg}>
                <h2 className={styles.stitle}>
                  <img src={t} alt="" className={styles.t} />
                  Author
                </h2>
                <div className={styles.author}>
                  <img
                    src={ article.authorImage ? article.authorImage : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          article.creator || 'Unknown'
                        )}&background=random`}
                    alt="Author"
                    className={styles.authorImg}
                  />
                  <h3 className={styles.authorName}>{article.author || 'Unknown Author'}</h3>
                </div>
              </div>

              {article.keywords && article.keywords.length > 0 && (
                <div className={styles.tagsBg}>
                  <h2 className={styles.stitle}>
                    <img src={t} alt="" className={styles.t} />
                    Tags
                  </h2>
                  <div className={styles.tagBg}>
                    {article.keywords.map((keyword, index) => (
                      <div key={index} className={styles.tag}>{keyword}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.tagsBg}>
                <h2 className={styles.stitle}>
                  <img src={t} alt="" className={styles.t} />
                  Top Posts
                </h2>
                <div className={`${styles.newPosts} row mt-4`}>
                  {newPosts.map((article, index) => (
                    <div className="col-lg-12" key={index}>
                      <Link to={`/posts/${article.article_id}`} className={styles.newPostCard}>
                        <div className={styles.postImgBg}>
                          <img src={article.image_url} alt="Article" className={styles.newPostImg} />
                        </div>
                        <div className={styles.newPostCardInner}>
                          <h3 className={styles.postTitle}>{article.title}</h3>
                          <h6 className={styles.aName}>{article.creator || 'Unknown Author'}</h6>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.ads}>
                <img src={ad1} alt="" className={styles.ad1} />
                <img src={ad2} alt="" className={styles.ad2} />
              </div>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        <div className={styles.relatedPosts}>
          <h2 className={styles.stitle}>
            <img src={t} alt="" className={styles.t} />
            related posts
          </h2>
          <div className="row">
            {articles?.map((article, index) => (
              <div className="col-lg-3" key={index}>
                <Link className={styles.postCard} to={`/posts/${article.id}`}>
                  <img src={article.image_url} alt="Article" className={styles.articleImg} />
                  <h3 className={styles.postTitle}>{article.title}</h3>
                  <p className={styles.pContent}>
                    {article.description || article.content || 'No description available.'}
                  </p>
                  <div className={styles.pauthorBg}>
                    <div className={styles.pauthor}>
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(article.creator || 'Unknown')}&background=random`}
                        alt="Author"
                        className={styles.pauthorImg}
                      />
                      <div className={styles.authorInfo}>
                        <h6 className={styles.aName}>{article.creator || 'Unknown Author'}</h6>
                        <p className={styles.pDate}>
                          {new Date(article.pubDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <Icon icon="akar-icons:ribbon" className={styles.saveIco} />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default SinglePost;
