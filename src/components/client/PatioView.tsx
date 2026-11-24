import { motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from "react-zoom-pan-pinch";
import type { PatioMap } from "@/data/patioMaps";
import { formatBRL } from "@/lib/format";
import { getPatioExtraCount, getPatioProperties } from "@/lib/patio";
import { vehiclePath } from "@/lib/vehicleUrl";
import {
  DEFAULT_BRAND_ACCENT,
  DEFAULT_BRAND_PRIMARY,
  type Profile,
  type Property,
} from "@/types";

type PatioViewProps = {
  properties: Property[];
  profile: Profile;
  map: PatioMap;
  onShowList: () => void;
};

function PatioZoomControls() {
  const { zoomIn, zoomOut } = useControls();

  return (
    <div className="absolute right-3 top-3 z-30 flex flex-col overflow-hidden rounded-xl border border-border bg-background/85 shadow-lg backdrop-blur-md">
      <button
        type="button"
        onClick={() => zoomIn()}
        className="flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:bg-secondary"
        aria-label="Aumentar zoom do pátio"
      >
        <Plus className="h-4 w-4" />
      </button>
      <div className="h-px bg-border" />
      <button
        type="button"
        onClick={() => zoomOut()}
        className="flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:bg-secondary"
        aria-label="Diminuir zoom do pátio"
      >
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PatioView({ properties, profile, map, onShowList }: PatioViewProps) {
  const reduceMotion = useReducedMotion();
  const orderedProperties = getPatioProperties(properties);
  const visibleProperties = orderedProperties.slice(0, map.vagas.length);
  const extraCount = getPatioExtraCount(orderedProperties, map.vagas.length);
  const primary = profile.brandPrimaryColor ?? DEFAULT_BRAND_PRIMARY;
  const accent = profile.brandAccentColor ?? DEFAULT_BRAND_ACCENT;

  return (
    <div className="relative mx-auto w-full max-w-[900px]">
      <TransformWrapper
        key={map.id}
        initialScale={1}
        minScale={1}
        maxScale={4}
        centerOnInit
        centerZoomedOut
        limitToBounds
        wheel={{ disabled: true }}
        pinch={{ step: 0.2 }}
        panning={{ allowLeftClickPan: true, releaseAtBounds: true }}
        doubleClick={{ mode: "zoomIn", step: 0.7 }}
      >
        <PatioZoomControls />
        <TransformComponent
          wrapperStyle={{ width: "100%", borderRadius: "1rem" }}
          contentStyle={{ width: "100%" }}
        >
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
            style={{ aspectRatio: `${map.largura} / ${map.altura}` }}
          >
            <img
              src={map.url}
              alt={`Mapa ilustrado do pátio ${map.nome}`}
              className="pointer-events-none block h-full w-full select-none object-cover"
              draggable={false}
            />

            {visibleProperties.map((property, index) => {
              const spot = map.vagas[index];
              return (
                <div
                  key={property.id}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 focus-within:z-40 hover:z-40"
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                >
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: -18, scale: 0.72 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.38,
                      delay: reduceMotion ? 0 : Math.min(index * 0.045, 0.9),
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                    whileHover={reduceMotion ? undefined : { scale: [1, 1.07, 1] }}
                    whileTap={reduceMotion ? undefined : { scale: 1.09 }}
                  >
                    <Link
                      to={vehiclePath(property, profile.slug)}
                      className="group flex min-h-11 min-w-11 -translate-y-2 flex-col items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label={`${property.titulo}, ${formatBRL(property.preco)}`}
                    >
                      <span
                        className="block h-10 w-10 overflow-hidden rounded-full border-2 bg-background shadow-lg transition-transform group-hover:scale-105 sm:h-14 sm:w-14"
                        style={{ borderColor: accent }}
                      >
                        <img
                          src={property.fotoUrl || "/placeholder.svg"}
                          alt=""
                          className="h-full w-full object-cover"
                          loading={index < 3 ? "eager" : "lazy"}
                          draggable={false}
                        />
                      </span>
                      <span
                        className={`mt-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[7px] font-bold leading-none shadow-md sm:translate-y-0 sm:px-2 sm:py-1 sm:text-[10px] ${
                          index % 2 === 1 ? "translate-y-3" : ""
                        }`}
                        style={{ backgroundColor: primary, color: accent }}
                      >
                        {formatBRL(property.preco)}
                      </span>
                    </Link>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>

      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Toque em um veículo para ver os detalhes. Use os dedos ou os botões para ampliar.
      </p>

      {extraCount > 0 && (
        <button
          type="button"
          onClick={onShowList}
          className="absolute bottom-12 left-1/2 z-30 flex min-h-11 -translate-x-1/2 items-center whitespace-nowrap rounded-full border border-primary/30 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02]"
        >
          +{extraCount} veículo{extraCount === 1 ? "" : "s"} no estoque · ver lista
        </button>
      )}
    </div>
  );
}
