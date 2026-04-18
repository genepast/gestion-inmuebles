import { LoginForm } from "@/features/auth/components/LoginForm";

interface Props {
  searchParams: { next?: string };
}

export default function LoginPage({ searchParams }: Props) {
  return (
    <>
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Iniciar sesión</h2>
      <LoginForm nextPath={searchParams.next} />
    </>
  );
}
