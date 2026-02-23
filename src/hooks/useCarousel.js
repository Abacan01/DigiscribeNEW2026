import { useState, useRef, useEffect, useCallback } from 'react';

export function useCarousel(totalSlides, autoPlayInterval = 2000) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragDelta = useRef(0);
  const swipeAxis = useRef(null);

  const goTo = useCallback((index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    const newIndex = ((index % totalSlides) + totalSlides) % totalSlides;
    setCurrentSlide(newIndex);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, totalSlides]);

  const next = useCallback(() => {
    goTo(currentSlide + 1);
  }, [currentSlide, goTo]);

  const prev = useCallback(() => {
    goTo(currentSlide - 1);
  }, [currentSlide, goTo]);

  const startAutoPlay = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIsAnimating((animating) => {
        if (!animating) {
          setCurrentSlide((prev) => (prev + 1) % totalSlides);
          setTimeout(() => setIsAnimating(false), 500);
          return true;
        }
        return animating;
      });
    }, autoPlayInterval);
  }, [totalSlides, autoPlayInterval]);

  const resetAutoPlay = useCallback(() => {
    clearInterval(intervalRef.current);
    startAutoPlay();
  }, [startAutoPlay]);

  // Auto-play
  useEffect(() => {
    startAutoPlay();
    return () => clearInterval(intervalRef.current);
  }, [startAutoPlay]);

  // Mouse/Touch drag handlers
  const handleMouseDown = useCallback((e) => {
    isDragging.current = true;
    startX.current = e.clientX || e.touches?.[0]?.clientX || 0;
    startY.current = e.clientY || e.touches?.[0]?.clientY || 0;
    dragDelta.current = 0;
    swipeAxis.current = null;
    clearInterval(intervalRef.current);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
    const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
    const deltaX = currentX - startX.current;
    const deltaY = currentY - startY.current;

    if (!swipeAxis.current && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
      swipeAxis.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
    }

    if (swipeAxis.current === 'y') return;

    dragDelta.current = deltaX;

    if (e.cancelable) {
      e.preventDefault();
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (swipeAxis.current !== 'x') {
      swipeAxis.current = null;
      resetAutoPlay();
      return;
    }

    if (dragDelta.current > 40) {
      prev();
    } else if (dragDelta.current < -40) {
      next();
    }
    swipeAxis.current = null;
    resetAutoPlay();
  }, [prev, next, resetAutoPlay]);

  // Get slide class based on position relative to current
  const getSlideClass = useCallback((index) => {
    if (index === currentSlide) return 'active';
    const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
    const nextIndex = (currentSlide + 1) % totalSlides;
    if (index === prevIndex) return 'prev';
    if (index === nextIndex) return 'next';
    return '';
  }, [currentSlide, totalSlides]);

  return {
    currentSlide,
    next,
    prev,
    goTo,
    getSlideClass,
    containerRef,
    resetAutoPlay,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onTouchStart: handleMouseDown,
      onTouchMove: handleMouseMove,
      onTouchEnd: handleMouseUp,
      onTouchCancel: handleMouseUp,
    },
  };
}
