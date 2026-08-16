import type { GetServerSideProps } from "next";
import ProductLinesPage, {
  getServerSideProps as getProductLinesServerSideProps,
} from "../index";
import type { ProductLinesPageProps } from "../../../components/portal/product-lines";

export default ProductLinesPage;

export const getServerSideProps: GetServerSideProps<
  ProductLinesPageProps
> = (context) => getProductLinesServerSideProps(context);
