export interface YoutubeMinute {
  minute: number;
  start: number;
  preview: string;
}

export interface YoutubeStore {
  videoId: string;
  url: string;
  totalDurationSeconds: number;
  needsSegmentation: boolean;
  minutes: YoutubeMinute[];
  text: string;
  charCount: number;
  startSeconds: number;
  endSeconds: number;
}

const defaults: YoutubeStore = {
  videoId: "",
  url: "",
  totalDurationSeconds: 0,
  needsSegmentation: false,
  minutes: [],
  text: "",
  charCount: 0,
  startSeconds: 0,
  endSeconds: 0,
};

let store: YoutubeStore = { ...defaults };

export function getYoutubeStore(): YoutubeStore {
  return store;
}

export function setYoutubeStore(data: Partial<YoutubeStore>) {
  store = { ...store, ...data };
}

export function resetYoutubeStore() {
  store = { ...defaults };
}
