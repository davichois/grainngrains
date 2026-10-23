import type { Metadata } from "next";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { couponsView, settingsView } from "@/src/lib/admin/queries";
import { dbReady } from "@/src/lib/db/supabase";
import { Card, DbNotice, fieldCls, labelCls } from "@/src/components/admin/ui";
import { cookies } from "next/headers";
import ActionForm from "@/src/components/admin/ActionForm";
import TextSizeSwitch from "@/src/components/admin/TextSizeSwitch";
import ThemeSwitch from "@/src/components/admin/ThemeSwitch";
import { TEXT_COOKIE, THEME_COOKIE, readTextSize, readTheme } from "@/src/lib/admin/theme";
import { saveContact, savePromo, saveShipping } from "../actions/settings";
import { saveTranslationMode } from "../actions/translate";
import Select from "@/src/components/admin/Select";

export const metadata: Metadata = { title: "Ajustes" };

const env = (k: string) => Boolean(process.env[k]);

export default async function SettingsPage() {
  await requireAdmin();
  const ready = dbReady();
  const [{ shop, contact, promo, translation }, allCoupons, jar] = await Promise.all([settingsView(), couponsView(), cookies()]);
  const coupons = allCoupons.filter((c) => !c.hidden && c.coupon.active !== false);

  const status = [
    { label: "Supabase (base de datos)", ok: ready, hint: "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY" },
    { label: "Mercado Pago", ok: env("MP_ACCESS_TOKEN") && env("NEXT_PUBLIC_MP_PUBLIC_KEY"), hint: "MP_ACCESS_TOKEN y NEXT_PUBLIC_MP_PUBLIC_KEY" },
    { label: "Firma del webhook de Mercado Pago", ok: env("MP_WEBHOOK_SECRET"), hint: "MP_WEBHOOK_SECRET" },
    { label: "Correos (Resend)", ok: env("RESEND_API_KEY") && env("ORDERS_EMAIL_FROM"), hint: "RESEND_API_KEY y ORDERS_EMAIL_FROM" },
    { label: "Límites de cupones (Upstash)", ok: env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN"), hint: "UPSTASH_REDIS_REST_URL y _TOKEN" },
    { label: "Subida de archivos (n8n → Drive)", ok: env("N8N_UPLOAD_WEBHOOK_URL"), hint: "N8N_UPLOAD_WEBHOOK_URL" },
    { label: "Borrado de fotos (n8n → Drive)", ok: env("N8N_DELETE_WEBHOOK_URL"), hint: "N8N_DELETE_WEBHOOK_URL" },
    { label: "Traducción con Claude", ok: env("ANTHROPIC_API_KEY"), hint: "ANTHROPIC_API_KEY" },
    { label: "URL pública del sitio", ok: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"), hint: "NEXT_PUBLIC_SITE_URL=https://grainngrains.org" },
  ];

  return (
    <>
      {!ready && <DbNotice />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Apariencia" className="lg:col-span-2">
          <p className="mb-4 text-xs text-adm-muted">Solo cambia el panel y se guarda en este navegador.</p>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className={labelCls}>Tema</p>
              <ThemeSwitch initial={readTheme(jar.get(THEME_COOKIE)?.value)} />
            </div>
            <div>
              <p className={labelCls}>Tamaño de letra</p>
              <TextSizeSwitch initial={readTextSize(jar.get(TEXT_COOKIE)?.value)} />
            </div>
          </div>
        </Card>

        <Card title="Traducción" className="lg:col-span-2">
          <ActionForm action={saveTranslationMode}>
            <label className="flex cursor-pointer items-center justify-between gap-3 border border-adm-line px-4 py-3.5 hover:border-adm-faint">
              <span>
                <span className="block font-semibold">Traducción manual</span>
                <span className="text-xs text-adm-muted">
                  Activada: escribes cada idioma en su campo, como hasta ahora. Desactivada: solo escribes el español y el botón
                  «Traducir automáticamente» completa los demás idiomas con Claude.
                </span>
              </span>
              <input type="checkbox" name="manual" defaultChecked={translation.manual === true} className="h-6 w-6 shrink-0 accent-[#0FC0FC]" />
            </label>
            {!env("ANTHROPIC_API_KEY") && (
              <p className="text-xs text-adm-muted">
                Para traducir con Claude agrega <code>ANTHROPIC_API_KEY</code> al <code>.env</code> (se crea en console.anthropic.com → API Keys).
              </p>
            )}
          </ActionForm>
        </Card>

        <Card title="Contacto">
          <ActionForm action={saveContact}>
            <label className="block"><span className={labelCls}>Teléfono (como se muestra)</span><input name="phone" defaultValue={contact.phone} className={fieldCls} /></label>
            <label className="block"><span className={labelCls}>WhatsApp (con código de país, sin +)</span><input name="whatsapp" defaultValue={contact.whatsapp} inputMode="numeric" className={fieldCls} /></label>
            <label className="block"><span className={labelCls}>Correo</span><input name="email" type="email" defaultValue={contact.email} className={fieldCls} /></label>
          </ActionForm>
        </Card>

        <Card title="Modal de promoción">
          <ActionForm action={savePromo}>
            <label className="flex cursor-pointer items-center justify-between gap-3 border border-adm-line px-4 py-3.5 hover:border-adm-faint">
              <span>
                <span className="block font-semibold">Mostrar el modal</span>
                <span className="text-xs text-adm-muted">Sale en las páginas internas (no en el inicio, productos ni checkout).</span>
              </span>
              <input type="checkbox" name="enabled" defaultChecked={promo.enabled} className="h-6 w-6 accent-[#0FC0FC]" />
            </label>
            <label className="block">
              <span className={labelCls}>Cupón que muestra</span>
              <Select name="code" defaultValue={promo.code} className={`${fieldCls} tabular-nums tracking-wide`}>
                {!coupons.some((c) => c.code === promo.code) && <option value={promo.code}>{promo.code} (no está activo)</option>}
                {coupons.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
              </Select>
            </label>
          </ActionForm>
        </Card>

        <Card title="Envíos" className="lg:col-span-2">
          <ActionForm action={saveShipping}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="col-span-2 block sm:col-span-1"><span className={labelCls}>Envío gratis desde (S/)</span><input name="freeFrom" inputMode="decimal" defaultValue={shop.freeShippingFrom} className={fieldCls} /></label>
              <label className="block"><span className={labelCls}>Tarifa Lima y Callao (S/)</span><input name="limaRate" inputMode="decimal" defaultValue={shop.rates.lima} className={fieldCls} /></label>
              <label className="block"><span className={labelCls}>Tarifa provincias (S/)</span><input name="provRate" inputMode="decimal" defaultValue={shop.rates.provinces} className={fieldCls} /></label>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="block"><span className={labelCls}>Lima · días mín.</span><input name="limaMin" inputMode="numeric" defaultValue={shop.days.lima.min} className={fieldCls} /></label>
              <label className="block"><span className={labelCls}>Lima · días máx.</span><input name="limaMax" inputMode="numeric" defaultValue={shop.days.lima.max} className={fieldCls} /></label>
              <label className="block"><span className={labelCls}>Provincias · días mín.</span><input name="provMin" inputMode="numeric" defaultValue={shop.days.provinces.min} className={fieldCls} /></label>
              <label className="block"><span className={labelCls}>Provincias · días máx.</span><input name="provMax" inputMode="numeric" defaultValue={shop.days.provinces.max} className={fieldCls} /></label>
            </div>
          </ActionForm>
        </Card>

        <Card title="Conexiones" className="lg:col-span-2">
          <p className="mb-4 text-sm text-adm-muted">Solo se muestra si cada servicio está configurado en el <code>.env</code> del servidor; las claves nunca se muestran.</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {status.map((s) => (
              <li key={s.label} className="flex items-start gap-3 border border-adm-line px-4 py-3.5">
                {s.ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-adm-ink" /> : <CircleDashed size={18} className="mt-0.5 shrink-0 text-adm-muted" />}
                <span>
                  <span className="block text-sm font-semibold">{s.label}</span>
                  <span className="text-xs text-adm-muted">{s.ok ? "Configurado" : `Falta: ${s.hint}`}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
