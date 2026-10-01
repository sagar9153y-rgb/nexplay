import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

type LoginPageProps = { searchParams: Promise<{ error?: string | string[] }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  return <AuthShell eyebrow="Welcome back" title="Welcome Back" subtitle="Continue your gaming journey."><LoginForm confirmationError={error === "confirmation"} /></AuthShell>;
}