import { beforeAll, describe, expect, it, vi } from 'vitest';

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

  it('recomputes slidesPerView on breakpoint resize in both directions', () => {
    const initialWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 550 });

    const el = document.createElement('swiper-container');
    el.setAttribute('slides-per-view', '1');
    el.setAttribute('breakpoints', '{"0":{"slidesPerView":3},"1250":{"slidesPerView":5}}');
    el.innerHTML = `
      <swiper-slide>Slide 1</swiper-slide>
      <swiper-slide>Slide 2</swiper-slide>
      <swiper-slide>Slide 3</swiper-slide>
      <swiper-slide>Slide 4</swiper-slide>
      <swiper-slide>Slide 5</swiper-slide>
    `;
    document.body.appendChild(el);

    expect(el.style.getPropertyValue('--swiper-slides-per-view')).toBe('3');

    window.innerWidth = 1250;
    window.dispatchEvent(new Event('resize'));
    expect(el.style.getPropertyValue('--swiper-slides-per-view')).toBe('5');

    window.innerWidth = initialWidth;
    window.dispatchEvent(new Event('resize'));
  });

  it('autoplays to the next slide', () => {
    vi.useFakeTimers();

    const el = document.createElement('swiper-container');
    el.setAttribute('pagination', 'true');
    el.setAttribute('autoplay', 'true');
    el.setAttribute('autoplay-delay', '10');
    el.innerHTML = `
      <swiper-slide>Slide 1</swiper-slide>
      <swiper-slide>Slide 2</swiper-slide>
      <swiper-slide>Slide 3</swiper-slide>
    `;
    document.body.appendChild(el);

    vi.advanceTimersByTime(11);

    const bullets = el.shadowRoot.querySelectorAll('.swiper-pagination-bullet');
    expect(bullets[1].classList.contains('swiper-pagination-bullet-active')).toBe(true);

    vi.useRealTimers();
  });

  it('loops seamlessly from last to first and first to last', () => {
    const el = document.createElement('swiper-container');
    el.setAttribute('pagination', 'true');
    el.setAttribute('loop', 'true');
    el.setAttribute('slides-per-view', '3');
    el.innerHTML = `
      <swiper-slide>Slide 1</swiper-slide>
      <swiper-slide>Slide 2</swiper-slide>
      <swiper-slide>Slide 3</swiper-slide>
      <swiper-slide>Slide 4</swiper-slide>
      <swiper-slide>Slide 5</swiper-slide>
      <swiper-slide>Slide 6</swiper-slide>
      <swiper-slide>Slide 7</swiper-slide>
      <swiper-slide>Slide 8</swiper-slide>
      <swiper-slide>Slide 9</swiper-slide>
    `;
    document.body.appendChild(el);

    const wrapper = el.shadowRoot.querySelector('.swiper-wrapper');
    expect(wrapper.children.length).toBe(15);

    el.slideTo(8);
    el.next();
    wrapper.dispatchEvent(new Event('transitionend'));
    const bulletsAfterRightWrap = el.shadowRoot.querySelectorAll('.swiper-pagination-bullet');
    expect(bulletsAfterRightWrap[0].classList.contains('swiper-pagination-bullet-active')).toBe(true);

    el.slideTo(0);
    el.prev();
    wrapper.dispatchEvent(new Event('transitionend'));
    const bulletsAfterLeftWrap = el.shadowRoot.querySelectorAll('.swiper-pagination-bullet');
    expect(bulletsAfterLeftWrap[8].classList.contains('swiper-pagination-bullet-active')).toBe(true);
  });

  it('keeps looping even if transitionend is missed', () => {
    vi.useFakeTimers();

    const el = document.createElement('swiper-container');
    el.setAttribute('pagination', 'true');
    el.setAttribute('loop', 'true');
    el.setAttribute('speed', '1');
    el.setAttribute('slides-per-view', '3');
    el.innerHTML = `
      <swiper-slide>Slide 1</swiper-slide>
      <swiper-slide>Slide 2</swiper-slide>
      <swiper-slide>Slide 3</swiper-slide>
      <swiper-slide>Slide 4</swiper-slide>
      <swiper-slide>Slide 5</swiper-slide>
      <swiper-slide>Slide 6</swiper-slide>
      <swiper-slide>Slide 7</swiper-slide>
      <swiper-slide>Slide 8</swiper-slide>
      <swiper-slide>Slide 9</swiper-slide>
    `;
    document.body.appendChild(el);

    el.slideTo(8);
    for (let i = 0; i < 8; i += 1) {
      el.next();
      vi.advanceTimersByTime(40);
    }

    const active = Array.from(el.shadowRoot.querySelectorAll('.swiper-pagination-bullet'))
      .findIndex(b => b.classList.contains('swiper-pagination-bullet-active'));
    expect(active).toBeGreaterThanOrEqual(0);

    vi.useRealTimers();
  });

  it('keeps looping with autoplay-delay 0 without starving loop normalization', () => {
    vi.useFakeTimers();

    const el = document.createElement('swiper-container');
    el.setAttribute('pagination', 'true');
    el.setAttribute('loop', 'true');
    el.setAttribute('autoplay', 'true');
    el.setAttribute('autoplay-delay', '0');
    el.setAttribute('autoplay-disable-on-interaction', 'false');
    el.setAttribute('speed', '20');
    el.setAttribute('slides-per-view', '3');
    el.innerHTML = `
      <swiper-slide>Slide 1</swiper-slide>
      <swiper-slide>Slide 2</swiper-slide>
      <swiper-slide>Slide 3</swiper-slide>
      <swiper-slide>Slide 4</swiper-slide>
      <swiper-slide>Slide 5</swiper-slide>
      <swiper-slide>Slide 6</swiper-slide>
      <swiper-slide>Slide 7</swiper-slide>
      <swiper-slide>Slide 8</swiper-slide>
      <swiper-slide>Slide 9</swiper-slide>
    `;
    document.body.appendChild(el);

    vi.advanceTimersByTime(600);

    const active = Array.from(el.shadowRoot.querySelectorAll('.swiper-pagination-bullet'))
      .findIndex(b => b.classList.contains('swiper-pagination-bullet-active'));
    expect(active).toBeGreaterThanOrEqual(0);

    vi.useRealTimers();
  });
});
