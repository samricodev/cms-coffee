import Link from "next/link";
import { Suspense } from "react";

import { CoffeeLabel } from "@/components/site/coffee-label";
import { buttonPrimary, eyebrow } from "@/components/site/ui";
import { getCafeChoices, getFilteredCafes } from "@/lib/public-content";

export const metadata = {
  title: "Cafés",
  description: "Los orígenes que servimos: proceso, altitud y notas de cata.",
};

const control =
  "w-full rounded-sm border border-field bg-white px-2.5 py-2 text-sm hover:border-ink/60 focus:border-accent";

function Select({
  name,
  title,
  options,
  value,
}: {
  name: string;
  title: string;
  options: string[];
  value: string;
}) {
  if (options.length === 0) return null;

  return (
    <label className="space-y-1.5">
      <span className={`block ${eyebrow} text-muted`}>{title}</span>
      <select name={name} defaultValue={value} className={control}>
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

async function Resultados({
  searchParams,
}: {
  searchParams: PageProps<"/cafes">["searchParams"];
}) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? params[key] : "";

  const filters = {
    pais: value("pais"),
    proceso: value("proceso"),
    tueste: value("tueste"),
    nota: value("nota"),
  };

  const [choices, cafes] = await Promise.all([
    getCafeChoices(),
    getFilteredCafes(filters),
  ]);

  const filtrando = Object.values(filters).some(Boolean);

  return (
    <>
      <form className="grid gap-4 rounded-sm bg-surface p-5 sm:grid-cols-4 sm:p-6">
        <Select name="pais" title="Origen" options={choices.pais} value={filters.pais} />
        <Select
          name="proceso"
          title="Proceso"
          options={choices.proceso}
          value={filters.proceso}
        />
        <Select
          name="tueste"
          title="Tueste"
          options={choices.tueste}
          value={filters.tueste}
        />
        <Select name="nota" title="Nota" options={choices.notas} value={filters.nota} />

        <div className="flex flex-wrap items-center gap-4 sm:col-span-4">
          <button type="submit" className={buttonPrimary}>
            Filtrar
          </button>
          {filtrando ? (
            <Link
              href="/cafes"
              className="text-sm font-semibold text-muted underline-offset-4 hover:text-accent hover:underline"
            >
              Quitar filtros
            </Link>
          ) : null}
          <span className="ml-auto text-sm text-muted">
            {cafes.length} {cafes.length === 1 ? "café" : "cafés"}
          </span>
        </div>
      </form>

      {cafes.length === 0 ? (
        <p className="text-muted">
          Ningún café coincide con esos filtros. Prueba a quitar alguno.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cafes.map((cafe) => (
            <li key={cafe.id}>
              <CoffeeLabel cafe={cafe} heading="h2" />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function CafesPage({ searchParams }: PageProps<"/cafes">) {
  return (
    <div className="space-y-10">
      <header className="max-w-2xl space-y-4">
        <h1 className="font-display text-5xl">Cafés</h1>
        <p className="text-lg text-muted">
          Todo lo que ha pasado por el molino esta temporada. Ordenados por
          puntuación.
        </p>
      </header>

      <Suspense fallback={<p className="py-10 text-muted">Cargando cafés…</p>}>
        <Resultados searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
