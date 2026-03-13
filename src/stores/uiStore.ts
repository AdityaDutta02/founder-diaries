import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  message: string;
  variant: ToastVariant;
  /** Duration in milliseconds before auto-dismiss. Default: 3000. */
  duration: number;
}

export interface ToastState {
  visible: boolean;
  message: string;
  variant: ToastVariant;
  duration: number;
}

const DEFAULT_TOAST_DURATION = 3000;

const HIDDEN_TOAST: ToastState = {
  visible: false,
  message: '',
  variant: 'info',
  duration: DEFAULT_TOAST_DURATION,
};

interface UIState {
  isAudioRecorderVisible: boolean;
  isImagePickerVisible: boolean;
  /** @deprecated Use toast instead */
  toastMessage: ToastMessage | null;
  /** Structured toast state consumed by the <Toast /> component */
  toast: ToastState;
  isKeyboardVisible: boolean;
  /** URI of the audio recording saved from the recorder modal */
  pendingAudioUri: string | null;
  /** URIs of images selected from the image picker modal */
  pendingImageUris: string[];
}

interface UIActions {
  showAudioRecorder: () => void;
  hideAudioRecorder: () => void;
  showImagePicker: () => void;
  hideImagePicker: () => void;
  showToast: (message: string, variant: ToastVariant, duration?: number) => void;
  hideToast: () => void;
  setKeyboardVisible: (isVisible: boolean) => void;
  setPendingAudioUri: (uri: string | null) => void;
  clearPendingAudioUri: () => void;
  setPendingImageUris: (uris: string[]) => void;
  clearPendingImageUris: () => void;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()((set) => ({
  // State
  isAudioRecorderVisible: false,
  isImagePickerVisible: false,
  toastMessage: null,
  toast: HIDDEN_TOAST,
  isKeyboardVisible: false,
  pendingAudioUri: null,
  pendingImageUris: [],

  // Actions
  showAudioRecorder: () => set({ isAudioRecorderVisible: true }),

  hideAudioRecorder: () => set({ isAudioRecorderVisible: false }),

  showImagePicker: () => set({ isImagePickerVisible: true }),

  hideImagePicker: () => set({ isImagePickerVisible: false }),

  showToast: (message, variant, duration = DEFAULT_TOAST_DURATION) =>
    set({
      toastMessage: { message, variant, duration },
      toast: { visible: true, message, variant, duration },
    }),

  hideToast: () =>
    set((state) => ({
      toastMessage: null,
      toast: { ...state.toast, visible: false },
    })),

  setKeyboardVisible: (isKeyboardVisible) => set({ isKeyboardVisible }),

  setPendingAudioUri: (uri) => set({ pendingAudioUri: uri }),
  clearPendingAudioUri: () => set({ pendingAudioUri: null }),

  setPendingImageUris: (uris) => set({ pendingImageUris: uris }),
  clearPendingImageUris: () => set({ pendingImageUris: [] }),
}));
