import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PortalShell from '@/components/portal/PortalShell';
import { PROFILED, getMember } from '@/lib/team';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PROFILED.map((m) => ({ slug: m.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const m = getMember((await params).slug);
  if (!m?.profile) return {};
  return {
    title: `${m.name} · Secretaría de Energía · Fuerza del Pueblo`,
    description: `${m.pos}. ${m.desc}`,
    openGraph: { title: m.name, description: m.pos, images: m.photo ? [m.photo] : undefined },
  };
}

function Block({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mb-10">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a6b3c] mb-4">{title}</h2>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it} className="flex gap-3 text-[15px] leading-relaxed text-[#374151]">
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2d9e5f]" aria-hidden="true" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function TeamMemberPage({ params }: Params) {
  const m = getMember((await params).slug);
  if (!m?.profile) notFound();
  const p = m.profile;
  const others = PROFILED.filter((o) => o.slug !== m.slug);

  return (
    <PortalShell>
      <main className="min-h-screen bg-white">
        {/* Encabezado con foto: el fondo oscuro llega hasta arriba, bajo el encabezado fijo transparente */}
        <div style={{ background: 'linear-gradient(180deg, #0a2e19 0%, #1a6b3c 100%)' }}>
          <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-12 sm:pb-16" style={{ paddingTop: 120 }}>
            <Link href="/#leadership" className="text-[13px] font-medium text-white/75 hover:text-white no-underline">
              ← Volver al equipo
            </Link>
            <div className="mt-8 flex flex-col sm:flex-row items-center sm:items-end gap-8">
              <div className="relative w-48 sm:w-56 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl" style={{ aspectRatio: '3 / 3.5', background: m.bg }}>
                {m.photo
                  ? <img src={m.photo} alt={m.name} className="absolute inset-0 h-full w-full object-cover" />
                  : <div className="absolute inset-0 flex items-center justify-center text-5xl font-extrabold text-white/30">{m.initials}</div>}
              </div>
              <div className="text-center sm:text-left text-white">
                <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/70 mb-3">Secretaría de Energía · Fuerza del Pueblo</div>
                <h1 className="text-3xl sm:text-5xl font-bold leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>{m.name}</h1>
                <div className="mt-3 text-base sm:text-lg text-white/85">{m.pos}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
          {p.quote && (
            <blockquote className="mb-12 border-l-4 border-[#2d9e5f] pl-5 text-xl sm:text-2xl font-semibold italic text-[#0a2e19]" style={{ fontFamily: 'var(--font-playfair)' }}>
              «{p.quote}»
            </blockquote>
          )}

          <Block title="En la Secretaría" items={p.roles} />

          {p.statement && (
            <div className="mb-10">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a6b3c] mb-4">{p.statement.title}</h2>
              {p.statement.paragraphs.map((t) => (
                <p key={t} className="text-[15px] leading-relaxed text-[#374151] mb-3">{t}</p>
              ))}
            </div>
          )}

          <Block title="Formación" items={p.education} />
          <Block title="Trayectoria" items={p.experience} />

          {others.length > 0 && (
            <div className="mt-14 border-t border-[#e5e7eb] pt-8">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#6b7280] mb-4">Más del equipo</h2>
              <div className="flex flex-wrap gap-4">
                {others.map((o) => (
                  <Link key={o.slug} href={`/equipo/${o.slug}`} className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] p-3 pr-5 no-underline hover:border-[#2d9e5f] transition-colors">
                    {o.photo
                      ? <img src={o.photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                      : <span className="flex h-12 w-12 items-center justify-center rounded-full text-white font-bold" style={{ background: o.bg }}>{o.initials}</span>}
                    <span>
                      <span className="block text-sm font-semibold text-[#1c1c1e]">{o.name}</span>
                      <span className="block text-xs text-[#1a6b3c]">{o.pos}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <p className="mt-10 text-sm">
            <Link href="/#leadership" className="text-[#1a6b3c] font-semibold">← Ver todo el equipo</Link>
          </p>
        </div>
      </main>
    </PortalShell>
  );
}
