export type PexelsMedia = {
  id: string;
  type: "photo" | "video";
  alt: string | null;
  width: number;
  height: number;
  previewUrl: string;
  url: string;
  mimeType: string;
  photographer: {
    name: string;
    profileUrl: string;
  };
  pexelsUrl: string;
};

export type PexelsSearchResult = {
  items: PexelsMedia[];
  total: number;
  page: number;
};
