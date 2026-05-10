import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, RotateCcw, Wand2, ArrowLeft, Share2, Sparkles } from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/result")({
  head: () => ({
    meta: [
      { title: "Your Try-On — UnStitch" },
      { name: "description", content: "See your fabric tailored onto you in your chosen style." },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [style, setStyle] = useState<string>("");

  useEffect(() => {
    const img = sessionStorage.getItem("tryon:image");
    const s = sessionStorage.getItem("tryon:style") || "";
    if (!img) {
      navigate({ to: "/" });
      return;
    }
    setImage(img);
    setStyle(s);
  }, [navigate]);

  const share = async () => {
    if (!image) return;
    try {
      const blob = await (await fetch(image)).blob();
      const file = new File([blob], "unstitch-tryon.png", { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My UnStitch try-on" });
      } else {
        await navigator.clipboard.writeText(image);
        toast.success("Image link copied");
      }
    } catch {
      toast.error("Couldn't share");
    }
  };

  const startOver = () => {
    sessionStorage.removeItem("tryon:image");
    sessionStorage.removeItem("tryon:style");
    navigate({ to: "/" });
  };

  if (!image) return null;

  return (
    <main className="mx-auto min-h-svh w-full max-w-[460px] px-5 pb-32 pt-7">
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

      <header className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="flex h-11 w-11 items-center justify-center rounded-2xl nm-raised-sm text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <div className="text-[9px] font-bold uppercase tracking-[0.32em] text-primary">
            Tailored Look
          </div>
          <h1 className="text-lg font-bold leading-none">Your try-on</h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl nm-raised-sm text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
      </header>

      {style && (
        <div className="mb-5 flex items-center justify-center gap-2 rounded-full nm-inset-sm py-2.5">
          <Wand2 className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">
            {style}
          </span>
        </div>
      )}

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem] nm-raised-lg">
        <img src={image} alt={`Try-on ${style}`} className="h-full w-full object-cover" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <a
          href={image}
          download="unstitch-tryon.png"
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl nm-pressable py-4 text-xs font-bold text-foreground"
        >
          <Download className="h-5 w-5 text-primary" /> Save
        </a>
        <button
          onClick={share}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl nm-pressable py-4 text-xs font-bold text-foreground"
        >
          <Share2 className="h-5 w-5 text-primary" /> Share
        </button>
        <button
          onClick={startOver}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl nm-pressable py-4 text-xs font-bold text-foreground"
        >
          <RotateCcw className="h-5 w-5 text-primary" /> New
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[460px] px-5 pb-6 pt-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
        <Link
          to="/"
          className="relative flex h-14 w-full items-center justify-center gap-2 rounded-full bg-copper text-base font-bold text-primary-foreground shadow-copper active:scale-[0.985]"
        >
          <Sparkles className="h-5 w-5" /> Try another style
        </Link>
      </div>
    </main>
  );
}
