import type { Freshness } from '../types';

export function freshnessToLabel(f: Freshness): string {
  switch (f) {
    case 'fresh': return '<1 h';
    case 'recent': return '<24 h';
    case 'stale': return '>24 h';
  }
}

export function freshnessVariant(f: Freshness): 'success' | 'warning' | 'danger' {
  switch (f) {
    case 'fresh': return 'success';
    case 'recent': return 'warning';
    case 'stale': return 'danger';
  }
}

export function freshnessIcon(f: Freshness): 'flash' | 'time' | 'alert-circle' {
  switch (f) {
    case 'fresh': return 'flash';
    case 'recent': return 'time';
    case 'stale': return 'alert-circle';
  }
}
