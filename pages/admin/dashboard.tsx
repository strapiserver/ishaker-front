import type { GetServerSideProps } from "next";
import { AdminDashboard } from "../../components/admin";
import { requireAdminSession } from "../../lib/admin/auth";
import { requestStrapiAsService } from "../../services/server/strapiClient";
import normalize from "../../services/normalizer";
import { AdminClientsQuery } from "../../services/queries";
import type { Client } from "../../types/strapi";

type DashboardProps = {
  clients: Client[];
  loadError?: string;
};

export const getServerSideProps: GetServerSideProps<DashboardProps> = async (context) => {
  const redirect = requireAdminSession(context);
  if (redirect) return redirect;

  try {
    const raw = await requestStrapiAsService<any>(AdminClientsQuery);
    const result = normalize(raw);
    const clients = ((result?.clients || []) as Client[]).filter(
      (client) => client.status === "client",
    );

    return { props: { clients } };
  } catch (error) {
    console.error("[admin/dashboard] clients load failed:", error);
    return {
      props: {
        clients: [],
        loadError: "Client data is unavailable. Check Strapi connection and service credentials.",
      },
    };
  }
};

export default function AdminDashboardPage({ clients, loadError }: DashboardProps) {
  return <AdminDashboard clients={clients} loadError={loadError} />;
}
