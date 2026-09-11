import { PasswordForm } from "@/components/password-form";
import { card } from "@/components/ui";
import { requireUser } from "@/lib/auth/guards";

export const instant = false;

export default async function CuentaPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Mi cuenta</h1>

      <dl className={`${card} grid gap-1 text-sm sm:grid-cols-[8rem_1fr]`}>
        <dt className="text-muted">Nombre</dt>
        <dd>{user.name}</dd>
        <dt className="text-muted">Email</dt>
        <dd>{user.email}</dd>
        <dt className="text-muted">Rol</dt>
        <dd>{user.role === "admin" ? "Administrador" : "Editor"}</dd>
      </dl>

      <section className={`${card} space-y-4`}>
        <h2 className="font-medium">Cambiar contraseña</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
