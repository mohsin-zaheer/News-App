// useNewsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Article = {
  id?: string;
  title?: string;
  description?: string;
  image_url?: string;
  author?: string;
  pubDate?: string;
  link?: string;
  category?: string;
  keywords?: string[];
};

type VideoPost = {
  title: string;
  description: string;
  image_url?: string;
  video_url: string;
};

// ===== helper (put near requestJSON/normalizeArticle) =====
type SearchOpts = {
  mode?: 'q' | 'qInTitle' | 'qInMeta';
  language?: string;      // e.g., 'en'
  country?: string;       // e.g., 'us'
  category?: string;      // e.g., 'technology'
  domains?: string;       // comma-separated (max 5)
  from_date?: string;     // 'YYYY-MM-DD' or ISO8601
  to_date?: string;       // 'YYYY-MM-DD' or ISO8601
  maxPages?: number;      // default 3
};
function buildNewsSearchURL(query: string, opts: SearchOpts = {}): string {
  const url = new URL('https://newsdata.io/api/1/news');
  url.searchParams.set('apikey', NEWSDATA_API_KEY);
  const key = opts.mode ?? 'q'; // 'q' | 'qInTitle' | 'qInMeta'
  url.searchParams.set(key, query);

  if (opts.language) url.searchParams.set('language', opts.language);
  if (opts.country)  url.searchParams.set('country', opts.country);
  if (opts.category) url.searchParams.set('category', opts.category);
  if (opts.domains)  url.searchParams.set('domain', opts.domains);
  if (opts.from_date) url.searchParams.set('from_date', opts.from_date);
  if (opts.to_date)   url.searchParams.set('to_date', opts.to_date);

  return url.toString();
}


type NewsState = {
  articles: Article[];
  newPosts: Article[];
  videoPosts: VideoPost[];
  newsBySearch: Article[];
  categoryPosts: Record<string, Article[]>;
  loading: boolean;
  error?: string | null;

  fetchArticles: () => Promise<void>;
  fetchNewPosts: () => Promise<void>;
  fetchVideoPosts: () => Promise<void>;
  fetchAllIfNeeded: () => Promise<void>;
  fetchByCategory: (category: string) => Promise<Article[]>;
  fetchArticleById: (id: string) => Article | null;
  searchNews: (query: string, opts?: SearchOpts) => Promise<Article[]>;
};

// ====== CONFIG ======
const NEWSDATA_API_KEY = 'pub_d420917cb2504d06a2cba9a34f220496';
const YT_API_KEY = 'AIzaSyBjbBPKXiYJGsvygpIzj3LNxJ88a4HPn1M';

// Cache + dedupe to avoid hammering the API
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes (tune as needed)
const cache = new Map<string, { ts: number; data: any }>();
const inFlight = new Map<string, Promise<any>>();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Smart JSON fetcher with:
// - short-term cache
// - in-flight dedupe
// - 429-aware retry using Retry-After or exponential backoff
async function requestJSON(url: string, opts?: RequestInit, attempt = 0): Promise<any> {
  const now = Date.now();

  const cached = cache.get(url);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const existing = inFlight.get(url);
  if (existing) return existing;

  const p = (async () => {
    const res = await fetch(url, opts);

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      const retryAfterSec = retryAfter ? parseInt(retryAfter, 10) : NaN;
      const backoffMs = !Number.isNaN(retryAfterSec)
        ? retryAfterSec * 1000
        : Math.min(1000 * 2 ** attempt, 8000); // 1s,2s,4s,8s cap
      if (attempt < 4) {
        await sleep(backoffMs);
        return requestJSON(url, opts, attempt + 1);
      }
      throw new Error('Rate limited (429) after retries');
    }

    if (!res.ok) {
      // Optional: handle other 5xx with retry
      if (res.status >= 500 && attempt < 3) {
        await sleep(Math.min(1000 * 2 ** attempt, 4000));
        return requestJSON(url, opts, attempt + 1);
      }
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
    }

    const json = await res.json();
    cache.set(url, { ts: Date.now(), data: json });
    return json;
  })()
    .catch((err) => {
      // Avoid poisoning cache; just bubble the error
      throw err;
    })
    .finally(() => {
      inFlight.delete(url);
    });

  inFlight.set(url, p);
  return p;
}

function normalizeArticle(a: any): Article {
  return {
    id: a?.article_id ?? a?.id ?? a?.uuid ?? a?.link,
    title: a?.title,
    description: a?.description,
    image_url: a?.image_url,
    link: a?.link,
    author: Array.isArray(a?.author)
      ? a.author.filter(Boolean).join(', ')
      : Array.isArray(a?.creator)
        ? a.creator.filter(Boolean).join(', ')
        : a?.author ?? a?.creator ?? undefined,

    pubDate: a?.pubDate,
    category: a?.category,
    keywords: a?.keywords,
  };
}

export const useNewsStore = create<NewsState & {
  savedPosts: Article[];
  addPostToSave: (post: Article) => void;
  getSavedPosts: () => Article[];
}>()(
  persist(
    (set, get) => ({
      articles: [],
      newPosts: [],
      videoPosts: [],
      categoryPosts: {},
      newsBySearch: [],
      savedPosts: [],
      
      loading: false,
      error: null,


      isSaved: (idOrLink: string) => {
        const key = String(idOrLink ?? '');
        if (!key) return false;
        return get().savedPosts.some(
          (p) => (p.id ?? p.link ?? '') === key
        );
      },

      addPostToSave: (post) => {
        const id = post?.id ?? post?.link;
        if (!id) return false;
        if (get().savedPosts.some((p) => (p.id ?? p.link) === id)) return false;
        // optional: normalize first if needed
        const normalized = typeof normalizeArticle === 'function' ? normalizeArticle(post) : post;
        set({ savedPosts: [...get().savedPosts, normalized] });
        return true;
      },

      removePostFromSave: (idOrLink: string) => {
        const key = String(idOrLink ?? '');
        const before = get().savedPosts.length;
        set({ savedPosts: get().savedPosts.filter((p) => (p.id ?? p.link ?? '') !== key) });
        return get().savedPosts.length < before;
      },

      getSavedPosts: () => get().savedPosts,



      fetchArticles: async () => {
        if (get().articles.length > 0) return;
        set({ loading: true, error: null });
        try {
          const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&language=en&country=us&category=technology`;
          const data = await requestJSON(url);
          const filtered: Article[] = Array.isArray(data?.results)
            ? data.results.filter((a: any) => a?.image_url).map(normalizeArticle)
            : [];
          set({ articles: filtered.slice(0, 4) });
        } catch (e: any) {
          set({ error: e?.message || 'Error fetching technology news' });
        } finally {
          set({ loading: false });
        }
      },

      fetchNewPosts: async () => {
        if (get().newPosts.length > 0) return;
        set({ loading: true, error: null });
        try {
          const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&language=en&country=us`;
          const data = await requestJSON(url);
          const filtered: Article[] = Array.isArray(data?.results)
            ? data.results.filter((a: any) => a?.image_url).map(normalizeArticle)
            : [];
          set({ newPosts: filtered.slice(0, 4) });
        } catch (e: any) {
          set({ error: e?.message || 'Error fetching new posts' });
        } finally {
          set({ loading: false });
        }
      },

      fetchVideoPosts: async () => {
        if (get().videoPosts.length > 0) return;
        set({ loading: true, error: null });
        try {
          let collected: VideoPost[] = [];
          let nextPage = '';
          let fetchCount = 0;
          const MAX_FETCHES = 3;

          while (collected.length < 4 && fetchCount < MAX_FETCHES) {
            fetchCount += 1;
            let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=news&key=${YT_API_KEY}`;
            if (nextPage) url += `&pageToken=${nextPage}`;

            const data = await requestJSON(url);
            if (Array.isArray(data?.items)) {
              const batch: VideoPost[] = data.items.map((item: any) => ({
                title: item?.snippet?.title,
                description: item?.snippet?.description,
                image_url: item?.snippet?.thumbnails?.medium?.url,
                video_url: `https://www.youtube.com/watch?v=${item?.id?.videoId}`,
              }));
              collected = collected.concat(batch);
            }

            if (collected.length < 4 && data?.nextPageToken) {
              nextPage = data.nextPageToken;
              await sleep(1000); // be nice to the quota
            } else {
              break;
            }
          }

          set({ videoPosts: collected.slice(0, 4) });
        } catch (e: any) {
          set({ error: e?.message || 'Error fetching YouTube videos' });
        } finally {
          set({ loading: false });
        }
      },

      fetchByCategory: async (category: string) => {
        const key = (category ?? '').toLowerCase().trim();
        if (!key) return [];
        const cached = get().categoryPosts[key];
        if (cached && cached.length) return cached;

        set({ loading: true, error: null });
        try {
          const url = new URL('https://newsdata.io/api/1/news');
          url.searchParams.set('apikey', NEWSDATA_API_KEY);
          url.searchParams.set('language', 'en');
          url.searchParams.set('country', 'us');
          url.searchParams.set('category', key);

          const data = await requestJSON(url.toString());
          const filtered: Article[] = Array.isArray(data?.results)
            ? data.results.filter((a: any) => a?.image_url).map(normalizeArticle)
            : [];

          const slice = filtered.slice(0, 12);
          set((state) => ({
            categoryPosts: { ...state.categoryPosts, [key]: slice },
          }));
          return slice;
        } catch (e: any) {
          set({ error: e?.message || `Error fetching ${category} news` });
          return [];
        } finally {
          set({ loading: false });
        }
      },

      fetchArticleById: (id: string) => {
        const { articles, newPosts, categoryPosts } = get();

        const getId = (a: any) => a?.id ?? a?.article_id ?? a?.uuid ?? a?.link;

        // 1) Check in-memory state across articles, newPosts, and all categoryPosts
        const fromMemory =
          [...articles, ...newPosts, ...Object.values(categoryPosts).flat()].find(
            (a: any) => getId(a) === id
          );
        if (fromMemory) return normalizeArticle(fromMemory);

        // 2) Fallback to persisted localStorage (zustand persist)
        try {
          const raw = localStorage.getItem('news-store');
          if (!raw) return null;

          const parsed = JSON.parse(raw);
          const persistedArticles: any[] = parsed?.state?.articles ?? [];
          const persistedNewPosts: any[] = parsed?.state?.newPosts ?? [];
          const persistedCategoryPostsObj: Record<string, any[]> =
            parsed?.state?.categoryPosts ?? {};

          const allPersistedCategoryPosts = Object.values(persistedCategoryPostsObj).flat();

          const fromStorage =
            [...persistedArticles, ...persistedNewPosts, ...allPersistedCategoryPosts].find(
              (a: any) => getId(a) === id
            );

          return fromStorage ? normalizeArticle(fromStorage) : null;
        } catch {
          return null;
        }
      },

      searchNews: async (query, opts = {}) => {
        const q = (query ?? '').trim();
        if (!q) return [];

        const mode = opts.mode ?? 'q';
        set({ loading: true, error: null });
        try {
          const maxPages = Math.max(1, Math.min(opts.maxPages ?? 3, 10));
          const seen = new Set<string>();
          const out: Article[] = [];

          let pageCount = 0;
          let nextPage = '';

          while (pageCount < maxPages) {
            pageCount += 1;

            let url = buildNewsSearchURL(q, { ...opts, mode });
            if (nextPage) {
              const u = new URL(url);
              u.searchParams.set('page', nextPage);
              url = u.toString();
            }

            const data = await requestJSON(url);

            const batch: Article[] = Array.isArray(data?.results)
              ? data.results
                  .map(normalizeArticle)
                  .filter((a) => a?.image_url)
                  .filter((a) => {
                    const id = String(a?.id ?? a?.link ?? '');
                    if (!id || seen.has(id)) return false;
                    seen.add(id);
                    return true;
                  })
              : [];

            out.push(...batch);

            if (data?.nextPage) {
              nextPage = data.nextPage;
              await sleep(300);
            } else {
              break;
            }
          }

          set({ newsBySearch: out }); // store results
          return out;
        } catch (e: any) {
          set({ error: e?.message || 'Error searching news' });
          return [];
        } finally {
          set({ loading: false });
        }
      },



      fetchAllIfNeeded: async () => {
        // Fire in parallel; each call has caching/dedupe/backoff
        await Promise.all([
          get().fetchArticles(),
          get().fetchNewPosts(),
          get().fetchVideoPosts(),
        ]);
      },
    }),
    {
      name: 'news-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        articles: s.articles,
        newPosts: s.newPosts,
        videoPosts: s.videoPosts,
        categoryPosts: s.categoryPosts,
        savedPosts: s.savedPosts
      }),
      version: 1,
    }
  )
);
