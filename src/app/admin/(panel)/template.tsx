/* Se vuelve a montar en cada cambio de página: la nueva vista entra con
   una transición suave (ver .adm-page en admin.css) */
export default function PanelTemplate({ children }: { children: React.ReactNode }) {
  return <div className="adm-page">{children}</div>;
}
