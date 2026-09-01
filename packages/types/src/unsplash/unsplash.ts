export type UnsplashPhoto = {
  id: string;
  alt: string | null;
  width: number;
  height: number;
  urls: {
    thumb: string;
    small: string;
    regular: string;
  };
  photographer: {
    name: string;
    profileUrl: string;
  };
  unsplashUrl: string;
  downloadLocation: string;
};

export type UnsplashSearchResult = {
  items: UnsplashPhoto[];
  total: number;
  page: number;
};
