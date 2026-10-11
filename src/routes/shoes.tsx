import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Footprints,
  Loader2,
  Crown,
  Wind,
  Mountain,
  Snowflake,
  Flame,
  Activity,
  Anchor,
  Heart,
} from "lucide-react";
import { toast, Toaster } from "sonner";

const LOADING_STAGES = [
  "Reading your fabric…",
  "Stitching the drape…",
  "Matching your shoes…",
  "Adding final touches…",
];

export const Route = createFileRoute("/shoes")({
  head: () => ({
    meta: [
      { title: "Choose Shoes — UnStitch" },
      { name: "description", content: "Pick the shoe style for your virtual try-on." },
    ],
  }),
  component: ShoesPage,
});

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;
type Shoe = { name: string; tag: string; icon: IconType };
type Gender = "women" | "men";

const WOMEN_SHOES: Shoe[] = [
  { name: "Khussa", tag: "Traditional", icon: Crown },
  { name: "Kolhapuri", tag: "Traditional", icon: Heart },
  { name: "Pumps", tag: "Formal", icon: Sparkles },
  { name: "Heels", tag: "Formal", icon: Flame },
  { name: "Flats", tag: "Casual", icon: Wind },
  { name: "Sandals", tag: "Casual", icon: Anchor },
  { name: "Wedges", tag: "Casual", icon: Mountain },
  { name: "Joggers", tag: "Sporty", icon: Activity },
  { name: "Sneakers", tag: "Sporty", icon: Footprints },
  { name: "Boots", tag: "Winter", icon: Snowflake },
];

const MEN_SHOES: Shoe[] = [
  { name: "Khussa", tag: "Traditional", icon: Crown },
  { name: "Peshawari Chappal", tag: "Traditional", icon: Heart },
  { name: "Oxford", tag: "Formal", icon: Sparkles },
  { name: "Loafers", tag: "Formal", icon: Anchor },
  { name: "Sandals", tag: "Casual", icon: Wind },
  { name: "Joggers", tag: "Sporty", icon: Activity },
  { name: "Sneakers", tag: "Sporty", icon: Footprints },
  { name: "Running Shoes", tag: "Sporty", icon: Flame },
  { name: "Boots", tag: "Winter", icon: Snowflake },
];

function ShoesPage() {
  const navigate = useNavigate();
  const [gender, setGender] = useState<Gender>("women");
  const [dressStyle, setDressStyle] = useState<string>("");
  const [selectedShoe, setSelectedShoe] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);

  // Cycle loading stages while generating
  useEffect(() => {
    if (!loading) return;
    setStage(0);
    const timer = setInterval(() => {
      setStage((s) => (s + 1) % LOADING_STAGES.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    const fabric = sessionStorage.getItem("tryon:fabric");
    const person = sessionStorage.getItem("tryon:person");
    const ds = sessionStorage.getItem("tryon:dressStyle");
    const g = sessionStorage.getItem("tryon:gender") as Gender | null;
    if (!fabric || !person || !ds) {
      navigate({ to: "/" });
      return;
    }
    setDressStyle(ds);
    if (g) setGender(g);
    const ss = sessionStorage.getItem("tryon:shoeStyle");
    if (ss) setSelectedShoe(ss);
  }, [navigate]);

  const shoes = gender === "women" ? WOMEN_SHOES : MEN_SHOES;

  const generate = async () => {
    if (!selectedShoe) {
      toast.error("Pick shoes to continue");
      return;
    }
    setLoading(true);
    try {
      const fabric = sessionStorage.getItem("tryon:fabric")!;
      const person = sessionStorage.getItem("tryon:person")!;
      const shoesImg = sessionStorage.getItem("tryon:shoes");
      sessionStorage.setItem("tryon:shoeStyle", selectedShoe);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryon`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          fabricImage: fabric,
          personImage: person,
          shoesImage: shoesImg || null,
          style: dressStyle,
          shoeStyle: selectedShoe,
          gender,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      sessionStorage.setItem("tryon:image", data.image);
      sessionStorage.setItem("tryon:style", `${dressStyle} · ${selectedShoe}`);
      toast.success("Your look is ready");
      navigate({ to: "/result" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative mx-auto min-h-svh w-full max-w-[460px] px-5 pb-36 pt-7">
      {/* Aurora backdrop */}
      <div className="bg-aurora pointer-events-none absolute inset-0 -z-10" />

      <Toaster position="top-center" />

      <header className="animate-fade-up mb-6 flex items-center justify-between">
        <Link
          to="/styles"
          className="nm-raised-sm flex h-11 w-11 items-center justify-center rounded-2xl text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <div className="text-[9px] font-bold uppercase tracking-[0.32em] text-primary">
            Step 3 of 3
          </div>
          <h1 className="text-lg font-bold leading-none">Shoes</h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl nm-raised-sm text-primary">
          <Footprints className="h-5 w-5" />
        </div>
      </header>

      {dressStyle && (
        <div
          className="animate-fade-up mb-6 flex items-center justify-center gap-2 rounded-full nm-inset-sm py-2.5"
          style={{ animationDelay: "100ms" }}
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">
            {dressStyle}
          </span>
        </div>
      )}

      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-bold">
          Pair with <span className="text-gradient-copper">shoes</span>
        </h2>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {shoes.length} options
        </span>
      </div>

      {Array.from(new Set(shoes.map((s) => s.tag))).map((tag, tagIndex) => {
        const group = shoes.filter((s) => s.tag === tag);
        return (
          <div
            key={tag}
            className="animate-fade-up mb-5 last:mb-0"
            style={{ animationDelay: `${200 + tagIndex * 120}ms` }}
          >
            <div className="mb-2.5 flex items-center gap-2">
              <span className="bg-copper-line h-px flex-1" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                {tag}
              </span>
              <span className="bg-copper-line h-px flex-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {group.map((s, i) => {
                const active = selectedShoe === s.name;
                const Icon = s.icon;
                return (
                  <button
                    key={s.name}
                    onClick={() => setSelectedShoe(s.name)}
                    style={{ animationDelay: `${260 + tagIndex * 120 + i * 45}ms` }}
                    className={`animate-fade-up relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl p-2 text-center transition-all duration-200 ${
                      active ? "nm-inset" : "nm-pressable"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                        active
                          ? "bg-copper text-primary-foreground shadow-glow"
                          : "nm-inset-sm text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <div
                      className={`text-[11px] font-bold leading-tight transition-colors ${
                        active ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {s.name}
                    </div>
                    {active && (
                      <span className="shadow-glow animate-pop-in absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-copper text-primary-foreground">
                        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-background/85 backdrop-blur-md">
          <div className="relative flex h-28 w-28 items-center justify-center">
            {/* Pulsing rings */}
            <span className="animate-nm-pulse absolute inset-0 rounded-full nm-inset" />
            <span className="absolute inset-0 rounded-full border border-dashed border-primary/40 animate-shape-spin" />
            <Loader2 className="h-9 w-9 animate-spin text-primary" />
          </div>
          <div className="text-center">
            <div className="text-base font-bold text-foreground">Tailoring your look…</div>
            <div className="mt-1.5 h-4 text-xs text-muted-foreground" aria-live="polite">
              <span key={stage} className="animate-fade-up inline-block">
                {LOADING_STAGES[stage]}
              </span>
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/70">
              {dressStyle} · {selectedShoe}
            </div>
          </div>
          <div className="h-1.5 w-48 overflow-hidden rounded-full nm-inset-sm">
            <div className="shimmer bg-copper h-full w-full rounded-full" />
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[460px] px-5 pb-6 pt-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
        <button
          onClick={generate}
          disabled={!selectedShoe || loading}
          className={`relative flex h-16 w-full items-center justify-center gap-2.5 rounded-full text-base font-bold tracking-wide transition-all active:scale-[0.985] ${
            selectedShoe && !loading
              ? "bg-copper text-primary-foreground shadow-glow-strong animate-cta-breathe"
              : "nm-raised text-muted-foreground"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Generating…
            </>
          ) : selectedShoe ? (
            <>
              <Sparkles className="h-5 w-5" /> Generate try-on
            </>
          ) : (
            <>
              <Footprints className="h-5 w-5" /> Pick shoes
            </>
          )}
        </button>
      </div>
    </main>
  );
}
