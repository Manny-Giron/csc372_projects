import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { ToolImage } from '../components/ToolImage';
import type { Tool } from '../types';

function toolsListLink(category: string, searchQ: string) {
  const p = new URLSearchParams();
  if (category && category !== 'all') p.set('category', category);
  if (searchQ.trim()) p.set('search', searchQ.trim());
  const q = p.toString();
  return q ? `/tools?${q}` : '/tools';
}

export function ToolsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'all';
  const searchRaw = searchParams.get('search') || '';
  const search = searchRaw.toLowerCase();
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<{ key: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState(searchRaw);

  useEffect(() => {
    setSearchDraft(searchRaw);
  }, [searchRaw]);

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

  const categoryTitle =
    category === 'all'
      ? 'All tools'
      : categories.find((c) => c.key === category)?.name || category;

  function applySearch(e?: FormEvent) {
    e?.preventDefault();
    const next = new URLSearchParams();
    if (category && category !== 'all') next.set('category', category);
    const q = searchDraft.trim();
    if (q) next.set('search', q);
    setSearchParams(next, { replace: true });
  }

  return (
    <div id="CategoryPage">
      <div className="page-hero">
        <h1>Browse tools</h1>
        <p className="subtext">
          Filter by category, search by name or description, then open a tool for
          details and rental options.
        </p>
      </div>
      <div className="categories-layout">
        <aside className="category-sidebar">
          <div className="sidebar-title-row">
            <h2 className="sidebar-title">Categories</h2>
            <span className="sidebar-badge">{filtered.length} shown</span>
          </div>
          <nav className="category-nav" aria-label="Tool categories">
            <Link
              to={toolsListLink('all', searchRaw)}
              className={`category-link ${category === 'all' ? 'active' : ''}`}
            >
              All tools
            </Link>
            {categories.map((c) => (
              <Link
                key={c.key}
                to={toolsListLink(c.key, searchRaw)}
                className={`category-link ${category === c.key ? 'active' : ''}`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
          <p className="sidebar-help">
            Tip: combine category filters with the search box to narrow results
            like the original Rocket Rentals site.
          </p>
        </aside>
        <div className="category-content">
          <div className="content-toolbar">
            <h2 id="tools-heading">{categoryTitle}</h2>
            <div className="toolbar-actions">
              <form className="search-wrap" onSubmit={applySearch} role="search">
                <label htmlFor="tools-search" className="sr-only">
                  Search tools
                </label>
                <input
                  id="tools-search"
                  name="search"
                  type="search"
                  placeholder="Search by name or description"
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                />
                <button type="submit" className="btn-search">
                  Search
                </button>
              </form>
            </div>
          </div>
          <p className="content-desc">
            {searchRaw
              ? `Showing results matching “${searchRaw}” in this category.`
              : 'Pick a tool to see daily rate, deposit, and availability.'}
          </p>
          {error && <p className="error-banner">{error}</p>}
          <div className="tool-grid" role="list" aria-labelledby="tools-heading">
            {filtered.map((t) => (
              <Link
                key={t.id}
                to={`/tools/item/${t.slug}`}
                className="tool-card"
                role="listitem"
              >
                <div className="tool-card__media">
                  <ToolImage
                    src={t.image_url}
                    alt={t.name}
                    className="tool-card__img"
                    variant="grid"
                    loading="lazy"
                  />
                </div>
                <div className="tool-card__body">
                  <div className="card-top">
                    <h3>{t.name}</h3>
                    <span className="pill">{t.category_name}</span>
                  </div>
                  <p className="tool-meta">
                    <span>${Number(t.daily_rate).toFixed(2)}/day</span>
                    <span className="meta-dot">·</span>
                    <span>{Number(t.available_units)} in stock</span>
                  </p>
                  <div className="card-cta-row">
                    <span className="card-cta">View details</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {!error && filtered.length === 0 && (
            <p className="content-desc">
              No tools match your search. Try different keywords or pick another
              category.
            </p>
          )}
          <p className="page-footer">
            Prices and availability may change. Confirm on the tool page before
            checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
