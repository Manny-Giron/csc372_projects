import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ToolImage } from '../components/ToolImage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import type { Tool } from '../types';

export function ToolDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { addTool } = useCart();
  const nav = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api<{ tool: Tool }>(`/api/tools/slug/${encodeURIComponent(slug)}`);
        if (!cancelled) setTool(data.tool);
      } catch {
        if (!cancelled) setError('Tool not found');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error || !tool) {
    return (
      <div className="page-pad">
        <p>{error || 'Loading…'}</p>
        <Link to="/tools">Back to tools</Link>
      </div>
    );
  }

  const available = Number(tool.available_units);

  function handleAdd() {
    if (!tool) return;
    if (!user) {
      nav('/login', { state: { from: `/tools/item/${slug}` } });
      return;
    }
    if (available < qty) {
      alert('Not enough units available.');
      return;
    }
    addTool(tool.id, qty, tool.name);
    nav('/cart');
  }

  return (
    <div className="tool-detail">
      <div className="page-pad tool-detail__inner">
        <Link to="/tools" className="tool-detail__back">
          ← Back to tools
        </Link>

        <div className="tool-detail__grid">
          <div className="tool-detail__gallery">
            <div className="tool-detail__image-frame">
              <ToolImage
                src={tool.image_url}
                alt={tool.name}
                className="tool-detail__hero-img"
                variant="pdp"
                loading="eager"
              />
            </div>
            {tool.type_name ? (
              <p className="tool-detail__type-hint fine-print">Type: {tool.type_name}</p>
            ) : null}
          </div>

          <div className="tool-detail__buy">
            <p className="tool-detail__eyebrow">{tool.category_name}</p>
            <h1 className="tool-detail__title">{tool.name}</h1>
            <div className="tool-detail__price-block">
              <span className="tool-detail__price">
                ${Number(tool.daily_rate).toFixed(2)}
              </span>
              <span className="tool-detail__price-unit"> / day</span>
            </div>
            <p className="tool-detail__deposit">
              Deposit <strong>${Number(tool.deposit).toFixed(2)}</strong>
            </p>
            <p className="tool-detail__stock">
              {available} {available === 1 ? 'unit' : 'units'} available to rent
            </p>
            {tool.delivery_only ? (
              <p className="tool-detail__note note">Delivery + pickup only</p>
            ) : null}

            <div className="tool-detail__desc">
              <h2 className="tool-detail__section-title">Description</h2>
              <p className="tool-desc">{tool.description}</p>
            </div>

            <div className="tool-detail__actions add-row">
              <label className="tool-detail__qty">
                Qty{' '}
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, available)}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value) || 1)}
                />
              </label>
              <button type="button" className="btn-primary tool-detail__cta" onClick={handleAdd}>
                {user ? 'Add to cart' : 'Sign in to add to cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
