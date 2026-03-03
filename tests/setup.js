import { afterEach, vi } from 'vitest';

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  });
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = callback => setTimeout(callback, 16);
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = id => clearTimeout(id);
}

if (!Object.getOwnPropertyDescriptor(Element.prototype, 'part')) {
  Object.defineProperty(Element.prototype, 'part', {
    configurable: true,
    get() {
      const el = this;
      return {
        add: (...tokens) => {
          const existing = (el.getAttribute('part') || '').split(/\s+/).filter(Boolean);
          const set = new Set(existing);
          tokens.forEach(token => {
            if (token) set.add(token);
          });
          el.setAttribute('part', [...set].join(' '));
        },
        remove: (...tokens) => {
          const tokenSet = new Set(tokens);
          const next = (el.getAttribute('part') || '').split(/\s+/).filter(token => token && !tokenSet.has(token));
          if (next.length > 0) {
            el.setAttribute('part', next.join(' '));
          } else {
            el.removeAttribute('part');
          }
        },
        contains: token => (el.getAttribute('part') || '').split(/\s+/).includes(token)
      };
    },
    set(value) {
      if (value === null || value === undefined || value === '') {
        this.removeAttribute('part');
      } else {
        this.setAttribute('part', String(value));
      }
    }
  });
}

afterEach(() => {
  document.body.innerHTML = '';
});
