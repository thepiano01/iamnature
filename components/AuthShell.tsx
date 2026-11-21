import ProductArt from "./ProductArt";

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="container-x grid min-h-[calc(100dvh-4rem)] items-center gap-10 py-10 lg:grid-cols-2">
      <div className="mesh relative hidden h-full min-h-[560px] overflow-hidden rounded-[2.5rem] p-10 lg:flex lg:flex-col lg:justify-between">
        <p className="text-sm font-bold text-forest-700">나는자연산이다</p>
        <div className="relative">
          <div className="mb-8 flex gap-3">
            {["HERB", "ROOT", "MUSHROOM", "FRUIT"].map((c, i) => (
              <ProductArt key={c} category={c} className={`h-20 w-20 rounded-3xl shadow-[var(--shadow-card)] ${i % 2 ? "translate-y-4" : ""}`} />
            ))}
          </div>
          <p className="text-4xl font-extrabold leading-tight tracking-[-0.03em] text-bark-900">
            내 몸에 맞는
            <br />
            <span className="text-forest-700">진짜 자연산</span>,
            <br />
            골라드릴게요.
          </p>
          <p className="mt-4 max-w-xs text-sm text-bark-500">건강상태만 알려주시면, 산에서 캔 나물·약초를 매칭해드려요.</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <h1 className="h-serif text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-bark-500">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
