import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Upload, Sparkles, Loader2, Download, RotateCcw, Shirt, User } from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UnStitch — Virtual Try-On for Unstitched Fabric" },
      { name: "description", content: "Upload a fabric and your photo. UnStitch stitches it into your chosen dress style and shows you wearing it — instantly." },
    ],
  }),
  component: Home,
});

type Gender = "women" | "men";
type Style = { name: string; tag: string };

const WOMEN_STYLES: Style[] = [
  { name: "Shalwar Qameez", tag: "Daily / Formal" },
  { name: "Anarkali", tag: "Festive" },
  { name: "Saree", tag: "Formal" },
  { name: "Lehenga", tag: "Wedding" },
  { name: "Kurti", tag: "Casual" },
  { name: "Gharara", tag: "Festive" },
  { name: "Maxi Dress", tag: "Casual" },
  { name: "Abaya", tag: "Modest" },
];

const MEN_STYLES: Style[] = [
  { name: "Shalwar Kameez", tag: "Daily / Formal" },
  { name: "Sherwani", tag: "Wedding" },
  { name: "Kurta Pyjama", tag: "Festive" },
  { name: "Waistcoat Set", tag: "Semi-formal" },
  { name: "T-Shirt", tag: "Casual" },
  { name: "Polo Shirt", tag: "Smart Casual" },
  { name: "Formal Suit", tag: "Formal" },
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
  icon,
  image,
  onPick,
  inputRef,
}: {
  label: string;
  icon: React.ReactNode;
  image: string | null;
  onPick: (f: File) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="group relative aspect-[3/4] w-full overflow-hidden rounded-3xl glass shadow-deep transition-transform active:scale-[0.98]"
    >
      {image ? (
        <img src={image} alt={label} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground shadow-gold">
            {icon}
          </div>
          <div className="text-sm font-medium text-foreground/90">{label}</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Tap to upload
          </div>
        </div>
      )}
      {image && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-3 text-xs">
          <span className="font-medium text-foreground/95">{label}</span>
          <span className="rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Replace
          </span>
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
  const [fabric, setFabric] = useState<string | null>(null);
  const [person, setPerson] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender>("women");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const fabricRef = useRef<HTMLInputElement>(null);
  const personRef = useRef<HTMLInputElement>(null);

  const styles = gender === "women" ? WOMEN_STYLES : MEN_STYLES;
  const ready = fabric && person && selectedStyle && !loading;

  const handleFabric = async (f: File) => setFabric(await fileToDataUrl(f));
  const handlePerson = async (f: File) => setPerson(await fileToDataUrl(f));

  const generate = async () => {
    if (!ready) return;
    setLoading(true);
    setResult(null);
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
      setResult(data.image);
      toast.success("Your try-on is ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFabric(null);
    setPerson(null);
    setSelectedStyle(null);
    setResult(null);
  };

  return (
    <main className="mx-auto min-h-svh w-full max-w-[440px] px-5 pb-32 pt-8">
      <Toaster position="top-center" theme="dark" richColors />

      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-primary/80">
            Virtual Try-On
          </div>
          <h1 className="mt-1 text-3xl font-bold leading-none">
            Un<span className="text-gradient-gold">Stitch</span>
          </h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full glass">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
      </header>

      {/* Uploads */}
      <section className="grid grid-cols-2 gap-4">
        <UploadTile
          label="Fabric"
          icon={<Shirt className="h-6 w-6" />}
          image={fabric}
          onPick={handleFabric}
          inputRef={fabricRef}
        />
        <UploadTile
          label="Your photo"
          icon={<User className="h-6 w-6" />}
          image={person}
          onPick={handlePerson}
          inputRef={personRef}
        />
      </section>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Upload an unstitched fabric and a full-body photo
      </p>

      {/* Gender toggle */}
      <div className="mt-8">
        <div className="relative grid grid-cols-2 rounded-full glass p-1">
          <span
            className="absolute inset-y-1 w-1/2 rounded-full bg-gradient-gold shadow-gold transition-transform duration-300"
            style={{ transform: gender === "women" ? "translateX(0)" : "translateX(100%)" }}
          />
          {(["women", "men"] as Gender[]).map((g) => (
            <button
              key={g}
              onClick={() => {
                setGender(g);
                setSelectedStyle(null);
              }}
              className={`relative z-10 py-2.5 text-sm font-semibold capitalize transition-colors ${
                gender === g ? "text-primary-foreground" : "text-foreground/70"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Style picker */}
      <section className="mt-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Choose a style</h2>
          <span className="text-xs text-muted-foreground">{styles.length} options</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {styles.map((s) => {
            const active = selectedStyle === s.name;
            return (
              <button
                key={s.name}
                onClick={() => setSelectedStyle(s.name)}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/10 shadow-gold"
                    : "border-border/40 glass hover:border-primary/40"
                }`}
              >
                <div className="text-sm font-semibold leading-tight">{s.name}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.tag}
                </div>
                {active && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-gold" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Result */}
      {(loading || result) && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Your try-on</h2>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl glass shadow-deep">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-sm text-muted-foreground">Stitching your look…</div>
              </div>
            )}
            {result && (
              <img src={result} alt="Try-on result" className="h-full w-full object-cover" />
            )}
          </div>
          {result && !loading && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <a
                href={result}
                download="unstitch-tryon.png"
                className="flex items-center justify-center gap-2 rounded-full glass py-3 text-sm font-medium"
              >
                <Download className="h-4 w-4" /> Save
              </a>
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 rounded-full glass py-3 text-sm font-medium"
              >
                <RotateCcw className="h-4 w-4" /> Start over
              </button>
            </div>
          )}
        </section>
      )}

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[440px] px-5 pb-6 pt-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <button
          onClick={generate}
          disabled={!ready}
          className="relative flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-gold text-base font-bold text-primary-foreground shadow-gold transition-all active:scale-[0.98] disabled:opacity-40 disabled:saturate-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Generating
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              {!fabric || !person
                ? "Upload both photos"
                : !selectedStyle
                  ? "Pick a style"
                  : `Try on ${selectedStyle}`}
            </>
          )}
        </button>
      </div>
    </main>
  );
}
