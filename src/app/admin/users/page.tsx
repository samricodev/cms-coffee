import { Forbidden } from "@/components/forbidden";
import { UserForm } from "@/components/user-form";
import { card } from "@/components/ui";
import { requireUser } from "@/lib/auth/guards";
import { listUsers } from "@/lib/users";

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
        {users.map((user) => (
          <li key={user.id} className={`${card} flex flex-wrap gap-2`}>
            <span className="font-medium">{user.name}</span>
            <span className="text-sm text-black/60 dark:text-white/60">
              {user.email}
            </span>
            <span className="ml-auto rounded bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
              {user.role}
            </span>
          </li>
        ))}
      </ul>

      <section className={`${card} space-y-4`}>
        <h2 className="font-medium">Crear cuenta</h2>
        <UserForm />
      </section>
    </div>
  );
}
