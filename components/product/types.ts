export type Characteristic = {
  label: string;
  value: string;
};

export type PlotPoint = {
  label: string;
  output: number;
  demand: number;
};

export type ProductPageProps = {
  characteristics: Characteristic[];
  description: string;
  imageAlt: string;
  imageSrc: string;
  plotData: PlotPoint[];
  seoDescription: string;
  title: string;
};
