import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(async () => {
  await import('../swiperlight-element-bundle.js');
});

describe('swiper custom elements bundle', () => {
  it('registers custom elements', () => {
    expect(customElements.get('swiper-container')).toBeTruthy();
    expect(customElements.get('swiper-slide')).toBeTruthy();
  });

  it('renders the base swiper container structure', () => {
    const el = document.createElement('swiper-container');
    el.render();

    const root = el.shadowRoot;
    expect(root).toBeTruthy();
    expect(root.querySelector('.swiper')).toBeTruthy();
    expect(root.querySelector('.swiper-wrapper')).toBeTruthy();
  });

  it('renders optional controls when enabled via properties', () => {
    const el = document.createElement('swiper-container');
    el.navigation = true;
    el.pagination = true;
    el.scrollbar = true;
    el.render();

    const root = el.shadowRoot;
    expect(root.querySelector('.swiper-button-prev')).toBeTruthy();
    expect(root.querySelector('.swiper-button-next')).toBeTruthy();
    expect(root.querySelector('.swiper-pagination')).toBeTruthy();
    expect(root.querySelector('.swiper-scrollbar')).toBeTruthy();
  });

  it('renders lazy preloader for swiper-slide with lazy attribute', () => {
    const slide = document.createElement('swiper-slide');
    slide.setAttribute('lazy', 'true');
    document.body.appendChild(slide);

    expect(slide.shadowRoot.querySelector('.swiper-lazy-preloader')).toBeTruthy();
  });
});
