import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Shirt,
  Crown,
  Gem,
  Flower2,
  Leaf,
  Wind,
  Moon,
  Award,
  Briefcase,
  Flame,
  Tag,
  User,
} from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/styles")({
  head: () => ({
    meta: [
      { title: "Choose Dress Style — UnStitch" },
      { name: "description", content: "Pick the dress style for your virtual try-on." },
    ],
  }),
  component: StylesPage,
});

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;
type Style = { name: string; tag: string; icon: IconType };
type Gender = "women" | "men";

const WOMEN_STYLES: Style[] = [
  { name: "Shalwar Qameez", tag: "Daily / Formal", icon: Shirt },
  { name: "Anarkali", tag: "Festive", icon: Sparkles },
  { name: "Saree", tag: "Formal", icon: Flower2 },
  { name: "Lehenga", tag: "Wedding", icon: Gem },
  { name: "Kurti", tag: "Casual", icon: Leaf },
  { name: "Gharara", tag: "Festive", icon: Crown },
  { name: "Maxi Dress", tag: "Casual", icon: Wind },
  { name: "Abaya", tag: "Modest", icon: Moon },
];

const MEN_STYLES: Style[] = [
  { name: "Shalwar Kameez", tag: "Daily / Formal", icon: Shirt },
  { name: "Sherwani", tag: "Wedding", icon: Crown },
  { name: "Kurta Pyjama", tag: "Festive", icon: Flame },
  { name: "Waistcoat Set", tag: "Semi-formal", icon: Award },
  { name: "T-Shirt", tag: "Casual", icon: Tag },
  { name: "Polo Shirt", tag: "Smart Casual", icon: User },
  { name: "Formal Suit", tag: "Formal", icon: Briefcase },
];

function StylesPage() {
  const navigate = useNavigate();
  const [gender, setGender] = useState<Gender>("women");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  useEffect(() => {
    const g = sessionStorage.getItem("tryon:gender") as Gender | null;
    const s = sessionStorage.getItem("tryon:dressStyle");
    const fabric = sessionStorage.getItem("tryon:fabric");
    const person = sessionStorage.getItem("tryon:person");
    if (!fabric || !person) {
      navigate({ to: "/" });
      return;
    }
    if (g) setGender(g);
    if (s) setSelectedStyle(s);
  }, [navigate]);

  const styles = gender === "women" ? WOMEN_STYLES : MEN_STYLES;

  const next = () => {
    if (!selectedStyle) {
      toast.error("Pick a style to continue");
      return;
    }
    sessionStorage.setItem("tryon:dressStyle", selectedStyle);
    sessionStorage.setItem("tryon:gender", gender);
    navigate({ to: "/shoes" });
  };

  return (
    <main className="relative mx-auto min-h-svh w-full max-w-[460px] px-5 pb-36 pt-7">
      {/* Aurora backdrop */}
      <div className="bg-aurora pointer-events-none absolute inset-0 -z-10" />

      <Toaster position="top-center" />

      <header className="animate-fade-up mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="nm-raised-sm flex h-11 w-11 items-center justify-center rounded-2xl text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <div className="text-[9px] font-bold uppercase tracking-[0.32em] text-primary">
            Step 2 of 3
          </div>
          <h1 className="text-lg font-bold leading-none">Dress style</h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl nm-raised-sm text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
      </header>

      {/* Gender toggle */}
      <div className="animate-fade-up mb-6" style={{ animationDelay: "120ms" }}>
        <div className="relative grid grid-cols-2 rounded-full nm-inset-sm p-1.5">
          <span
            className="bg-copper shadow-glow absolute inset-y-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-full transition-transform duration-300"
            style={{ transform: gender === "women" ? "translateX(0)" : "translateX(100%)" }}
          />
          {(["women", "men"] as Gender[]).map((g) => (
            <button
              key={g}
              onClick={() => {
                setGender(g);
                setSelectedStyle(null);
              }}
              className={`relative z-10 py-2.5 text-sm font-bold capitalize tracking-wide transition-colors ${
                gender === g ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div
        className="animate-fade-up mb-4 flex items-baseline justify-between"
        style={{ animationDelay: "160ms" }}
      >
        <h2 className="text-xl font-bold">
          Choose <span className="text-gradient-copper">style</span>
        </h2>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {styles.length} options
        </span>
      </div>

      {Array.from(new Set(styles.map((s) => s.tag))).map((tag, tagIndex) => {
        const group = styles.filter((s) => s.tag === tag);
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
                const active = selectedStyle === s.name;
                const Icon = s.icon;
                return (
                  <button
                    key={s.name}
                    onClick={() => setSelectedStyle(s.name)}
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

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[460px] px-5 pb-6 pt-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
        <button
          onClick={next}
          disabled={!selectedStyle}
          className={`relative flex h-16 w-full items-center justify-center gap-2.5 rounded-full text-base font-bold tracking-wide transition-all active:scale-[0.985] ${
            selectedStyle
              ? "bg-copper text-primary-foreground shadow-glow-strong animate-cta-breathe"
              : "nm-raised text-muted-foreground"
          }`}
        >
          {selectedStyle ? (
            <>
              Next: shoes <ArrowRight className="h-5 w-5" />
            </>
          ) : (
            <>
              <Shirt className="h-5 w-5" /> Pick a style
            </>
          )}
        </button>
      </div>
    </main>
  );
}
