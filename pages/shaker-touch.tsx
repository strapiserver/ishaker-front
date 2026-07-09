import { ProductPage } from "../components/product/ProductPage";

const characteristics = [
  {
    label: "Format",
    value: "Touchscreen automated protein shake vending machine",
  },
  {
    label: "Interface",
    value: "Large touch display for guided ordering and flavor selection",
  },
  {
    label: "Best fit",
    value: "Premium gyms, offices, hospitality spaces, and high-traffic venues",
  },
  {
    label: "Service model",
    value: "Cloud-managed with remote diagnostics and support",
  },
  {
    label: "Product types",
    value: "Protein shakes, BCAA, isotonic mixes, creatine, and water",
  },
  { label: "Operation", value: "Self-service, 24/7 unattended dispensing" },
];

const plotData = [
  { label: "6 AM", output: 24, demand: 16 },
  { label: "9 AM", output: 68, demand: 58 },
  { label: "12 PM", output: 86, demand: 78 },
  { label: "3 PM", output: 74, demand: 64 },
  { label: "6 PM", output: 118, demand: 104 },
  { label: "9 PM", output: 54, demand: 46 },
];

const description =
  "A larger iShaker experience with a guided touchscreen flow for venues " +
  "that want a premium self-service station. It keeps ordering clear, " +
  "visual, and fast during peak traffic.";

const seoDescription =
  "Shaker Touch is a touchscreen automated protein shake vending machine " +
  "for premium and high-traffic venues.";

export default function ShakerTouchPage() {
  return (
    <ProductPage
      title="Shaker Touch"
      description={description}
      imageSrc="/shaker-touch-right.png"
      imageAlt="iShaker Shaker Touch machine"
      seoDescription={seoDescription}
      characteristics={characteristics}
      plotData={plotData}
    />
  );
}
