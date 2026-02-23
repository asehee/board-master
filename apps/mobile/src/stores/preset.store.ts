import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ALBUM_KEY = 'preset:albumName';
const LABELS_KEY = 'preset:boardLabels';

const DEFAULT_ALBUM = 'BoardCam';
const DEFAULT_LABELS = [
  '공종', '구조물명',
  '위치', '공구',
  '공사명', '기간',
  '감리원', '시공자',
];

interface PresetState {
  albumName: string;
  boardLabels: string[]; // 8개, 2열×4행
  isLoaded: boolean;
}

interface PresetActions {
  load: () => Promise<void>;
  saveAlbum: (name: string) => Promise<void>;
  saveLabels: (labels: string[]) => Promise<void>;
}

export const usePresetStore = create<PresetState & PresetActions>((set) => ({
  albumName: DEFAULT_ALBUM,
  boardLabels: DEFAULT_LABELS,
  isLoaded: false,

  load: async () => {
    const [storedAlbum, storedLabels] = await Promise.all([
      AsyncStorage.getItem(ALBUM_KEY),
      AsyncStorage.getItem(LABELS_KEY),
    ]);
    set({
      albumName: storedAlbum ?? DEFAULT_ALBUM,
      boardLabels: storedLabels ? JSON.parse(storedLabels) : DEFAULT_LABELS,
      isLoaded: true,
    });
  },

  saveAlbum: async (name: string) => {
    await AsyncStorage.setItem(ALBUM_KEY, name);
    set({ albumName: name });
  },

  saveLabels: async (labels: string[]) => {
    await AsyncStorage.setItem(LABELS_KEY, JSON.stringify(labels));
    set({ boardLabels: labels });
  },
}));
