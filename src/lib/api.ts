const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4200/api';
const ACCESS_KEY_STORAGE = 'socialposter_access_key';

export interface BusinessProfile {
  id: number;
  slug: string;
  name: string;
  description: string;
  products?: string | null;
  metaPromptTemplate?: string | null;
  linkedinPromptTemplate?: string | null;
  autoPublish: boolean;
  autoScheduleEnabled: boolean;
  scheduleCron?: string | null;
  scheduleTimezone: string;
  schedulePlatforms: string;
  lastPostedAt?: string | null;
}

export type PublicationStatus = 'draft' | 'published' | 'failed';
export type PostPlatform = 'linkedin' | 'facebook' | 'instagram';

export interface PostPublication {
  id: number;
  postId: number;
  platform: PostPlatform;
  status: PublicationStatus;
  externalPostId?: string | null;
  errorMessage?: string | null;
  publishedAt?: string | null;
  createdAt: string;
}

export interface Post {
  id: number;
  businessId: number | null;
  platform: PostPlatform;
  imagePrompt: string;
  imageUrl: string;
  caption: string;
  hashtags: string;
  publications: PostPublication[];
  createdAt: string;
}

export interface LinkedInStatus {
  connected: boolean;
  name?: string;
  expiresAt?: string;
}

export interface Logo {
  id: number;
  businessId: number;
  prompt: string;
  imageUrl: string;
  parentLogoId: number | null;
  createdAt: string;
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
  listBusinesses: () => request<BusinessProfile[]>('/business/all'),
  getBusinessBySlug: (slug: string) =>
    request<BusinessProfile | null>(`/business/${slug}`),
  updateBusiness: (
    slug: string,
    data: Partial<
      Pick<
        BusinessProfile,
        | 'name'
        | 'description'
        | 'products'
        | 'metaPromptTemplate'
        | 'linkedinPromptTemplate'
        | 'autoPublish'
        | 'autoScheduleEnabled'
        | 'scheduleCron'
        | 'scheduleTimezone'
        | 'schedulePlatforms'
      >
    >,
  ) =>
    request<BusinessProfile>(`/business/${slug}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  // legacy single-business accessors, kept for the default/first business
  getBusiness: () => request<BusinessProfile | null>('/business'),
  saveBusiness: (data: Partial<BusinessProfile>) =>
    request<BusinessProfile>('/business', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  listPosts: (filter?: { business?: string; platform?: PostPlatform }) => {
    const params = new URLSearchParams();
    if (filter?.business) params.set('business', filter.business);
    if (filter?.platform) params.set('platform', filter.platform);
    const qs = params.toString();
    return request<Post[]>(`/posts${qs ? `?${qs}` : ''}`);
  },
  /**
   * Generates one piece of content (image + caption) tuned for `platform`'s tone,
   * and creates draft publication slots for every platform in `targetPlatforms`
   * (defaults to just `platform`) so the same asset can be published to several
   * platforms without regenerating.
   */
  generatePost: (params: {
    business: string;
    platform: PostPlatform;
    targetPlatforms?: PostPlatform[];
  }) => {
    const search = new URLSearchParams();
    search.set('business', params.business);
    search.set('platform', params.platform);
    if (params.targetPlatforms?.length) {
      search.set('targetPlatforms', params.targetPlatforms.join(','));
    }
    return request<Post>(`/posts/generate?${search.toString()}`, {
      method: 'POST',
    });
  },
  updatePost: (id: number, data: Partial<Pick<Post, 'caption' | 'hashtags'>>) =>
    request<Post>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  publishPost: (id: number, platform: PostPlatform) =>
    request<Post>(`/posts/${id}/publish/${platform}`, { method: 'POST' }),
  deletePost: (id: number) =>
    request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }),

  // LinkedIn is connected per-business.
  linkedinAuthUrl: (business: string) =>
    request<{ url: string }>(`/linkedin/auth-url?business=${encodeURIComponent(business)}`),
  linkedinStatus: (business: string) =>
    request<LinkedInStatus>(`/linkedin/status/${business}`),
  linkedinDisconnect: (business: string) =>
    request<{ success: boolean }>(`/linkedin/disconnect/${business}`, {
      method: 'DELETE',
    }),

  // Logo maker
  listLogos: (business: string) =>
    request<Logo[]>(`/logo?business=${encodeURIComponent(business)}`),
  generateLogo: (business: string, brief?: string) =>
    request<Logo>(`/logo/generate?business=${encodeURIComponent(business)}`, {
      method: 'POST',
      body: JSON.stringify({ brief }),
    }),
  editLogo: (id: number, instructions: string) =>
    request<Logo>(`/logo/${id}/edit`, {
      method: 'POST',
      body: JSON.stringify({ instructions }),
    }),
  deleteLogo: (id: number) =>
    request<{ success: boolean }>(`/logo/${id}`, { method: 'DELETE' }),
};
