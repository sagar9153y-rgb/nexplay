import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() { return <AuthShell eyebrow="Welcome back" title="Welcome Back" subtitle="Continue your gaming journey."><LoginForm /></AuthShell>; }