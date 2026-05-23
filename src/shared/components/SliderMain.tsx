'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';


export default function SliderMain() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex pb-5 cursor-grab">
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/1.jpg" alt="Prueba 1" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/1b.jpg" alt="Prueba 2" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/2.jpg" alt="Prueba 3" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/3.jpg" alt="Prueba 4" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/4.jpg" alt="Prueba 1" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/A2.jpg" alt="Prueba 2" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/AR1.jpg" alt="Prueba 1" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/AR3.jpg" alt="Prueba 2" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/AR4.jpg" alt="Prueba 1" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/AR5.jpg" alt="Prueba 2" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/basecoat.jpg" alt="Prueba 1" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/mapei.jpg" alt="Prueba 2" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/plasticos.jpg" alt="Prueba 1" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/sliderA.jpg" alt="Prueba 2" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/sliderB.jpg" alt="Prueba 2" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/sliderC.jpg" alt="Prueba 2" className="slider-responsive" />
        </div>
        <div className="flex-[0_0_100%] min-w-0">
          <img src="/sliders/mainSlider/sliderD.jpg" alt="Prueba 2" className="slider-responsive" />
        </div>
      </div>
    </div>
  );
}