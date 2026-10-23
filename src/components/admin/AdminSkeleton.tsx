/* Esqueleto de una página del panel mientras llega la siguiente */
export default function AdminSkeleton() {
  return (
    <div className="adm-skeleton" aria-busy="true" aria-label="Cargando">
      <div className="mb-8 border-b border-adm-line pb-8">
        <div className="adm-bone h-2.5 w-24" />
        <div className="adm-bone mt-4 h-8 w-64 max-w-full" />
        <div className="adm-bone mt-4 h-3 w-[32rem] max-w-full" />
        <div className="adm-bone mt-2 h-3 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="border border-adm-line p-5">
            <div className="adm-bone h-2.5 w-20" />
            <div className="adm-bone mt-5 h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-4 border border-adm-line">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-adm-line px-5 py-4 last:border-0">
            <div className="adm-bone h-12 w-12 shrink-0" />
            <div className="flex-1">
              <div className="adm-bone h-3.5 w-48 max-w-full" />
              <div className="adm-bone mt-2.5 h-2.5 w-72 max-w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
