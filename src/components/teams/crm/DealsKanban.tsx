import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Phone, Building2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: 'new' | 'in_progress' | 'won' | 'lost';
  owner?: string;
}

const initialDeals: Deal[] = [
  { id: '1', title: 'Webfejlesztés csomag', company: 'Alpha Kft.', value: 1800000, stage: 'new', owner: 'János' },
  { id: '2', title: 'Karbantartási szerződés', company: 'Beta Zrt.', value: 950000, stage: 'in_progress', owner: 'Anna' },
  { id: '3', title: 'Mobil app fejlesztés', company: 'Gamma Bt.', value: 5200000, stage: 'in_progress', owner: 'Kata' },
  { id: '4', title: 'UI/UX redesign', company: 'Delta Kft.', value: 1200000, stage: 'won', owner: 'Tom' },
  { id: '5', title: 'CRM bevezetés', company: 'Epsilon Kft.', value: 2800000, stage: 'lost', owner: 'Béla' },
];

const columns = [
  { id: 'new', title: 'Új', hint: 'Új megkeresések' },
  { id: 'in_progress', title: 'Folyamatban', hint: 'Tárgyalás alatt' },
  { id: 'won', title: 'Megnyert', hint: 'Sikeres lezárások' },
  { id: 'lost', title: 'Elvesztett', hint: 'Sikertelen ügyletek' },
] as const;

export const DealsKanban: React.FC = () => {
  const [query, setQuery] = useState('');
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return deals;
    const q = query.toLowerCase();
    return deals.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.company.toLowerCase().includes(q)
    );
  }, [deals, query]);

  const totals = useMemo(() => {
    return columns.reduce((acc, c) => {
      const items = filtered.filter(d => d.stage === c.id);
      acc[c.id] = {
        count: items.length,
        sum: items.reduce((s, d) => s + d.value, 0)
      };
      return acc;
    }, {} as Record<string, { count: number; sum: number }>);
  }, [filtered]);

  const addQuickDeal = () => {
    setAdding(true);
    setTimeout(() => {
      setDeals(prev => [
        { id: Date.now().toString(), title: 'Új lehetőség', company: 'Ismeretlen', value: 0, stage: 'new' },
        ...prev,
      ]);
      setAdding(false);
    }, 600);
  };

  return (
    <section aria-labelledby="deals-title" className="space-y-4 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h2 id="deals-title" className="text-xl font-semibold text-foreground">Értékesítési Csővezeték</h2>
          <p className="text-sm text-muted-foreground">Dealek kezelése szakaszok szerint</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Keresés..."
              className="pl-8 pr-3 py-2 rounded-md bg-muted text-foreground placeholder:text-muted-foreground/70 border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Deal keresés"
            />
          </div>
          <button
            onClick={addQuickDeal}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors hover-scale"
            aria-label="Új deal hozzáadása"
            disabled={adding}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Gyors deal
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map(col => (
          <article key={col.id} className="bg-card border border-border rounded-lg p-4">
            <header className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-foreground">{col.title}</h3>
                <p className="text-xs text-muted-foreground">{col.hint}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">{totals[col.id]?.count ?? 0} db</div>
                <div className="text-sm font-medium text-foreground">{(totals[col.id]?.sum ?? 0).toLocaleString('hu-HU')} Ft</div>
              </div>
            </header>

            <div className="space-y-3 min-h-[120px]">
              {filtered.filter(d => d.stage === col.id).map(d => (
                <div key={d.id} className="rounded-md border border-border bg-muted/40 p-3 animate-fade-in hover-scale">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-foreground">{d.title}</div>
                    <div className="text-xs text-muted-foreground">{d.value.toLocaleString('hu-HU')} Ft</div>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {d.company}
                    </div>
                    {d.stage === 'won' ? (
                      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Nyert
                      </span>
                    ) : d.stage === 'lost' ? (
                      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                        <XCircle className="h-3.5 w-3.5" /> Vesztes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {d.owner || '—'}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {filtered.filter(d => d.stage === col.id).length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-md">
                  Nincs elem
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default DealsKanban;
