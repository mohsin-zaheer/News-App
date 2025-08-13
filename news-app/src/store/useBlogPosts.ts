import { create } from "zustand";

type Post = {
  id: number | string;
  title: string;
  description: string;
  date: string; // ISO string from API
  authorName: string;
  authorImage: string | null;
  coverImage: string | null;
  link: string;

  // added for sorting logic
  likeCount: number;           
  commentCount: number;    
  viewCount: number;      
};

type NewsStore = {
  posts: Post[];
  bloading: boolean;
  berror: string | null;
  fetchPosts: (opts?: { number?: number }) => Promise<void>;
  fetchPostByID: (id: string | number) => Post | null;
};

const API_BASE =
  "https://public-api.wordpress.com/rest/v1.1/read/tags/news/posts";

function stripHtml(html?: string): string {
  if (!html) return "";
  if (typeof window === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

// Number guard
const getNumber = (v: unknown, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

// Normalize possible cover image candidates -> null if empty/invalid
function pickCoverImage(p: any): string | null {
  const candidates: Array<unknown> = [
    p?.featured_image,
    p?.post_thumbnail?.URL,
    p?._thumbnail_url,
  ];
  for (const c of candidates) {
    const s = typeof c === "string" ? c.trim() : "";
    if (!s) continue;
    try {
      const u = new URL(s);
      if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    } catch {
      /* ignore invalid URLs */
    }
  }
  return null;
}

// Try to pull engagement signals from multiple places/shapes
function pickEngagement(p: any) {
  // Likes
  const likeCount =
    getNumber(p?.like_count) ||
    getNumber(p?.likes) ||
    getNumber(p?.likeCount) ||
    getNumber(p?.metadata?.like_count) ||
    0;

  // Comments
  const commentCount =
    getNumber(p?.comment_count) ||
    getNumber(p?.comments_count) ||
    getNumber(p?.commentCount) ||
    getNumber(p?.discussion?.comment_count) ||
    0;

  // Views (rare on Reader API; keep best-effort + default 0)
  const viewCount =
    getNumber(p?.view_count) ||
    getNumber(p?.views) ||
    getNumber(p?.viewCount) ||
    getNumber(p?.site_stats?.views) ||
    0;

  return { likeCount, commentCount, viewCount };
}

export const useBlogPosts = create<NewsStore>((set, get) => {
  const storedPosts: Post[] =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("blog_posts") || "[]")
      : [];

  return {
    posts: storedPosts,
    bloading: false,
    berror: null,

    fetchPosts: async (opts) => {
      const params = new URLSearchParams();
      if (opts?.number) params.set("number", String(opts.number));
      const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;

      set({ bloading: true, berror: null });
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const normalized: Post[] = (data?.posts ?? [])
          .map((p: any): Post | null => {
            const authorName: string =
              p?.author?.name ??
              p?.author?.display_name ??
              p?.author?.nice_name ??
              "Unknown";

            const authorImage: string | null = (() => {
              const candidates: Array<unknown> = [
                p?.author?.avatar_URL,
                p?.author?.avatar_URLs?.["96"],
                p?.author?.avatar_URLs?.["48"],
                p?.author?.avatar_URLs?.["24"],
              ];
              for (const c of candidates) {
                const s = typeof c === "string" ? c.trim() : "";
                if (!s) continue;
                try {
                  const u = new URL(s);
                  if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
                } catch {}
              }
              return null;
            })();

            const coverImage = pickCoverImage(p);
            const title = stripHtml(p?.title) || "Untitled";
            const description =
              stripHtml(p?.excerpt) ||
              stripHtml(typeof p?.content === "string" ? p.content.slice(0, 300) : p?.content) ||
              "";

            const { likeCount, commentCount, viewCount } = pickEngagement(p);

            return {
              id: p?.ID ?? p?.id ?? p?.URL ?? title,
              title,
              description,
              date: p?.date ?? p?.modified ?? "",
              authorName,
              authorImage,
              coverImage,
              link: p?.URL ?? p?.short_URL ?? "",

              likeCount,
              commentCount,
              viewCount,
            };
          })
          .filter((post): post is Post => Boolean(post && post.coverImage !== null));

        if (typeof window !== "undefined") {
          localStorage.setItem("blog_posts", JSON.stringify(normalized));
        }

        set({ posts: normalized, bloading: false });
      } catch (e: any) {
        set({ berror: e?.message ?? "Failed to load posts", bloading: false });
      }
    },

    fetchPostByID: (id) => {
      const posts = get().posts.length
        ? get().posts
        : (typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("blog_posts") || "[]")
            : []);
      return posts.find((post) => String(post.id) === String(id)) || null;
    },
  };
});
