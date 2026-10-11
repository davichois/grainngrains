/* Animación "vuela al carrito": una miniatura del producto sale desde el
   botón y aterriza en el ícono del carrito del header (el que esté visible,
   escritorio o móvil). Se resuelve al aterrizar para que el contador del
   carrito salte justo en ese momento. */

const DURATION = 750;

function visibleCartIcon() {
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-cart-icon]"),
  ).find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  });
}

export function flyToCart(from: HTMLElement, imageSrc?: string) {
  const target = visibleCartIcon();
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (!target || !imageSrc || reduceMotion) return Promise.resolve();

  const start = from.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const size = 72;

  const img = document.createElement("img");
  img.src = imageSrc;
  img.alt = "";
  Object.assign(img.style, {
    position: "fixed",
    left: `${start.left + start.width / 2 - size / 2}px`,
    top: `${start.top + start.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "cover",
    borderRadius: "9999px",
    boxShadow: "0 12px 30px -8px rgba(0,0,0,.45)",
    border: "3px solid #fff",
    zIndex: "80",
    pointerEvents: "none",
  });
  document.body.appendChild(img);

  const dx = end.left + end.width / 2 - (start.left + start.width / 2);
  const dy = end.top + end.height / 2 - (start.top + start.height / 2);

  /* Trayectoria en arco: sube primero y luego cae sobre el carrito */
  const anim = img.animate(
    [
      { transform: "translate(0,0) scale(0.6)", opacity: 0 },
      { transform: "translate(0,-40px) scale(1)", opacity: 1, offset: 0.15 },
      {
        transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 90}px) scale(0.8)`,
        opacity: 1,
        offset: 0.55,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0.6 },
    ],
    { duration: DURATION, easing: "cubic-bezier(0.55,0,0.35,1)" },
  );

  return anim.finished.catch(() => undefined).then(() => img.remove());
}
