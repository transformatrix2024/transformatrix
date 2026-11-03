import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/server/auth/require-admin";
import { CampaignForm } from "../campaign-form";

export const metadata = { title: "New issue" };

export default async function NewCampaignPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="New issue" back={{ href: "/admin/newsletter", label: "Newsletter" }} />
      <CampaignForm />
    </>
  );
}
