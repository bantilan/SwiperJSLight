import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(async () => {
  await import('../swiperlight-element-bundle.js');
});

describe('swiper custom elements minimal bundle', () => {
  it('registers custom elements', () => {
    expect(customElements.get('swiper-container')).toBeTruthy();
    expect(customElements.get('swiper-slide')).toBeTruthy();
  });

  it('renders base container structure when connected', () => {
    const el = document.createElement('swiper-container');
    document.body.appendChild(el);

    const root = el.shadowRoot;
    expect(root).toBeTruthy();
    expect(root.querySelector('.swiper')).toBeTruthy();
    expect(root.querySelector('.swiper-wrapper')).toBeTruthy();
  });

  it('renders navigation and pagination controls when enabled', () => {
    const el = document.createElement('swiper-container');
    el.setAttribute('navigation', 'true');
    el.setAttribute('pagination', 'true');
    document.body.appendChild(el);

    const root = el.shadowRoot;
    expect(root.querySelector('.swiper-button-prev')).toBeTruthy();
    expect(root.querySelector('.swiper-button-next')).toBeTruthy();
    expect(root.querySelector('.swiper-pagination')).toBeTruthy();
  });

  it('changes active pagination bullet when moving slides', () => {
    const el = document.createElement('swiper-container');
    el.setAttribute('pagination', 'true');
    el.innerHTML = `
      <swiper-slide>Slide 1</swiper-slide>
      <swiper-slide>Slide 2</swiper-slide>
      <swiper-slide>Slide 3</swiper-slide>
    `;
    document.body.appendChild(el);

    el.next();

    const bullets = el.shadowRoot.querySelectorAll('.swiper-pagination-bullet');
    expect(bullets).toHaveLength(3);
    expect(bullets[1].classList.contains('swiper-pagination-bullet-active')).toBe(true);
  });
});
