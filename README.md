# SwiperJSlight (`12.1.2-light`)

A lightweight, MIT-licensed custom-element slider based on Swiper Element.

## Intention of this light version

This project exists to keep only the functionality needed for a focused slider use case, while reducing bundle complexity compared to full Swiper.

The target use case is:
- responsive `slidesPerView`
- navigation (next/prev)
- pagination bullets
- loop behavior
- autoplay

This is intentionally **not** a full drop-in replacement for the official Swiper package.

## Scope

Implemented in this light build:
- `<swiper-container>` and `<swiper-slide>` custom elements
- responsive breakpoints via `breakpoints` JSON attribute
- internal navigation buttons (`navigation="true"`)
- optional external navigation selectors (`navigation-prev-el`, `navigation-next-el`)
- pagination bullets (`pagination="true"`)
- seamless loop with clone-track normalization
- autoplay (`autoplay`, `autoplay-delay`, `autoplay-disable-on-interaction`)
- transition speed (`speed`)

Removed from full Swiper surface:
- advanced effects/modules and full plugin ecosystem
- complete API parity with official Swiper
- non-essential configuration options for this project

## Versioning

- Light build version: `12.1.2-light`
- Base lineage: Swiper `12.1.2`

## Basic usage

```html
<swiper-container
  navigation="true"
  pagination="true"
  loop
  slides-per-view="1"
  breakpoints='{"0":{"slidesPerView":3},"1250":{"slidesPerView":5}}'
  autoplay
  autoplay-delay="0"
  autoplay-disable-on-interaction="false"
  speed="2000"
>
  <swiper-slide>Slide 1</swiper-slide>
  <swiper-slide>Slide 2</swiper-slide>
  <swiper-slide>Slide 3</swiper-slide>
</swiper-container>

<script src="./swiperlight-element-bundle.js"></script>
```

## Local development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Vitest UI:

```bash
npm run test:ui
```

## Project files

- `swiperlight-element-bundle.js`: light custom-element bundle
- `demo.php`: browser demo with cache-busted script include
- `tests/swiper-element.test.js`: behavior tests (registration, rendering, loop, breakpoints, autoplay)
- `tests/setup.js`: jsdom polyfills and test cleanup
- `vitest.config.js`: vitest config
- `LICENSE`: MIT license text with attribution

## License and attribution

This project is distributed under MIT.

- Original Swiper work: Vladimir Kharlampidi
- Light build modifications (2026): Erwin Bantilan

See [LICENSE](./LICENSE) for the full license text.
