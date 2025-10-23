export interface SettingsShape {
  selectedMode: string;
  audioVolume: number;
  audioMuted: boolean;
}

const STORAGE_KEY = 'dicetrix_settings_v1';

const DEFAULTS: SettingsShape = {
  selectedMode: 'medium',
  audioVolume: 0.8,
  audioMuted: false,
};

export class Settings {
  private data: SettingsShape;

  constructor() {
    this.data = { ...DEFAULTS };
    this.load();
  }

  load(): void {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsShape>;
        this.data = { ...this.data, ...parsed };
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  save(): void {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  get<K extends keyof SettingsShape>(k: K): SettingsShape[K] {
    return this.data[k];
  }

  set<K extends keyof SettingsShape>(k: K, v: SettingsShape[K]): void {
    this.data[k] = v;
    this.save();
  }

  getAll(): SettingsShape {
    return { ...this.data };
  }
}

export const settings = new Settings();
