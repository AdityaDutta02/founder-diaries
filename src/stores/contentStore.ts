import { create } from 'zustand';

export interface CarouselSlide {
  slideNumber: number;
  heading: string;
  bodyText: string;
  imagePrompt: string;
}

export interface ThreadTweet {
  order: number;
  text: string;
}

export interface GeneratedPost {
  id: string;
  user_id: string;
  diary_entry_id: string | null;
  platform: 'linkedin' | 'instagram' | 'x';
  content_type: 'post' | 'carousel' | 'thread' | 'reel_caption';
  title: string | null;
  body_text: string;
  carousel_slides: CarouselSlide[] | null;
  thread_tweets: ThreadTweet[] | null;
  image_prompt: string | null;
  generated_image_url: string | null;
  user_image_id: string | null;
  status: 'draft' | 'approved' | 'scheduled' | 'posted' | 'rejected';
  scheduled_for: string | null;
  generation_metadata: Record<string, unknown> | null;
  user_edits: string | null;
  created_at: string;
  updated_at: string;
}

export type PlatformFilter = 'all' | 'linkedin' | 'instagram' | 'x';

export interface WeeklyQuotaEntry {
  platform: 'linkedin' | 'instagram' | 'x';
  approved: number;
  total: number;
}

interface ContentState {
  posts: GeneratedPost[];
  selectedPostId: string | null;
  platformFilter: PlatformFilter;
}

interface ContentActions {
  setPosts: (posts: GeneratedPost[]) => void;
  addPost: (post: GeneratedPost) => void;
  updatePost: (id: string, updates: Partial<GeneratedPost>) => void;
  removePost: (id: string) => void;
  setSelectedPost: (id: string | null) => void;
  setPlatformFilter: (filter: PlatformFilter) => void;
  getPostsByStatus: (status: GeneratedPost['status']) => GeneratedPost[];
  getPostsByPlatform: (platform: GeneratedPost['platform']) => GeneratedPost[];
  getWeeklyQuota: () => WeeklyQuotaEntry[];
}

export type ContentStore = ContentState & ContentActions;

const PLATFORMS: Array<GeneratedPost['platform']> = ['linkedin', 'instagram', 'x'];

export const useContentStore = create<ContentStore>()((set, get) => ({
  // State
  posts: [],
  selectedPostId: null,
  platformFilter: 'all',

  // Actions
  setPosts: (posts) => set({ posts }),

  addPost: (post) =>
    set((state) => ({ posts: [...state.posts, post] })),

  updatePost: (id, updates) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === id ? { ...post, ...updates } : post
      ),
    })),

  removePost: (id) =>
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== id),
      selectedPostId: state.selectedPostId === id ? null : state.selectedPostId,
    })),

  setSelectedPost: (id) => set({ selectedPostId: id }),

  setPlatformFilter: (filter) => set({ platformFilter: filter }),

  getPostsByStatus: (status) => {
    const { posts } = get();
    return posts.filter((post) => post.status === status);
  },

  getPostsByPlatform: (platform) => {
    const { posts } = get();
    return posts.filter((post) => post.platform === platform);
  },

  getWeeklyQuota: () => {
    const { posts } = get();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return PLATFORMS.map((platform) => {
      const platformPosts = posts.filter((post) => {
        if (post.platform !== platform) return false;
        const createdAt = new Date(post.created_at);
        return createdAt >= weekStart;
      });
      return {
        platform,
        approved: platformPosts.filter((post) => post.status === 'approved').length,
        total: platformPosts.length,
      };
    });
  },
}));
