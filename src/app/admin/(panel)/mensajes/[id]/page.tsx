import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { getMessage } from "@/src/lib/admin/queries";
import { Badge, Card, dateTime, fieldCls, labelCls } from "@/src/components/admin/ui";
import ActionForm from "@/src/components/admin/ActionForm";
import ReplyLink from "@/src/components/admin/ReplyLink";
import { updateMessage } from "../../actions/messages";
import { TYPE_LABEL } from "@/src/lib/admin/labels";
import Select from "@/src/components/admin/Select";

export const metadata: Metadata = { title: "Mensaje" };

export default async function MessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const m = await getMessage(id);
  if (!m) notFound();
  const phone = m.phone?.replace(/\D/g, "") ?? "";
  const subject = `Re: ${TYPE_LABEL[m.type] ?? "Tu mensaje"} · Grain & Grains`;

  return (
    <>
      <Link href="/admin/mensajes" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-adm-muted hover:text-adm-ink">
        <ArrowLeft size={16} /> Mensajes
      </Link>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-adm-line2 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-adm-sub">{TYPE_LABEL[m.type] ?? m.type}</span>
            <Badge status={m.status} />
            <span className="ml-auto text-xs text-adm-muted">{dateTime(m.created_at)}</span>
          </div>
          <h1 className="mt-4 break-words text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{m.name}</h1>
          {m.company && <p className="mt-1 font-semibold text-adm-sub">{m.company}{m.country && ` · ${m.country}`}</p>}
          {m.volume && <p className="mt-1 text-sm text-adm-muted">Volumen estimado: <strong>{m.volume}</strong></p>}
          <div className="mt-6 whitespace-pre-wrap border-l-2 border-adm-line3 bg-adm-subtle px-5 py-4 text-[0.9375rem] leading-relaxed">{m.message}</div>
          <div className="mt-5 flex flex-wrap gap-2">
            <ReplyLink id={m.id} href={`mailto:${m.email}?subject=${encodeURIComponent(subject)}`} icon={<Mail size={15} />} label={`Responder a ${m.email}`} />
            {phone && (
              <>
                <ReplyLink id={m.id} href={`https://wa.me/${phone}`} icon={<MessageCircle size={15} />} label="WhatsApp" external />
                <a href={`tel:+${phone}`} className="inline-flex items-center gap-2 border border-adm-line3 bg-adm-surface px-3.5 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-adm-ink transition-colors hover:border-adm-strong"><Phone size={15} /> {m.phone}</a>
              </>
            )}
          </div>
        </Card>

        <Card title="Seguimiento">
          <ActionForm action={updateMessage}>
            <input type="hidden" name="id" value={m.id} />
            <label className="block">
              <span className={labelCls}>Estado</span>
              <Select name="status" defaultValue={m.status} className={`${fieldCls} cursor-pointer`}>
                <option value="new">Nuevo</option>
                <option value="replied">Respondido</option>
                <option value="closed">Cerrado</option>
              </Select>
            </label>
            <label className="block">
              <span className={labelCls}>Notas internas</span>
              <textarea name="notes" rows={5} defaultValue={m.notes ?? ""} className={`${fieldCls} resize-y`} placeholder="Cotización enviada, precio acordado…" />
            </label>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
