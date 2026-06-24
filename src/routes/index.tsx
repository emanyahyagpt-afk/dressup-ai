import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Shirt, User, Check, Camera, Footprints, ArrowRight } from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UnStitch — Virtual Try-On for Unstitched Fabric" },
      {
        name: "description",
        content:
          "Upload your fabric, your photo and shoes. UnStitch tailors a complete look on you — instantly.",
      },
    ],
  }),
  component: Home,
});

type Gender = "women" | "men";

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
  optional,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  image: string | null;
  onPick: (f: File) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  step: number;
  optional?: boolean;
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
        <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 p-3 text-center">
          <div className="flex h-6 w-6 items-center justify-center rounded-full nm-inset-sm text-[10px] font-bold text-muted-foreground">
            {step}
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl nm-inset text-primary">
            {icon}
          </div>
          <div className="text-[13px] font-semibold text-foreground leading-tight">{label}</div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            {optional ? "Optional" : hint}
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
  const [shoes, setShoes] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender>("women");

  const fabricRef = useRef<HTMLInputElement>(null);
  const personRef = useRef<HTMLInputElement>(null);
  const shoesRef = useRef<HTMLInputElement>(null);

  // Restore from session (when coming back via Back)
  useEffect(() => {
    const f = sessionStorage.getItem("tryon:fabric");
    const p = sessionStorage.getItem("tryon:person");
    const s = sessionStorage.getItem("tryon:shoes");
    const g = sessionStorage.getItem("tryon:gender") as Gender | null;
    if (f) setFabric(f);
    if (p) setPerson(p);
    if (s) setShoes(s);
    if (g) setGender(g);
  }, []);

  const ready = !!(fabric && person);
  const completed = [fabric, person].filter(Boolean).length;
  const progress = Math.round((completed / 2) * 100);

  const next = () => {
    if (!ready) {
      toast.error("Upload your fabric and photo first");
      return;
    }
    sessionStorage.setItem("tryon:fabric", fabric!);
    sessionStorage.setItem("tryon:person", person!);
    if (shoes) sessionStorage.setItem("tryon:shoes", shoes);
    else sessionStorage.removeItem("tryon:shoes");
    sessionStorage.setItem("tryon:gender", gender);
    navigate({ to: "/styles" });
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

      {/* Step indicator */}
      <div className="mb-6 rounded-3xl nm-raised p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Step 1 of 3 · Uploads</span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>
        <div className="mt-3 h-2.5 rounded-full nm-inset-sm overflow-hidden">
          <div
            className="h-full bg-copper rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className={fabric ? "text-primary font-bold" : ""}>Fabric</span>
          <span className={person ? "text-primary font-bold" : ""}>Photo</span>
          <span className={shoes ? "text-primary font-bold" : ""}>Shoes</span>
        </div>
      </div>

      {/* Uploads */}
      <section className="grid grid-cols-2 gap-4">
        <UploadTile
          label="Fabric"
          hint="Unstitched cloth"
          step={1}
          icon={<Shirt className="h-6 w-6" />}
          image={fabric}
          onPick={async (f) => setFabric(await fileToDataUrl(f))}
          inputRef={fabricRef}
        />
        <UploadTile
          label="Your Photo"
          hint="Full body works best"
          step={2}
          icon={<User className="h-6 w-6" />}
          image={person}
          onPick={async (f) => setPerson(await fileToDataUrl(f))}
          inputRef={personRef}
        />
      </section>

      <section className="mt-4">
        <UploadTile
          label="Shoes (optional)"
          hint="Upload to match"
          step={3}
          icon={<Footprints className="h-6 w-6" />}
          image={shoes}
          onPick={async (f) => setShoes(await fileToDataUrl(f))}
          inputRef={shoesRef}
          optional
        />
      </section>

      {/* Gender toggle */}
      <div className="mt-7">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Wearer
        </div>
        <div className="relative grid grid-cols-2 rounded-full nm-inset-sm p-1.5">
          <span
            className="absolute inset-y-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-full bg-copper shadow-copper transition-transform duration-300"
            style={{ transform: gender === "women" ? "translateX(0)" : "translateX(100%)" }}
          />
          {(["women", "men"] as Gender[]).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`relative z-10 py-2.5 text-sm font-bold capitalize tracking-wide transition-colors ${
                gender === g ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[460px] px-5 pb-6 pt-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
        <button
          onClick={next}
          disabled={!ready}
          className={`relative flex h-16 w-full items-center justify-center gap-2.5 rounded-full text-base font-bold tracking-wide transition-all active:scale-[0.985] ${
            ready
              ? "bg-copper text-primary-foreground shadow-copper"
              : "nm-raised text-muted-foreground"
          }`}
        >
          {!fabric || !person ? (
            <>
              <Camera className="h-5 w-5" /> Upload fabric & photo
            </>
          ) : (
            <>
              Choose your style <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </main>
  );
}
