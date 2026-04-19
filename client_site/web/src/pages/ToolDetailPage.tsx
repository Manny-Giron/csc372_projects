import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
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
    <div className="page-pad tool-detail">
      <Link to="/tools">← Back to tools</Link>
      <h1>{tool.name}</h1>
      <p className="cat-label">{tool.category_name}</p>
      <p className="tool-desc">{tool.description}</p>
      <p>
        <strong>${Number(tool.daily_rate).toFixed(2)}</strong> / day · Deposit{' '}
        <strong>${Number(tool.deposit).toFixed(2)}</strong>
      </p>
      <p>{available} units available</p>
      {tool.delivery_only ? <p className="note">Delivery + pickup only</p> : null}
      <div className="add-row">
        <label>
          Qty{' '}
          <input
            type="number"
            min={1}
            max={Math.max(1, available)}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
          />
        </label>
        <button type="button" className="btn-primary" onClick={handleAdd}>
          {user ? 'Add to cart' : 'Sign in to add to cart'}
        </button>
      </div>
    </div>
  );
}
