import LoginForm from "@/components/auth/login-form";

type Props = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

function getSingleValue(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = getSingleValue(params.next) || "/";

  return <LoginForm nextPath={nextPath} />;
}