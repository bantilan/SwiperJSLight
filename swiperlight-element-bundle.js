/**
 * Swiper Custom Element 12.1.2-light
 * Most modern mobile touch slider and framework with hardware accelerated transitions
 * https://swiperjs.com
 *
 * Original work:
 * Copyright 2014-2026 Vladimir Kharlampidi
 *
 * Light build modifications:
 * Copyright 2026 Erwin Bantilan
 *
 * Released under the MIT License
 *
 * Light build version: 12.1.2-light
 */

(function () {
  'use strict';

  const toBool = value => value !== null && value !== 'false';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const toNumber = value => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  class SwiperSlide extends HTMLElement {
    connectedCallback() {
      if (this.__initialized) return;
      this.__initialized = true;
      if (this.shadowRoot) return;
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<slot></slot>';
    }
  }

  class SwiperContainer extends HTMLElement {
    static get observedAttributes() {
      return ['navigation', 'pagination', 'loop', 'slides-per-view', 'breakpoints', 'navigation-prev-el', 'navigation-next-el', 'autoplay', 'autoplay-delay', 'autoplay-disable-on-interaction', 'speed'];
    }

    constructor() {
      super();
      this._index = 0;
      this._slidesPerView = 1;
      this._loop = false;
      this._showNavigation = false;
      this._showPagination = false;
      this._breakpoints = {};
      this._baseSlidesPerView = 1;
      this._speed = 300;
      this._autoplayEnabled = false;
      this._autoplayDelay = 3000;
      this._autoplayDisableOnInteraction = true;
      this._autoplayTimer = null;
      this._loopOffset = 0;
      this._loopNormalizeTimer = null;
      this._externalPrev = null;
      this._externalNext = null;
      this._cleanup = [];
      this._onResize = () => this._handleResize();
      this._onViewportResize = () => this._handleResize();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this._readAttributes();
      this._render();
      this._bindExternalNavigation();
      this._observeChildren();
      window.addEventListener('resize', this._onResize);
      window.addEventListener('orientationchange', this._onResize);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', this._onViewportResize);
      }
      this._sync(false);
      this._updateAutoplay();
    }

    disconnectedCallback() {
      this._cleanup.forEach(fn => fn());
      this._cleanup = [];
      this._stopAutoplay();
      this._clearLoopNormalizeTimer();
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('orientationchange', this._onResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', this._onViewportResize);
      }
      if (this._observer) {
        this._observer.disconnect();
        this._observer = null;
      }
    }

    attributeChangedCallback() {
      this._readAttributes();
      this._render();
      this._bindExternalNavigation();
      this._sync(false);
      this._updateAutoplay();
    }

    next() {
      this._onUserInteraction();
      const count = this._slideCount();
      if (count <= 1) return;

      if (this._loop) {
        this._index += 1;
      } else {
        this._index = clamp(this._index + 1, 0, count - 1);
      }
      this._sync(true);
    }

    prev() {
      this._onUserInteraction();
      const count = this._slideCount();
      if (count <= 1) return;

      if (this._loop) {
        this._index -= 1;
      } else {
        this._index = clamp(this._index - 1, 0, count - 1);
      }
      this._sync(true);
    }

    slideTo(index) {
      this._onUserInteraction();
      const count = this._slideCount();
      if (count === 0) return;
      this._index = clamp(index, 0, count - 1);
      this._sync(true);
    }

    _readAttributes() {
      this._showNavigation = toBool(this.getAttribute('navigation'));
      this._showPagination = toBool(this.getAttribute('pagination'));
      this._loop = toBool(this.getAttribute('loop'));
      this._baseSlidesPerView = Math.max(1, toNumber(this.getAttribute('slides-per-view') || '1') || 1);
      this._breakpoints = this._parseBreakpoints(this.getAttribute('breakpoints'));
      this._speed = Math.max(0, toNumber(this.getAttribute('speed') || '300') || 300);
      this._autoplayEnabled = toBool(this.getAttribute('autoplay'));
      this._autoplayDelay = Math.max(0, toNumber(this.getAttribute('autoplay-delay') || '3000') || 3000);
      const autoplayDisableAttr = this.getAttribute('autoplay-disable-on-interaction');
      this._autoplayDisableOnInteraction = autoplayDisableAttr === null ? true : toBool(autoplayDisableAttr);
      this._slidesPerView = this._resolveSlidesPerView();
      this.style.setProperty('--swiper-slides-per-view', String(this._slidesPerView));
    }

    _sourceSlides() {
      return Array.from(this.querySelectorAll('swiper-slide'));
    }

    _slideCount() {
      return this._sourceSlides().length;
    }

    _realIndex() {
      const count = this._slideCount();
      if (count === 0) return 0;
      return ((this._index % count) + count) % count;
    }

    _loopedSlidesCount() {
      const count = this._slideCount();
      if (!this._loop || count <= 1) return 0;
      return Math.min(this._slidesPerView, count);
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
            --swiper-slides-per-view: 1;
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
            will-change: transform;
          }

          .swiper-item {
            box-sizing: border-box;
            flex: 0 0 calc(100% / var(--swiper-slides-per-view));
            width: calc(100% / var(--swiper-slides-per-view));
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .swiper-item > * {
            max-width: 100%;
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
          <div class="swiper-wrapper" part="wrapper"></div>
          ${withNav ? '<button type="button" class="swiper-button-prev" aria-label="Previous slide">&#10094;</button><button type="button" class="swiper-button-next" aria-label="Next slide">&#10095;</button>' : ''}
          ${withPagination ? '<div class="swiper-pagination" part="pagination"></div>' : ''}
        </div>
      `;

      this._buildTrack();
      this._bindInternalNavigation();
      this._renderPagination();
    }

    _buildTrack() {
      const wrapper = this.shadowRoot.querySelector('.swiper-wrapper');
      if (!wrapper) return;

      const slides = this._sourceSlides();
      const count = slides.length;
      const perSide = this._loopedSlidesCount();
      this._loopOffset = perSide;

      wrapper.innerHTML = '';
      wrapper.style.transition = `transform ${this._speed}ms ease`;

      if (count === 0) return;

      const appendItem = (sourceSlide, isClone, realIndex) => {
        const item = document.createElement('div');
        item.className = 'swiper-item';
        item.setAttribute('data-real-index', String(realIndex));
        if (isClone) item.setAttribute('data-clone', 'true');
        item.innerHTML = sourceSlide.innerHTML;
        wrapper.appendChild(item);
      };

      if (this._loop && perSide > 0) {
        for (let i = 0; i < perSide; i += 1) {
          const realIndex = (count - perSide + i) % count;
          appendItem(slides[realIndex], true, realIndex);
        }
      }

      slides.forEach((slide, realIndex) => {
        appendItem(slide, false, realIndex);
      });

      if (this._loop && perSide > 0) {
        for (let i = 0; i < perSide; i += 1) {
          appendItem(slides[i % count], true, i % count);
        }
      }

      const maxIndex = Math.max(0, count - 1);
      this._index = clamp(this._realIndex(), 0, maxIndex);
    }

    _clearLoopNormalizeTimer() {
      if (!this._loopNormalizeTimer) return;
      clearTimeout(this._loopNormalizeTimer);
      this._loopNormalizeTimer = null;
    }

    _queueLoopNormalizeFallback() {
      if (this._loopNormalizeTimer) return;
      if (!this._loop) return;
      const count = this._slideCount();
      if (count <= 1) return;
      const wait = Math.max(this._speed, 0) + 34;
      this._loopNormalizeTimer = setTimeout(() => {
        this._loopNormalizeTimer = null;
        this._normalizeLoopAfterTransition();
      }, wait);
    }

    _autoplayTick() {
      const count = this._slideCount();
      if (!this._autoplayEnabled || count <= 1) return;
      this._normalizeLoopAfterTransition();
      this.next();
      this._scheduleAutoplay();
    }

    _scheduleAutoplay() {
      this._stopAutoplay();
      if (!this._autoplayEnabled) return;
      const count = this._slideCount();
      if (count <= 1) return;
      const effectiveDelay = this._autoplayDelay > 0 ? this._autoplayDelay : Math.max(this._speed, 16);
      this._autoplayTimer = setTimeout(() => this._autoplayTick(), effectiveDelay);
    }

    _stopAutoplay() {
      if (!this._autoplayTimer) return;
      clearTimeout(this._autoplayTimer);
      this._autoplayTimer = null;
    }

    _updateAutoplay() {
      if (!this._autoplayEnabled) {
        this._stopAutoplay();
        return;
      }
      this._scheduleAutoplay();
    }

    _onUserInteraction() {
      if (!this._autoplayEnabled) return;
      if (this._autoplayDisableOnInteraction) {
        this._stopAutoplay();
      } else {
        this._scheduleAutoplay();
      }
    }

    _parseBreakpoints(rawBreakpoints) {
      if (!rawBreakpoints) return {};

      try {
        const parsed = JSON.parse(rawBreakpoints);
        if (!parsed || typeof parsed !== 'object') return {};
        return parsed;
      } catch (error) {
        return {};
      }
    }

    _resolveSlidesPerView() {
      const width = this._getViewportWidth();
      let resolved = this._baseSlidesPerView;
      const entries = Object.entries(this._breakpoints)
        .map(([rawMinWidth, config]) => [toNumber(rawMinWidth), config])
        .filter(([minWidth, config]) => minWidth !== null && config && typeof config === 'object')
        .sort((a, b) => a[0] - b[0]);

      entries.forEach(([minWidth, config]) => {
        if (width < minWidth) return;
        const candidate = toNumber(config.slidesPerView);
        if (candidate && candidate > 0) {
          resolved = candidate;
        }
      });

      return Math.max(1, resolved);
    }

    _getViewportWidth() {
      if (typeof window === 'undefined') return 0;
      const visual = window.visualViewport && Number.isFinite(window.visualViewport.width) ? window.visualViewport.width : 0;
      const inner = Number.isFinite(window.innerWidth) ? window.innerWidth : 0;
      const doc = document && document.documentElement && Number.isFinite(document.documentElement.clientWidth) ? document.documentElement.clientWidth : 0;
      return Math.round(Math.max(visual, inner, doc, 0));
    }

    _handleResize() {
      const nextSlidesPerView = this._resolveSlidesPerView();
      if (nextSlidesPerView === this._slidesPerView) return;
      this._slidesPerView = nextSlidesPerView;
      this.style.setProperty('--swiper-slides-per-view', String(this._slidesPerView));
      const preservedIndex = this._realIndex();
      this._render();
      this._bindExternalNavigation();
      this._index = preservedIndex;
      this._sync(false);
    }

    _bindInternalNavigation() {
      this._cleanup.forEach(fn => fn());
      this._cleanup = [];

      const prevBtn = this.shadowRoot.querySelector('.swiper-button-prev');
      const nextBtn = this.shadowRoot.querySelector('.swiper-button-next');
      const wrapper = this.shadowRoot.querySelector('.swiper-wrapper');

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

      if (wrapper) {
        const onTransitionEnd = event => {
          if (event.target !== wrapper) return;
          this._normalizeLoopAfterTransition();
        };
        wrapper.addEventListener('transitionend', onTransitionEnd);
        this._cleanup.push(() => wrapper.removeEventListener('transitionend', onTransitionEnd));
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
        const preservedIndex = this._realIndex();
        this._render();
        this._bindExternalNavigation();
        this._index = clamp(preservedIndex, 0, Math.max(0, this._slideCount() - 1));
        this._sync(false);
        this._updateAutoplay();
      });
      this._observer.observe(this, { childList: true, subtree: true });
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

    _normalizeLoopAfterTransition() {
      if (!this._loop) return;
      const count = this._slideCount();
      if (count <= 1) return;
      this._clearLoopNormalizeTimer();

      let normalized = this._index;
      if (this._index >= count) {
        normalized = this._index % count;
      } else if (this._index < 0) {
        normalized = ((this._index % count) + count) % count;
      }
      if (normalized === this._index) return;

      this._index = normalized;
      this._sync(false);
    }

    _sync(animate = true) {
      const wrapper = this.shadowRoot.querySelector('.swiper-wrapper');
      if (!wrapper) return;

      const count = this._slideCount();
      if (count === 0) {
        wrapper.style.transform = 'translate3d(0, 0, 0)';
        return;
      }

      const step = 100 / this._slidesPerView;
      const trackIndex = this._loop ? this._index + this._loopOffset : this._index;
      wrapper.style.transitionDuration = animate ? `${this._speed}ms` : '0ms';
      wrapper.style.transform = `translate3d(${-trackIndex * step}%, 0, 0)`;
      if (animate) {
        this._queueLoopNormalizeFallback();
      } else {
        this._clearLoopNormalizeTimer();
      }

      const activeRealIndex = this._realIndex();
      const bullets = this.shadowRoot.querySelectorAll('.swiper-pagination-bullet');
      bullets.forEach((bullet, i) => {
        bullet.classList.toggle('swiper-pagination-bullet-active', i === activeRealIndex);
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
