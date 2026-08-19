export type HeroSlide = {
  src: string;
  alt: string;
  href: string;
  width: number;
  height: number;
};

export function heroSlideAspectStyle(width: number, height: number): { aspectRatio: string } {
  const w = Math.max(1, width || 1920);
  const h = Math.max(1, height || 600);
  return { aspectRatio: `${w} / ${h}` };
}
