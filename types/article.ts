export type StrapiImageFormat = {
  url?: string | null;
  width?: number | null;
  height?: number | null;
};

export type StrapiImage = {
  id?: string | number;
  url?: string | null;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: Record<string, StrapiImageFormat | null> | null;
  attributes?: Omit<StrapiImage, "attributes">;
  data?: StrapiImage | null;
};

export type ArticleMachineType = {
  id: string | number;
  name?: string | null;
  preview?: StrapiImage | null;
};

export type Article = {
  id: string | number;
  code: string;
  key?: string | null;
  type?: "blog" | "page" | null;
  header?: string | null;
  subheader?: string | null;
  article?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  isOutdated?: boolean | null;
  machine_types?: ArticleMachineType[] | null;
};
