import Link from "next/link";
import { Suspense } from "react";

import { MediaImage } from "@/components/site/media-image";
import { asList, asText } from "@/lib/format";
import { getCafeChoices, getFilteredCafes } from "@/lib/public-content";

export const metadata = {
  title: "Cafés",
  description: "Los orígenes que servimos: proceso, altitud y notas de cata.",
};

const label = "font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted";
const control =
  "w-full border border-line bg-transparent px-2 py-1.5 text-sm focus:border-accent focus:outline-none";

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
    <label className="space-y-1">
      <span className={`block ${label}`}>{title}</span>
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
      <form className="grid gap-4 border-y border-line py-5 sm:grid-cols-4">
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

        <div className="flex items-end gap-4 sm:col-span-4">
          <button
            type="submit"
            className="border border-ink px-4 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-paper"
          >
            Filtrar
          </button>
          {filtrando ? (
            <Link href="/cafes" className={`${label} hover:text-accent`}>
              Quitar filtros
            </Link>
          ) : null}
          <span className={`ml-auto ${label}`}>
            {cafes.length} {cafes.length === 1 ? "café" : "cafés"}
          </span>
        </div>
      </form>

      {cafes.length === 0 ? (
        <p className="text-muted">
          Ningún café coincide con esos filtros. Prueba a quitar alguno.
        </p>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2">
          {cafes.map((cafe) => (
            <li key={cafe.id} className="flex gap-4 border-t border-line pt-4">
              <MediaImage
                id={cafe.data.foto}
                alt={cafe.title}
                className="aspect-square w-24 shrink-0"
                sizes="96px"
              />

              <div className="min-w-0 space-y-1">
                <h2 className="font-display text-xl">
                  <Link href={`/cafes/${cafe.slug}`} className="hover:text-accent">
                    {cafe.title}
                  </Link>
                </h2>
                <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted">
                  {[asText(cafe.data.pais), asText(cafe.data.proceso)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="text-sm text-muted">
                  {asList(cafe.data.notas).join(" · ")}
                </p>
                {cafe.data.puntuacion ? (
                  <p className="font-mono text-xs tabular-nums">
                    {asText(cafe.data.puntuacion)} SCA
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function CafesPage({ searchParams }: PageProps<"/cafes">) {
  return (
    <div className="space-y-8">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-display text-4xl">Cafés</h1>
        <p className="text-muted">
          Todo lo que ha pasado por el molino esta temporada. Ordenados por
          puntuación.
        </p>
      </header>

      <Suspense
        fallback={<p className="py-10 text-muted">Cargando cafés…</p>}
      >
        <Resultados searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
