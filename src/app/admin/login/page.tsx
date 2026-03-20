import AdminLoginForm from "@/components/admin/admin-login-form";

type Props = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = params.next ?? "/engagement/admin";

  return <AdminLoginForm nextPath={next} />;
}