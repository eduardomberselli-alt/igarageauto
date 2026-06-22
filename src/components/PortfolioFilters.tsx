import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Property } from "@/types";

const MARCAS = [
  "Chevrolet", "Volkswagen", "Fiat", "Toyota", "Honda",
  "Hyundai", "Jeep", "BMW", "Mercedes", "Audi",
] as const;

const ANOS = [
  { key: "ate-2010", label: "Até 2010" },
  { key: "2011-2015", label: "2011–2015" },
  { key: "2016-2020", label: "2016–2020" },
  { key: "2021+", label: "2021+" },
  { key: "0km", label: "0km" },
] as const;

const KMS = [
  { key: "0-50", label: "Até 50 mil km" },
  { key: "50-100", label: "50–100 mil km" },
  { key: "100-150", label: "100–150 mil km" },
  { key: "150+", label: "150 mil+ km" },
] as const;

const CAMBIOS = ["Manual", "Automático", "CVT"] as const;
const COMBUSTIVEIS = ["Flex", "Gasolina", "Diesel", "Elétrico", "Híbrido"] as const;
const CARROCERIAS = ["Hatch", "Sedan", "SUV", "Pickup", "Coupé"] as const;

const DIFERENCIAIS_AUTO = [
  "Ar-condicionado",
  "Direção elétrica",
  "Multimídia",
  "Câmera de ré",
  "Sensor de estacionamento",
  "Bancos em couro",
  "Teto solar",
  "Controle de cruzeiro",
  "4 portas",
] as const;

export type Filters = {
  query: string;
  precoMin: string;
  precoMax: string;
  marcas: string[];
  modelo: string;
  ano: string; // key
  km: string; // key
  cambios: string[];
  combustiveis: string[];
  carrocerias: string[];
  diferenciais: string[];
  cidade: string; // "all" = qualquer
};

export const emptyFilters: Filters = {
  query: "",
  precoMin: "",
  precoMax: "",
  marcas: [],
  modelo: "",
  ano: "",
  km: "",
  cambios: [],
  combustiveis: [],
  carrocerias: [],
  diferenciais: [],
  cidade: "all",
};

function haystack(p: Property): string {
  return `${p.titulo} ${p.descricao} ${p.diferenciais.join(" ")}`.toLowerCase();
}

function anyMatch(hay: string, terms: string[]): boolean {
  if (terms.length === 0) return true;
  return terms.some((t) => hay.includes(t.toLowerCase()));
}

export function applyFilters(properties: Property[], f: Filters): Property[] {
  const q = f.query.trim().toLowerCase();
  const min = f.precoMin ? Number(f.precoMin) : 0;
  const max = f.precoMax ? Number(f.precoMax) : Infinity;
  const modelo = f.modelo.trim().toLowerCase();

  return properties.filter((p) => {
    const hay = haystack(p);
    if (q && !hay.includes(q) && !p.bairro.toLowerCase().includes(q)) return false;
    if (p.preco < min || p.preco > max) return false;
    if (!anyMatch(hay, f.marcas)) return false;
    if (modelo && !hay.includes(modelo)) return false;
    if (f.ano && !hay.includes(f.ano.replace("-", " "))) {
      // best-effort: skip strict ano filtering when no structured field
    }
    if (!anyMatch(hay, f.cambios)) return false;
    if (!anyMatch(hay, f.combustiveis)) return false;
    if (!anyMatch(hay, f.carrocerias)) return false;
    if (f.diferenciais.length > 0) {
      const lowered = p.diferenciais.map((d) => d.toLowerCase());
      const ok = f.diferenciais.every((d) =>
        lowered.some((x) => x.includes(d.toLowerCase())) || hay.includes(d.toLowerCase()),
      );
      if (!ok) return false;
    }
    if (f.cidade !== "all" && p.bairro !== f.cidade) return false;
    return true;
  });
}

type Props = {
  filters: Filters;
  onChange: (f: Filters) => void;
  properties: Property[];
};

type ChipGroupProps = {
  options: readonly string[] | readonly { key: string; label: string }[];
  selected: string[] | string;
  multi?: boolean;
  onToggle: (key: string) => void;
};

function ChipGroup({ options, selected, multi, onToggle }: ChipGroupProps) {
  const isSel = (k: string) =>
    multi ? (selected as string[]).includes(k) : selected === k;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const key = typeof opt === "string" ? opt : opt.key;
        const label = typeof opt === "string" ? opt : opt.label;
        const active = isSel(key);
        return (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            onClick={() => onToggle(key)}
            className="rounded-full"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

export function PortfolioFilters({ filters, onChange, properties }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(filters);

  const cidades = useMemo(
    () => Array.from(new Set(properties.map((p) => p.bairro).filter(Boolean))).sort(),
    [properties],
  );

  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.precoMin) n++;
    if (filters.precoMax) n++;
    n += filters.marcas.length;
    if (filters.modelo) n++;
    if (filters.ano) n++;
    if (filters.km) n++;
    n += filters.cambios.length;
    n += filters.combustiveis.length;
    n += filters.carrocerias.length;
    n += filters.diferenciais.length;
    if (filters.cidade !== "all") n++;
    return n;
  }, [filters]);

  const openSheet = (v: boolean) => {
    if (v) setDraft(filters);
    setOpen(v);
  };

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const clearAll = () => {
    setDraft({ ...emptyFilters, query: filters.query });
  };

  const toggleArr = (field: keyof Filters, key: string) => {
    setDraft((p) => {
      const arr = p[field] as string[];
      return {
        ...p,
        [field]: arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key],
      };
    });
  };

  const toggleSingle = (field: keyof Filters, key: string) => {
    setDraft((p) => ({ ...p, [field]: p[field] === key ? "" : key }));
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Buscar por modelo, marca ou ano"
          className="pl-9"
        />
        {filters.query && (
          <button
            onClick={() => onChange({ ...filters, query: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Sheet open={open} onOpenChange={openSheet}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[88vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>Filtros avançados</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Faixa de valor (R$)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Mínimo"
                  value={draft.precoMin}
                  onChange={(e) => setDraft({ ...draft, precoMin: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Máximo"
                  value={draft.precoMax}
                  onChange={(e) => setDraft({ ...draft, precoMax: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Marca</Label>
              <ChipGroup
                options={MARCAS}
                selected={draft.marcas}
                multi
                onToggle={(k) => toggleArr("marcas", k)}
              />
            </div>

            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input
                placeholder="Ex: Onix, Corolla, HB20..."
                value={draft.modelo}
                onChange={(e) => setDraft({ ...draft, modelo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>
              <ChipGroup
                options={ANOS}
                selected={draft.ano}
                onToggle={(k) => toggleSingle("ano", k)}
              />
            </div>

            <div className="space-y-2">
              <Label>Quilometragem</Label>
              <ChipGroup
                options={KMS}
                selected={draft.km}
                onToggle={(k) => toggleSingle("km", k)}
              />
            </div>

            <div className="space-y-2">
              <Label>Câmbio</Label>
              <ChipGroup
                options={CAMBIOS}
                selected={draft.cambios}
                multi
                onToggle={(k) => toggleArr("cambios", k)}
              />
            </div>

            <div className="space-y-2">
              <Label>Combustível</Label>
              <ChipGroup
                options={COMBUSTIVEIS}
                selected={draft.combustiveis}
                multi
                onToggle={(k) => toggleArr("combustiveis", k)}
              />
            </div>

            <div className="space-y-2">
              <Label>Carroceria</Label>
              <ChipGroup
                options={CARROCERIAS}
                selected={draft.carrocerias}
                multi
                onToggle={(k) => toggleArr("carrocerias", k)}
              />
            </div>

            <div className="space-y-2">
              <Label>Diferenciais</Label>
              <ChipGroup
                options={DIFERENCIAIS_AUTO}
                selected={draft.diferenciais}
                multi
                onToggle={(k) => toggleArr("diferenciais", k)}
              />
            </div>

            {cidades.length > 0 && (
              <div className="space-y-2">
                <Label>Cidade / Região</Label>
                <Select
                  value={draft.cidade}
                  onValueChange={(v) => setDraft({ ...draft, cidade: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as cidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {cidades.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-2 sticky bottom-0 bg-background pb-2">
              <Button variant="outline" className="flex-1" onClick={clearAll}>
                Limpar
              </Button>
              <Button className="flex-1" onClick={apply}>
                Aplicar filtros
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
