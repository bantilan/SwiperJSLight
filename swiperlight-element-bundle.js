/**
 * Swiper Custom Element (minimal build for local project)
 * Features kept: basic sliding, loop, pagination, navigation (internal/external)
 * License: MIT
 */

(function () {
  'use strict';

  const toBool = value => value !== null && value !== 'false';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  class SwiperSlide extends HTMLElement {
    connectedCallback() {
      if (this.__initialized) return;
      this.__initialized = true;
      if (this.shadowRoot) return;
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<slot></slot>`;
    }
  }

  class SwiperContainer extends HTMLElement {
    static get observedAttributes() {
      return ['navigation', 'pagination', 'loop', 'slides-per-view'];
    }

    constructor() {
      super();
      this._index = 0;
      this._slidesPerView = 1;
      this._loop = false;
      this._showNavigation = false;
      this._showPagination = false;
      this._externalPrev = null;
      this._externalNext = null;
      this._cleanup = [];
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this._readAttributes();
      this._render();
      this._bindExternalNavigation();
      this._observeChildren();
      this._sync();
    }

    disconnectedCallback() {
      this._cleanup.forEach(fn => fn());
      this._cleanup = [];
      if (this._observer) {
        this._observer.disconnect();
        this._observer = null;
      }
    }

    attributeChangedCallback() {
      this._readAttributes();
      this._render();
      this._bindExternalNavigation();
      this._sync();
    }

    next() {
      const count = this._slideCount();
      if (count <= 1) return;
      if (this._loop) {
        this._index = (this._index + 1) % count;
      } else {
        this._index = clamp(this._index + 1, 0, count - 1);
      }
      this._sync();
    }

    prev() {
      const count = this._slideCount();
      if (count <= 1) return;
      if (this._loop) {
        this._index = (this._index - 1 + count) % count;
      } else {
        this._index = clamp(this._index - 1, 0, count - 1);
      }
      this._sync();
    }

    slideTo(index) {
      const count = this._slideCount();
      if (count === 0) return;
      this._index = clamp(index, 0, count - 1);
      this._sync();
    }

    _readAttributes() {
      this._showNavigation = toBool(this.getAttribute('navigation'));
      this._showPagination = toBool(this.getAttribute('pagination'));
      this._loop = toBool(this.getAttribute('loop'));
      this._slidesPerView = Math.max(1, parseInt(this.getAttribute('slides-per-view') || '1', 10) || 1);
    }

    _slideCount() {
      return this.querySelectorAll('swiper-slide').length;
    }

    _render() {
      const withNav = this._showNavigation;
      const withPagination = this._showPagination;

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            position: relative;
            --swiper-theme-color: #007aff;
            --swiper-slides-per-view: ${this._slidesPerView};
            --swiper-nav-size: 36px;
          }

          .swiper {
            width: 100%;
            height: 100%;
            overflow: hidden;
            position: relative;
          }

          .swiper-wrapper {
            display: flex;
            width: 100%;
            height: 100%;
            transition: transform 300ms ease;
            will-change: transform;
          }

          ::slotted(swiper-slide) {
            box-sizing: border-box;
            flex: 0 0 calc(100% / var(--swiper-slides-per-view));
            width: calc(100% / var(--swiper-slides-per-view));
            height: 100%;
          }

          .swiper-button-prev,
          .swiper-button-next {
            position: absolute;
            top: 50%;
            width: var(--swiper-nav-size);
            height: var(--swiper-nav-size);
            border: none;
            border-radius: 999px;
            transform: translateY(-50%);
            background: color-mix(in srgb, var(--swiper-theme-color) 15%, white);
            color: var(--swiper-theme-color);
            cursor: pointer;
            z-index: 2;
          }

          .swiper-button-prev { left: 8px; }
          .swiper-button-next { right: 8px; }

          .swiper-pagination {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 10px;
            display: flex;
            justify-content: center;
            gap: 8px;
            z-index: 2;
          }

          .swiper-pagination-bullet {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            border: none;
            background: #bbb;
            cursor: pointer;
            padding: 0;
          }

          .swiper-pagination-bullet-active {
            background: var(--swiper-theme-color);
          }
        </style>
        <div class="swiper" part="container">
          <div class="swiper-wrapper" part="wrapper"><slot></slot></div>
          ${withNav ? '<button type="button" class="swiper-button-prev" aria-label="Previous slide">&#10094;</button><button type="button" class="swiper-button-next" aria-label="Next slide">&#10095;</button>' : ''}
          ${withPagination ? '<div class="swiper-pagination" part="pagination"></div>' : ''}
        </div>
      `;

      this._bindInternalNavigation();
      this._renderPagination();
    }

    _bindInternalNavigation() {
      this._cleanup.forEach(fn => fn());
      this._cleanup = [];

      const prevBtn = this.shadowRoot.querySelector('.swiper-button-prev');
      const nextBtn = this.shadowRoot.querySelector('.swiper-button-next');

      if (prevBtn) {
        const onClick = () => this.prev();
        prevBtn.addEventListener('click', onClick);
        this._cleanup.push(() => prevBtn.removeEventListener('click', onClick));
      }

      if (nextBtn) {
        const onClick = () => this.next();
        nextBtn.addEventListener('click', onClick);
        this._cleanup.push(() => nextBtn.removeEventListener('click', onClick));
      }
    }

    _bindExternalNavigation() {
      const prevSelector = this.getAttribute('navigation-prev-el');
      const nextSelector = this.getAttribute('navigation-next-el');

      if (this._externalPrevHandler && this._externalPrev) {
        this._externalPrev.removeEventListener('click', this._externalPrevHandler);
      }
      if (this._externalNextHandler && this._externalNext) {
        this._externalNext.removeEventListener('click', this._externalNextHandler);
      }

      this._externalPrev = prevSelector ? document.querySelector(prevSelector) : null;
      this._externalNext = nextSelector ? document.querySelector(nextSelector) : null;

      if (this._externalPrev) {
        this._externalPrevHandler = () => this.prev();
        this._externalPrev.addEventListener('click', this._externalPrevHandler);
      }

      if (this._externalNext) {
        this._externalNextHandler = () => this.next();
        this._externalNext.addEventListener('click', this._externalNextHandler);
      }
    }

    _observeChildren() {
      if (this._observer) return;
      this._observer = new MutationObserver(() => {
        const maxIndex = Math.max(0, this._slideCount() - 1);
        this._index = clamp(this._index, 0, maxIndex);
        this._renderPagination();
        this._sync();
      });
      this._observer.observe(this, { childList: true });
    }

    _renderPagination() {
      const paginationEl = this.shadowRoot.querySelector('.swiper-pagination');
      if (!paginationEl) return;

      const count = this._slideCount();
      paginationEl.innerHTML = '';

      for (let i = 0; i < count; i += 1) {
        const bullet = document.createElement('button');
        bullet.type = 'button';
        bullet.className = 'swiper-pagination-bullet';
        bullet.setAttribute('aria-label', `Go to slide ${i + 1}`);
        bullet.addEventListener('click', () => this.slideTo(i));
        paginationEl.appendChild(bullet);
      }
    }

    _sync() {
      const wrapper = this.shadowRoot.querySelector('.swiper-wrapper');
      if (!wrapper) return;

      const count = this._slideCount();
      if (count === 0) {
        wrapper.style.transform = 'translate3d(0, 0, 0)';
        return;
      }

      const step = 100 / this._slidesPerView;
      wrapper.style.transform = `translate3d(${-this._index * step}%, 0, 0)`;

      const bullets = this.shadowRoot.querySelectorAll('.swiper-pagination-bullet');
      bullets.forEach((bullet, i) => {
        bullet.classList.toggle('swiper-pagination-bullet-active', i === this._index);
      });
    }
  }

  const register = () => {
    if (typeof window === 'undefined' || !window.customElements) return;
    if (!window.customElements.get('swiper-container')) {
      window.customElements.define('swiper-container', SwiperContainer);
    }
    if (!window.customElements.get('swiper-slide')) {
      window.customElements.define('swiper-slide', SwiperSlide);
    }
  };

  if (typeof window !== 'undefined') {
    window.SwiperElementRegisterParams = () => {};
  }

  register();
})();
