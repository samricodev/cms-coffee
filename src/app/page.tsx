import Link from "next/link";

import { getPublicEntries, getPublicTypes } from "@/lib/public-content";

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" });

async function TypeSection({ apiId, name }: { apiId: string; name: string }) {
  const entries = await getPublicEntries(apiId, 10);
  if (entries.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-medium">{name}</h2>
        <code className="text-xs text-black/50 dark:text-white/50">
          /api/public/{apiId}
        </code>
      </div>

      <ul className="space-y-3">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="rounded-lg border border-black/10 p-4 dark:border-white/15"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="font-medium">{entry.title}</h3>
              <span className="text-xs text-black/50 dark:text-white/50">
                /{entry.slug}
                {entry.publishedAt
                  ? ` · ${dateFormat.format(entry.publishedAt)}`
                  : ""}
              </span>
            </div>
            <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
              {Object.entries(entry.data).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <dt className="text-black/50 dark:text-white/50">{key}</dt>
                  <dd className="truncate">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function Home() {
  const types = await getPublicTypes();

  return (
    <main className="mx-auto w-full max-w-2xl space-y-10 p-6 sm:p-10">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold">CMS</h1>
        <Link href="/admin" className="ml-auto text-sm hover:underline">
          Panel →
        </Link>
      </div>

      {types.map((type) => (
        <TypeSection key={type.id} apiId={type.apiId} name={type.name} />
      ))}
    </main>
  );
}
