"use client";

import { useState } from "react";
import ActionForm from "./ActionForm";
import { fieldCls, labelCls } from "./ui";
import { updateOrderStatus } from "@/src/app/admin/(panel)/actions/orders";
import Select from "./Select";

const OPTIONS = [
  ["pending", "Pago pendiente"],
  ["paid", "Pagado · por preparar"],
  ["preparing", "Preparando"],
  ["shipped", "Enviado"],
  ["delivered", "Entregado"],
  ["cancelled", "Cancelado"],
  ["refunded", "Reembolsado"],
  ["rejected", "Pago rechazado"],
] as const;

/** Cambiar estado. Al elegir "Enviado" aparecen la empresa, el código de
 *  seguimiento y la opción de avisar al cliente por correo */
export default function OrderStatusForm({
  number,
  status,
  carrier,
  tracking,
}: {
  number: string;
  status: string;
  carrier: string | null;
  tracking: string | null;
}) {
  const [value, setValue] = useState(status);
  const shipping = value === "shipped" || value === "delivered";
  return (
    <ActionForm action={updateOrderStatus} submit="Actualizar pedido">
      <input type="hidden" name="number" value={number} />
      <label className="block">
        <span className={labelCls}>Estado</span>
        <Select
          name="status"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${fieldCls} cursor-pointer`}
        >
          {OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </label>
      {shipping && (
        <div className="soft-fade grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Empresa de envío</span>
            <input name="carrier" defaultValue={carrier ?? ""} placeholder="Olva, Shalom, Urbano…" className={fieldCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Código de seguimiento</span>
            <input name="tracking" defaultValue={tracking ?? ""} className={fieldCls} />
          </label>
        </div>
      )}
      {!shipping && (
        <>
          <input type="hidden" name="carrier" value={carrier ?? ""} />
          <input type="hidden" name="tracking" value={tracking ?? ""} />
        </>
      )}
      {value === "shipped" && (
        <label className="flex cursor-pointer items-center gap-3 border border-adm-line px-4 py-3 text-[0.8125rem] font-medium hover:border-adm-faint">
          <input type="checkbox" name="notify" defaultChecked className="h-5 w-5 accent-[#0FC0FC]" />
          Avisar al cliente por correo que su pedido va en camino
        </label>
      )}
      <label className="block">
        <span className={labelCls}>Nota para el historial (opcional)</span>
        <input name="note" maxLength={300} className={fieldCls} />
      </label>
    </ActionForm>
  );
}
