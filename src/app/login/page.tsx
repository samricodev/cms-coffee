import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Entrar · CMS" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/admin");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center p-6">
      <h1 className="text-xl font-semibold">Entrar al panel</h1>
      <p className="mb-6 mt-1 text-sm text-black/60 dark:text-white/60">
        Cuentas de ejemplo: admin@cms.local · editor@cms.local
      </p>
      <LoginForm />
    </main>
  );
}
