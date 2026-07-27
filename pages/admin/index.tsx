import type { GetServerSideProps } from "next";
import { isValidAdminSession } from "../../lib/admin/auth";

export const getServerSideProps: GetServerSideProps = async (context) => ({
  redirect: {
    destination: isValidAdminSession(context.req.headers.cookie)
      ? "/admin/dashboard"
      : "/admin/login",
    permanent: false,
  },
});

export default function AdminIndexPage() {
  return null;
}
