import { useState } from 'react';
import { TOOL_IMAGE_PLACEHOLDER } from '../constants/images';

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** grid = cover crop; pdp = larger hero, still cover */
  variant?: 'grid' | 'pdp';
  loading?: 'lazy' | 'eager';
};

/**
 * Renders a tool photo with a consistent “coming soon” fallback (retail / catalog style).
 * If a real `src` fails to load, falls back to the placeholder once.
 */
export function ToolImage({ src, alt, className, variant = 'grid', loading = 'lazy' }: Props) {
  const [loadFailed, setLoadFailed] = useState(false);
  const trimmed = src?.trim() ?? '';
  const hasCustom = trimmed.length > 0;
  const url = !hasCustom || loadFailed ? TOOL_IMAGE_PLACEHOLDER : trimmed;

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      data-variant={variant}
      loading={loading}
      onError={() => {
        if (hasCustom) setLoadFailed(true);
      }}
    />
  );
}
