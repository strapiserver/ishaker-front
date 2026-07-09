import { ProductPage } from "../components/product/ProductPage";

const characteristics = [
  { label: "Format", value: "Compact automated protein shake vending machine" },
  { label: "Cup capacity", value: "240 cups" },
  {
    label: "Best fit",
    value: "Gyms, hotels, offices, studios, and compact retail spaces",
  },
  {
    label: "Service model",
    value: "Cloud-managed with remote monitoring and support",
  },
  {
    label: "Product types",
    value: "Protein shakes, BCAA, isotonic mixes, creatine, and water",
  },
  { label: "Operation", value: "Self-service, 24/7 unattended dispensing" },
];

const plotData = [
  { label: "6 AM", output: 18, demand: 12 },
  { label: "9 AM", output: 54, demand: 46 },
  { label: "12 PM", output: 72, demand: 66 },
  { label: "3 PM", output: 58, demand: 50 },
  { label: "6 PM", output: 96, demand: 88 },
  { label: "9 PM", output: 42, demand: 36 },
];

const description =
  "A compact iShaker vending machine for locations that need fresh shakes " +
  "without taking over the floor. It is built for quick service, remote " +
  "management, and high daily reliability.";

const seoDescription =
  "Shaker S is a compact automated protein shake vending machine for gyms, " +
  "hotels, offices, and studios.";

export default function ShakerSPage() {
  return (
    <ProductPage
      title="Shaker S"
      description={description}
      imageSrc="/shaker-s-right.png"
      imageAlt="iShaker Shaker S machine"
      seoDescription={seoDescription}
      characteristics={characteristics}
      plotData={plotData}
    />
  );
}
