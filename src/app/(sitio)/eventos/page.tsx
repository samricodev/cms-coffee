import { Prose } from "@/components/site/prose";
import { asText, formatDate, formatMoney } from "@/lib/format";
import { getEvents } from "@/lib/public-content";

export const metadata = {
  title: "Eventos",
  description: "Catas, talleres y presentaciones en la barra.",
};

export default async function EventosPage() {
  const { proximos, pasados } = await getEvents();

  return (
    <div className="space-y-12">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-display text-4xl">Eventos</h1>
        <p className="text-muted">
          Catas y talleres con plazas limitadas. Se reserva en barra.
        </p>
      </header>

      {proximos.length === 0 ? (
        <p className="text-muted">No hay nada en la agenda ahora mismo.</p>
      ) : (
        <ul className="space-y-8">
          {proximos.map((evento) => (
            <li key={evento.id} className="space-y-3 border-t border-line pt-6">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-accent">
                {formatDate(evento.data.fecha)}
                {asText(evento.data.modalidad)
                  ? ` · ${asText(evento.data.modalidad)}`
                  : ""}
              </p>
              <h2 className="font-display text-2xl">{evento.title}</h2>
              <Prose markdown={evento.data.descripcion} className="max-w-prose" />
              <p className="font-mono text-xs text-muted">
                {[
                  formatMoney(evento.data.precio),
                  evento.data.aforo ? `${asText(evento.data.aforo)} plazas` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}

      {pasados.length > 0 ? (
        <section className="space-y-3 border-t border-line pt-6">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted">
            Ya pasaron
          </h2>
          <ul className="space-y-1 text-muted">
            {pasados.map((evento) => (
              <li key={evento.id} className="flex flex-wrap gap-3">
                <span className="font-mono text-xs tabular-nums">
                  {formatDate(evento.data.fecha)}
                </span>
                <span>{evento.title}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
