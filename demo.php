<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Swiper Element Demo</title>
    <style>
      body { font-family: sans-serif; padding: 24px; }
      swiper-container { width: min(900px, 100%); height: 280px; border: 1px solid #ddd; }
      swiper-slide {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        background: #f5f5f5;
      }
    </style>
  </head>
  <body>
    <h1>Swiper Element Demo</h1>
    <script src="./swiperlight-element-bundle.js?<?php echo rand(10000,99999); ?>"></script>
    <swiper-container navigation="true" pagination="true" slides-per-view="1" loop space-between="20" breakpoints="{
                  &quot;0&quot;: {&quot;slidesPerView&quot;: 3},
                  &quot;550&quot;: {&quot;slidesPerView&quot;: 3},
                  &quot;768&quot;: {&quot;slidesPerView&quot;: 3},
                  &quot;1250&quot;: {&quot;slidesPerView&quot;: 1}
                }" data-autoplay="endless" autoplay autoplay-delay="0" autoplay-disable-on-interaction="false" speed="2000" class="wp-block-gfd-slider-block wp-slider-block slider-logo">
      <swiper-slide>Slide 1</swiper-slide>
      <swiper-slide>Slide 2</swiper-slide>
      <swiper-slide>Slide 3</swiper-slide>
      <swiper-slide>Slide 4</swiper-slide>
      <swiper-slide>Slide 5</swiper-slide>
      <swiper-slide>Slide 6</swiper-slide>
      <swiper-slide>Slide 7</swiper-slide>
      <swiper-slide>Slide 8</swiper-slide>
      <swiper-slide>Slide 9</swiper-slide>
    </swiper-container>

    
  </body>
</html>
