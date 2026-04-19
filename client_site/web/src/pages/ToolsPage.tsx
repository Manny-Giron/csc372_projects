import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Tool } from '../types';

export function ToolsPage() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search')?.toLowerCase() || '';
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<{ key: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cRes, tRes] = await Promise.all([
          api<{ categories: { key: string; name: string }[] }>('/api/categories'),
          api<{ tools: Tool[] }>(`/api/tools?category=${encodeURIComponent(category)}`),
        ]);
        if (!cancelled) {
          setCategories(cRes.categories.map((x) => ({ key: x.key, name: x.name })));
          setTools(tRes.tools);
        }
      } catch {
        if (!cancelled) setError('Could not load tools. Is the API running?');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

  const filtered = useMemo(() => {
    if (!search) return tools;
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
    );
  }, [tools, search]);

  return (
    <div className="tools-page toolCategories">
      <aside className="tools-sidebar">
        <h2>Categories</h2>
        <nav>
          <Link to="/tools" className={category === 'all' ? 'active' : ''}>
            All Tools
          </Link>
          {categories.map((c) => (
            <Link
              key={c.key}
              to={`/tools?category=${c.key}`}
              className={category === c.key ? 'active' : ''}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="tools-main">
        <h1>{category === 'all' ? 'All Tools' : category}</h1>
        {error && <p className="error-banner">{error}</p>}
        <div className="tool-grid">
          {filtered.map((t) => (
            <Link key={t.id} to={`/tools/item/${t.slug}`} className="tool-card">
              <h3>{t.name}</h3>
              <p className="tool-rate">${Number(t.daily_rate).toFixed(2)}/day</p>
              <p className="tool-meta">{t.category_name}</p>
              <p className="tool-units">
                {Number(t.available_units)} available
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
