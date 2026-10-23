"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import {
  CATEGORIES,
  COMBO_CATEGORY,
  COMBO_SIZE,
  comboDetails,
  findProduct,
  productOptions,
  comboItemSize,
  comboSizeText,
  findCombo,
  stockOf,
} from "@/src/components/product-showcase/data";
import {
  DEFAULT_GRIND,
  DEFAULT_SIZE,
  GRINDS,
  sizesOf,
  type GrindId,
  type SizeId,
} from "@/src/lib/shop";
import {
  formatPrice,
  useCart,
  type NewCartItem,
  type QuickAddTarget,
} from "./CartContext";
import ComboStrip from "./ComboStrip";
import { GrindIcon, SizeIcon } from "./CoffeeIcons";
import { flyToCart } from "./flyToCart";

interface QuickAddDialogProps {
  target: QuickAddTarget | null;
  onClose: () => void;
}

/** Selector de presentación, molienda y cantidad antes de agregar al carrito */
export default function QuickAddDialog({
  target,
  onClose,
}: QuickAddDialogProps) {
  const t = useTranslations("shop");
  const ref = useRef<HTMLDialogElement>(null);
  const [announcement, setAnnouncement] = useState("");

  /* Abre/cierra el <dialog> nativo (foco atrapado, Escape y capa superior) */
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (target && !dialog.open) dialog.showModal();
    if (!target && dialog.open) dialog.close();
  }, [target]);

  const targetKey = !target
    ? "none"
    : target.kind === "combo"
      ? `combo-${target.comboId}`
      : `${target.categoryId}-${target.productId}`;

  return (
    <>
      <dialog
        ref={ref}
        onClose={onClose}
        /* Clic en el fondo (fuera del panel) cierra */
        onClick={(e) => e.target === e.currentTarget && onClose()}
        aria-labelledby="quick-add-title"
        className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[92svh] w-full rounded-t-4xl max-w-none overflow-y-auto overflow-x-hidden bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/50 open:animate-[sheetIn_0.35s_cubic-bezier(0.22,1,0.36,1)] md:inset-0 md:m-auto md:w-[calc(100vw-4rem)] md:max-w-[56rem] md:overflow-hidden md:rounded-4xl"
      >
        {target && (
          <QuickAddContent
            key={targetKey}
            target={target}
            onClose={onClose}
            onAdded={(name) => setAnnouncement(t("addedNamed", { name }))}
          />
        )}
      </dialog>
      {/* Anuncio para lectores de pantalla al agregar */}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </>
  );
}

function QuickAddContent({
  target,
  onClose,
  onAdded,
}: {
  target: QuickAddTarget;
  onClose: () => void;
  onAdded: (name: string) => void;
}) {
  const t = useTranslations("shop");
  const tCart = useTranslations("cart");
  const tEditions = useTranslations("editions");
  const { addItem } = useCart();
  const [size, setSize] = useState<SizeId>(DEFAULT_SIZE);
  const [grind, setGrind] = useState<GrindId>(DEFAULT_GRIND);
  const [qty, setQty] = useState(1);
  const sizeName = useId();
  const grindName = useId();
  const varietalName = useId();
  const processName = useId();

  /* Varietal y proceso: el cliente elige uno de cada uno (si el café los
     ofrece); empieza en el primero. No cambian el precio */
  const options = productOptions(
    target.kind === "product" ? findProduct(target.categoryId, target.productId) : undefined,
  );
  const [varietalPick, setVarietal] = useState<string>();
  const [processPick, setProcess] = useState<string>();
  const varietal = options.varietals.find((o) => o.id === varietalPick) ?? options.varietals[0];
  const process = options.processes.find((o) => o.id === processPick) ?? options.processes[0];
  const optionName = (kind: "varietals" | "processes", id: string) =>
    t.has(`${kind}.${id}`) ? t(`${kind}.${id}`) : id;

  /* Presentaciones del combo: la nota de siempre si todo va en 250 g;
     si no, "1 kg c/u" o "1 kg + 250 g" */
  const comboTarget = target.kind === "combo" ? findCombo(target.comboId) : undefined;
  const comboSize = comboTarget ? comboItemSize(comboTarget.items[0] ?? {}) : COMBO_SIZE;
  const comboSizesText =
    comboTarget && comboTarget.items.some((i) => comboItemSize(i) !== COMBO_SIZE)
      ? comboSizeText(comboTarget, (s) => t(`sizes.${s}`), t("each"))
      : null;

  /* Datos según sea un café o un combo */
  let view: {
    label: string;
    name: string;
    unitPrice: number;
    regular?: number;
    discount?: number;
    media: React.ReactNode;
    image?: string;
    prices?: Record<SizeId, number>;
    /** Unidades disponibles por presentación (Infinity = sin límite) */
    stock: (s: SizeId) => number;
    item: Omit<NewCartItem, "grind">;
  } | null = null;

  if (target.kind === "combo") {
    const combo = findCombo(target.comboId);
    if (combo) {
      const { products, regular, price } = comboDetails(combo);
      view = {
        label: tCart("comboLabel"),
        name: tCart(`combos.${combo.id}.name`),
        unitPrice: price,
        regular,
        discount: combo.discount,
        media: (
          <ComboStrip
            products={products}
            width={420}
            className="h-full w-full"
          />
        ),
        image: products[0]?.product.image,
        /* El combo alcanza hasta donde alcance su café con menos stock */
        stock: () =>
          Math.min(...products.map((p) => stockOf(p.product, p.size))),
        item: {
          categoryId: COMBO_CATEGORY,
          productId: combo.id,
          image: products[0]?.product.image,
          size: COMBO_SIZE,
          price,
        },
      };
    }
  } else {
    const category = CATEGORIES.find((c) => c.id === target.categoryId);
    const product = category?.products.find((p) => p.id === target.productId);
    if (category && product) {
      const name = tEditions(`${category.id}.products.${product.id}`);
      view = {
        label: tEditions(`${category.id}.name`),
        name,
        unitPrice: product.prices[size],
        prices: product.prices,
        media: (
          <ProductPhoto
            src={product.image}
            alt={tCart("productImageAlt", { name })}
            fallbackBg={product.cardBg ?? category.color}
          />
        ),
        image: product.image,
        stock: (s) => stockOf(product, s),
        item: {
          categoryId: category.id,
          productId: product.id,
          image: product.image,
          size,
          price: product.prices[size],
          ...(varietal && { varietal: varietal.id }),
          ...(process && { process: process.id }),
        },
      };
    }
  }

  if (!view) return null;
  const v = view;
  /* Stock de la presentación elegida (los combos van en 250 g) */
  const available = v.stock(v.prices ? size : COMBO_SIZE);
  const soldOut = available < 1;
  const count = Math.min(qty, Math.max(1, available));

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    const from = e.currentTarget;
    if (soldOut) return;
    flyToCart(from, v.image).then(() => addItem({ ...v.item, grind }, count));
    onAdded(v.name);
    onClose();
  };

  /* Estilo Dillanos: seleccionado en dorado, sin seleccionar en borde gris */
  const selectable = (checked: boolean) =>
    `cursor-pointer border transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#116e78] ${
      checked
        ? "border-[#c9a04a] bg-[#fbf3df] text-[#7a5a14]"
        : "border-gray-300 bg-white text-gray-600 hover:border-gray-500 hover:text-gray-900"
    }`;

  return (
    /* Celular: hoja con imagen arriba. iPad vertical: imagen más angosta.
       iPad horizontal y escritorio: 5/6. Desde md la ventana tiene alto máximo
       y solo la columna de opciones se desplaza, con el botón fijo abajo. */
    <div className="grid grid-cols-[minmax(0,1fr)] md:h-[min(36rem,calc(100svh-4rem))] md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Imagen */}
      <div className="relative aspect-4/3 md:aspect-auto md:h-full">
        {v.media}
        {v.discount && (
          <span className="absolute left-3 top-3 rounded-full bg-[#F63049] px-3 py-1 font-ui text-xs font-bold uppercase tracking-wide text-white shadow-md">
            {tCart("save", { percent: v.discount })}
          </span>
        )}
      </div>

      {/* Opciones */}
      <div className="flex flex-col p-6 pb-0 md:overflow-y-auto md:overscroll-contain md:p-8 md:pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-ui text-sm font-medium text-[#c8642c]">
              {v.label}
            </p>
            <h2
              id="quick-add-title"
              className="mt-1 text-3xl font-bold leading-tight text-gray-900 md:text-4xl"
            >
              {v.name}
            </h2>
            <p className="mt-3 flex items-baseline gap-2.5 font-ui tabular-nums">
              <data value={v.unitPrice} className="text-2xl font-bold">
                {formatPrice(v.unitPrice)}
              </data>
              {v.regular && (
                <s className="text-base text-gray-400">
                  <span className="sr-only">{tCart("regularPrice")}: </span>
                  {formatPrice(v.regular)}
                </s>
              )}
            </p>
            {/* Pocas unidades: se avisa */}
            {!soldOut && available <= 5 && (
              <p
                aria-live="polite"
                className="mt-1 font-ui text-sm font-semibold text-[#c8642c]"
              >
                {t("lowStock", { count: available })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="-mr-2 -mt-2 cursor-pointer rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={22} />
          </button>
        </div>

        <hr className="my-6 border-gray-200" />

        <div className="space-y-6 font-ui">
          {/* Presentación: tarjetas con ícono de bolsa, precio y tamaño */}
          {v.prices ? (
            <fieldset>
              <legend className="mb-3 text-lg font-semibold text-gray-900">
                {t("size")}
              </legend>
              <div className="flex flex-wrap gap-3">
                {sizesOf(v.prices).map((s) => (
                  <label
                    key={s}
                    className={`${selectable(size === s)} relative flex w-28 flex-col items-center gap-1 rounded-lg px-3 py-3 text-center ${
                      v.stock(s) < 1 ? "opacity-50" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={sizeName}
                      value={s}
                      checked={size === s}
                      onChange={() => {
                        setSize(s);
                        setQty(1);
                      }}
                      className="sr-only"
                    />
                    {v.stock(s) < 1 && (
                      <span className="absolute -top-2 rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {t("soldOut")}
                      </span>
                    )}
                    <SizeIcon size={s} className="h-7 w-7 opacity-70" />
                    <span className="text-sm font-semibold tabular-nums">
                      {formatPrice(v.prices![s])}
                    </span>
                    <span className="text-xs">{t(`sizes.${s}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <p className="flex items-center gap-2 text-sm text-gray-600">
              <SizeIcon size={comboSize} className="h-6 w-6 text-gray-400" />
              {comboSize === COMBO_SIZE && comboSizesText === null
                ? t("comboSizeNote")
                : comboSizesText}
            </p>
          )}

          {/* Varietal y proceso (si el café los ofrece) */}
          {(
            [
              ["varietals", options.varietals, varietal, setVarietal, varietalName, t("varietal")],
              ["processes", options.processes, process, setProcess, processName, t("process")],
            ] as const
          ).map(([kind, list, current, set, groupName, legend]) =>
            list.length > 0 ? (
              <fieldset key={kind}>
                <legend className="mb-3 text-lg font-semibold text-gray-900">{legend}</legend>
                <div className="flex flex-wrap gap-2">
                  {list.map((o) => (
                    <label
                      key={o.id}
                      className={`${selectable(current?.id === o.id)} flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm`}
                    >
                      <input
                        type="radio"
                        name={groupName}
                        value={o.id}
                        checked={current?.id === o.id}
                        onChange={() => set(o.id)}
                        className="sr-only"
                      />
                      {optionName(kind, o.id)}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null,
          )}

          {/* Molienda: píldoras con el ícono de cada método */}
          <fieldset>
            <legend className="mb-3 text-lg font-semibold text-gray-900">
              {t("grind")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {GRINDS.map((g) => (
                <label
                  key={g}
                  className={`${selectable(grind === g)} flex items-center gap-1.5 rounded-full py-2 pl-2.5 pr-3.5 text-sm`}
                >
                  <input
                    type="radio"
                    name={grindName}
                    value={g}
                    checked={grind === g}
                    onChange={() => setGrind(g)}
                    className="sr-only"
                  />
                  <GrindIcon grind={g} className="h-5 w-5 shrink-0" />
                  {t(`grinds.${g}`)}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Cantidad + agregar (fijo abajo en celular) */}
        <div className="sticky bottom-0 -mx-6 mt-8 flex items-stretch gap-3 border-t border-gray-100 bg-white px-6 py-4 font-ui md:-mx-8 md:mt-auto md:px-8 md:py-5">
          <div
            role="group"
            aria-label={t("quantity")}
            className="flex items-center rounded-full border border-gray-300"
          >
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label={tCart("decrease")}
              className="flex h-full w-10 cursor-pointer items-center justify-center rounded-l-full text-gray-600 hover:text-gray-900"
            >
              <Minus size={16} />
            </button>
            <output
              aria-live="polite"
              className="w-7 text-center font-semibold tabular-nums"
            >
              {count}
            </output>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(q + 1, available))}
              disabled={count >= available}
              aria-label={tCart("increase")}
              className="flex h-full w-10 cursor-pointer items-center justify-center rounded-r-full text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-full bg-gray-900 px-4 py-3.5 font-semibold text-white transition-colors hover:bg-[#116e78] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
          >
            <ShoppingBag size={18} aria-hidden className="shrink-0" />
            {soldOut ? (
              <span className="truncate">{t("soldOut")}</span>
            ) : (
              <>
                <span className="truncate">{t("addShort")}</span>
                <data
                  value={v.unitPrice * count}
                  className="shrink-0 whitespace-nowrap tabular-nums"
                >
                  {formatPrice(v.unitPrice * count)}
                </data>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Corner pixel of a loaded image, as a CSS color (null if unreadable) */
function cornerColor(img: HTMLImageElement) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 4, 4, 0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return null;
  }
}

/* Foto del café: en celular llena el espacio (cover); desde tablet se ve la
   lata completa (contain) y el espacio sobrante se pinta con el color del
   fondo de la propia foto, tomado de su esquina al cargar */
function ProductPhoto({
  src,
  alt,
  fallbackBg,
}: {
  src?: string;
  alt: string;
  fallbackBg: string;
}) {
  const [bg, setBg] = useState<string | null>(null);
  return (
    <div
      className="relative h-full w-full transition-colors duration-300"
      style={{ backgroundColor: bg ?? fallbackBg }}
    >
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 767px) 100vw, 420px"
          onLoad={(e) => setBg(cornerColor(e.currentTarget))}
          className="object-cover md:object-contain"
        />
      )}
    </div>
  );
}
