const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4200/api';
const ACCESS_KEY_STORAGE = 'socialposter_access_key';

export interface BusinessProfile {
  id: number;
  name: string;
  description: string;
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

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function getAccessKey(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(ACCESS_KEY_STORAGE) ?? '';
}

export function setAccessKey(key: string): void {
  window.localStorage.setItem(ACCESS_KEY_STORAGE, key);
}

export function clearAccessKey(): void {
  window.localStorage.removeItem(ACCESS_KEY_STORAGE);
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-access-key': getAccessKey(),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      body.message ?? `Request failed with status ${res.status}`,
      res.status,
    );
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
  updatePost: (id: number, data: Partial<Pick<Post, 'caption' | 'hashtags'>>) =>
    request<Post>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  publishPost: (id: number) =>
    request<Post>(`/posts/${id}/publish`, { method: 'POST' }),
  deletePost: (id: number) =>
    request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }),
  linkedinAuthUrl: () => request<{ url: string }>('/linkedin/auth-url'),
  linkedinStatus: () => request<LinkedInStatus>('/linkedin/status'),
  linkedinDisconnect: () =>
    request<{ success: boolean }>('/linkedin/disconnect', { method: 'DELETE' }),
};
