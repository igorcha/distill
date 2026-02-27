export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string | null;
  flashcard_count: number;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  deck: string;
  front: string;
  back: string;
  order: number;
  created_at: string;
}

export interface FlashcardDraft {
  front: string;
  back: string;
}
