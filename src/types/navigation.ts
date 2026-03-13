// Route param types for Expo Router typed routes.
// These reflect the file-based routing structure defined in FRONTEND.md.

// ─── Auth stack ─────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  'sign-in': undefined;
  'sign-up': undefined;
  'forgot-password': undefined;
};

// ─── Onboarding stack ───────────────────────────────────────────────────────

export type OnboardingStackParamList = {
  welcome: undefined;
  'industry-select': undefined;
  'platform-setup': undefined;
  'quota-config': undefined;
};

// ─── Diary stack ────────────────────────────────────────────────────────────

export type DiaryStackParamList = {
  index: undefined;
  new: undefined;
  '[date]': { date: string };
};

// ─── Content stack ──────────────────────────────────────────────────────────

export type ContentStackParamList = {
  index: undefined;
  '[postId]': { postId: string };
  queue: undefined;
};

// ─── Discover stack ─────────────────────────────────────────────────────────

export type DiscoverStackParamList = {
  index: undefined;
  '[creatorId]': { creatorId: string };
  profiles: undefined;
};

// ─── Settings stack ─────────────────────────────────────────────────────────

export type SettingsStackParamList = {
  index: undefined;
  platforms: undefined;
  account: undefined;
};

// ─── Modals ─────────────────────────────────────────────────────────────────

export type ModalParamList = {
  'audio-recorder': undefined;
  'image-picker': undefined;
  'post-preview': { postId: string };
  'content-type-select': { diaryEntryId: string };
};

// ─── Tab navigator ───────────────────────────────────────────────────────────

export type TabParamList = {
  diary: undefined;
  content: undefined;
  discover: undefined;
  settings: undefined;
};
