import { updateUserAction } from "@/app/admin/actions";
import { DeleteForm } from "@/components/delete-form";
import { Forbidden } from "@/components/forbidden";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { UserForm } from "@/components/user-form";
import { card, secondary } from "@/components/ui";
import { requireUser } from "@/lib/auth/guards";
import { listUsers } from "@/lib/users";

export const instant = false;

export default async function UsersPage() {
  const actor = await requireUser();

  if (actor.role !== "admin") {
    return <Forbidden message="La gestión de cuentas es solo para administradores." />;
  }

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Usuarios</h1>

      <ul className="space-y-3">
        {users.map((user) => {
          const yo = user.id === actor.id;

          return (
            <li key={user.id} className={`${card} space-y-3`}>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium">{user.name}</span>
                <span className="text-sm text-black/60 dark:text-white/60">
                  {user.email}
                </span>
                {yo ? (
                  <span className="rounded bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                    tú
                  </span>
                ) : null}
                {!user.active ? (
                  <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-700 dark:text-red-400">
                    desactivada
                  </span>
                ) : null}
                <span className="ml-auto rounded bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                  {user.role}
                </span>
              </div>

              {yo ? (
                <p className="text-xs text-black/60 dark:text-white/60">
                  No puedes cambiarte el rol ni desactivarte a ti mismo. Tu
                  contraseña se cambia en Mi cuenta.
                </p>
              ) : (
                <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                  <DeleteForm
                    className={secondary}
                    action={updateUserAction.bind(null, user.id, {
                      role: user.role === "admin" ? "editor" : "admin",
                    })}
                    label={
                      user.role === "admin" ? "Hacer editor" : "Hacer administrador"
                    }
                  />

                  <DeleteForm
                    className={secondary}
                    action={updateUserAction.bind(null, user.id, {
                      active: !user.active,
                    })}
                    label={user.active ? "Desactivar" : "Reactivar"}
                  />
                </div>
              )}

              {yo ? null : (
                <ResetPasswordForm userId={user.id} email={user.email} />
              )}
            </li>
          );
        })}
      </ul>

      <section className={`${card} space-y-4`}>
        <h2 className="font-medium">Crear cuenta</h2>
        <UserForm />
      </section>
    </div>
  );
}
