const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4200/api';

export interface BusinessProfile {
  id: number;
  name: string;
  industry?: string;
  description: string;
  targetAudience?: string;
  tone?: string;
  website?: string;
  location?: string;
  uniqueSellingPoints?: string;
  autoPublish: boolean;
}

export type PostStatus = 'draft' | 'published' | 'failed';

export interface Post {
  id: number;
  imagePrompt: string;
  imageUrl: string;
  caption: string;
  hashtags: string;
  status: PostStatus;
  linkedinPostId?: string;
  errorMessage?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface LinkedInStatus {
  connected: boolean;
  name?: string;
  expiresAt?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed with status ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export function imageUrl(path: string): string {
  const origin = API_URL.replace(/\/api$/, '');
  return `${origin}${path}`;
}

export const api = {
  getBusiness: () => request<BusinessProfile | null>('/business'),
  saveBusiness: (data: Partial<BusinessProfile>) =>
    request<BusinessProfile>('/business', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  listPosts: () => request<Post[]>('/posts'),
  generatePost: () => request<Post>('/posts/generate', { method: 'POST' }),
  publishPost: (id: number) =>
    request<Post>(`/posts/${id}/publish`, { method: 'POST' }),
  deletePost: (id: number) =>
    request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }),
  linkedinAuthUrl: () => request<{ url: string }>('/linkedin/auth-url'),
  linkedinStatus: () => request<LinkedInStatus>('/linkedin/status'),
  linkedinDisconnect: () =>
    request<{ success: boolean }>('/linkedin/disconnect', { method: 'DELETE' }),
};
