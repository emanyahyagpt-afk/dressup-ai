import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type ComponentType } from "react";
import {
  Sparkles, Loader2, Shirt, User, Check, Camera,
  Crown, Gem, Flower2, Leaf, Wind, Moon, Award, Briefcase, Flame, Tag,
} from "lucide-react";
import { toast, Toaster } from "sonner";

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UnStitch — Virtual Try-On for Unstitched Fabric" },
      {
        name: "description",
        content:
          "Upload a fabric and your photo. UnStitch tailors it into your chosen dress style and shows you wearing it — instantly.",
      },
    ],
  }),
  component: Home,
});

type Gender = "women" | "men";
type Style = { name: string; tag: string; icon: IconType };

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

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

function UploadTile({
  label,
  hint,
  icon,
  image,
  onPick,
  inputRef,
  step,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  image: string | null;
  onPick: (f: File) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  step: number;
}) {
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="group relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] nm-raised transition-all active:scale-[0.985]"
    >
      {image ? (
        <>
          <img src={image} alt={label} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
          <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-copper text-primary-foreground shadow-copper">
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3 text-xs text-white">
            <span className="font-semibold tracking-wide">{label}</span>
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
              Replace
            </span>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full nm-inset-sm text-[11px] font-bold text-muted-foreground">
            {step}
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl nm-inset text-primary">
            {icon}
          </div>
          <div className="text-sm font-semibold text-foreground">{label}</div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {hint}
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.currentTarget.value = "";
        }}
      />
    </button>
  );
}

function Home() {
  const navigate = useNavigate();
  const [fabric, setFabric] = useState<string | null>(null);
  const [person, setPerson] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender>("women");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fabricRef = useRef<HTMLInputElement>(null);
  const personRef = useRef<HTMLInputElement>(null);

  const styles = gender === "women" ? WOMEN_STYLES : MEN_STYLES;
  const ready = !!(fabric && person && selectedStyle && !loading);
  const completed = [fabric, person, selectedStyle].filter(Boolean).length;
  const progress = Math.round((completed / 3) * 100);

  const handleFabric = async (f: File) => setFabric(await fileToDataUrl(f));
  const handlePerson = async (f: File) => setPerson(await fileToDataUrl(f));

  const generate = async () => {
    if (!ready) return;
    setLoading(true);
    try {
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
          style: selectedStyle,
          gender,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      sessionStorage.setItem("tryon:image", data.image);
      sessionStorage.setItem("tryon:style", selectedStyle ?? "");
      toast.success("Your try-on is ready");
      navigate({ to: "/result" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-svh w-full max-w-[460px] px-5 pb-36 pt-7">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--color-background)",
            color: "var(--color-foreground)",
            boxShadow: "var(--shadow-nm-sm)",
            border: "none",
            borderRadius: "1rem",
          },
        }}
      />

      {/* Header */}
      <header className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl nm-raised-sm">
            <span className="text-xl font-bold text-gradient-copper">U</span>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.32em] text-primary">
              Virtual Atelier
            </div>
            <h1 className="text-2xl font-bold leading-none tracking-tight">
              Un<span className="text-gradient-copper">Stitch</span>
            </h1>
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl nm-raised-sm text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
      </header>

      {/* Progress card */}
      <div className="mb-6 rounded-3xl nm-raised p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Your session</span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>
        <div className="mt-3 h-2.5 rounded-full nm-inset-sm overflow-hidden">
          <div
            className="h-full bg-copper rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className={fabric ? "text-primary font-bold" : ""}>1. Fabric</span>
          <span className={person ? "text-primary font-bold" : ""}>2. Photo</span>
          <span className={selectedStyle ? "text-primary font-bold" : ""}>3. Style</span>
        </div>
      </div>

      {/* Uploads */}
      <section className="grid grid-cols-2 gap-4">
        <UploadTile
          label="Fabric"
          hint="Tap to upload"
          step={1}
          icon={<Shirt className="h-7 w-7" />}
          image={fabric}
          onPick={handleFabric}
          inputRef={fabricRef}
        />
        <UploadTile
          label="Your Photo"
          hint="Full body works best"
          step={2}
          icon={<User className="h-7 w-7" />}
          image={person}
          onPick={handlePerson}
          inputRef={personRef}
        />
      </section>

      {/* Gender toggle */}
      <div className="mt-7">
        <div className="relative grid grid-cols-2 rounded-full nm-inset-sm p-1.5">
          <span
            className="absolute inset-y-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-full bg-copper shadow-copper transition-transform duration-300"
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

      {/* Style picker */}
      <section className="mt-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold">
            Choose <span className="text-gradient-copper">style</span>
          </h2>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {styles.length} options
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          {styles.map((s) => {
            const active = selectedStyle === s.name;
            return (
              <button
                key={s.name}
                onClick={() => setSelectedStyle(s.name)}
                className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 ${
                  active ? "nm-inset" : "nm-pressable"
                }`}
              >
                <div className="mb-2 text-2xl">{s.emoji}</div>
                <div className="text-sm font-bold leading-tight text-foreground">{s.name}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.tag}
                </div>
                {active && (
                  <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-copper text-primary-foreground shadow-copper">
                    <Check className="h-3 w-3" strokeWidth={3.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Result */}
      {(loading || result) && (
        <section id="result" className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold">Your try-on</h2>
          </div>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] nm-raised-lg">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full nm-inset animate-nm-pulse">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-foreground">
                    Tailoring your look…
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Stitching {selectedStyle} from your fabric
                  </div>
                </div>
                <div className="h-1.5 w-40 overflow-hidden rounded-full nm-inset-sm">
                  <div className="shimmer h-full w-full" />
                </div>
              </div>
            )}
            {result && !loading && (
              <img src={result} alt="Try-on result" className="h-full w-full object-cover" />
            )}
          </div>
          {result && !loading && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <a
                href={result}
                download="unstitch-tryon.png"
                className="flex items-center justify-center gap-2 rounded-2xl nm-pressable py-3.5 text-sm font-bold text-foreground"
              >
                <Download className="h-4 w-4" /> Save
              </a>
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 rounded-2xl nm-pressable py-3.5 text-sm font-bold text-foreground"
              >
                <RotateCcw className="h-4 w-4" /> Start over
              </button>
            </div>
          )}
        </section>
      )}

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[460px] px-5 pb-6 pt-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
        <button
          onClick={generate}
          disabled={!ready}
          className={`relative flex h-16 w-full items-center justify-center gap-2.5 rounded-full text-base font-bold tracking-wide transition-all active:scale-[0.985] ${
            ready
              ? "bg-copper text-primary-foreground shadow-copper"
              : "nm-raised text-muted-foreground"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Generating…
            </>
          ) : !fabric || !person ? (
            <>
              <Camera className="h-5 w-5" /> Upload both photos
            </>
          ) : !selectedStyle ? (
            <>
              <Shirt className="h-5 w-5" /> Pick a style
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" /> Try on {selectedStyle}
            </>
          )}
        </button>
      </div>
    </main>
  );
}
