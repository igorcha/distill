export interface PdfStore {
  pages: string[];
  totalPages: number;
  filename: string;
  suggestedStart: number;
  pageStart: number;
  pageEnd: number;
}

const defaults: PdfStore = {
  pages: [],
  totalPages: 0,
  filename: "",
  suggestedStart: 1,
  pageStart: 1,
  pageEnd: 1,
};

let store: PdfStore = { ...defaults };

export function getPdfStore(): PdfStore {
  return store;
}

export function setPdfStore(data: Partial<PdfStore>) {
  store = { ...store, ...data };
}

export function resetPdfStore() {
  store = { ...defaults };
}
