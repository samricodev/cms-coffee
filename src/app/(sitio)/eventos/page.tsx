import { Prose } from "@/components/site/prose";
import { Ticket } from "@/components/site/ticket";
import { eyebrow } from "@/components/site/ui";
import { asText, formatDate, formatMoney } from "@/lib/format";
import { getEvents } from "@/lib/public-content";

export const metadata = {
  title: "Eventos",
  description: "Catas, talleres y presentaciones en la barra.",
};

export default async function EventosPage() {
  const { proximos, pasados } = await getEvents();

  return (
    <div className="space-y-14">
      <header className="max-w-2xl space-y-4">
        <h1 className="font-display text-5xl">Eventos</h1>
        <p className="text-lg text-muted">
          Catas y talleres con plazas limitadas. Se reserva en barra.
        </p>
      </header>

      {proximos.length === 0 ? (
        <p className="rounded-sm bg-surface p-6 text-muted">
          No hay nada en la agenda ahora mismo.
        </p>
      ) : (
        <ul className="space-y-5">
          {proximos.map((evento) => (
            <li key={evento.id}>
              <Ticket date={evento.data.fecha}>
                <div className="space-y-3 sm:p-2">
                  <p className={`${eyebrow} text-accent`}>
                    {[formatDate(evento.data.fecha), asText(evento.data.modalidad)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <h2 className="font-display text-3xl leading-tight">{evento.title}</h2>
                  <Prose markdown={evento.data.descripcion} className="max-w-prose" />
                  <p className="font-mono text-sm text-muted">
                    {[
                      formatMoney(evento.data.precio),
                      evento.data.aforo ? `${asText(evento.data.aforo)} plazas` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </Ticket>
            </li>
          ))}
        </ul>
      )}

      {pasados.length > 0 ? (
        <section className="space-y-4">
          <h2 className="border-b border-line pb-3 font-display text-2xl">Ya pasaron</h2>
          <ul className="space-y-2 text-muted">
            {pasados.map((evento) => (
              <li key={evento.id} className="flex flex-wrap gap-4">
                <span className="w-36 shrink-0 font-mono text-sm tabular-nums">
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
