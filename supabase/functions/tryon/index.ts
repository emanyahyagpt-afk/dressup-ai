// Virtual try-on edge function — uses Lovable AI image preview model
// to render the uploaded fabric, in the chosen dress style, on the person.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fabricImage, personImage, shoesImage, style, shoeStyle, gender } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!fabricImage || !personImage || !style) {
      return new Response(JSON.stringify({ error: "Missing inputs" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageLabels: string[] = ["IMAGE 1 = UNSTITCHED FABRIC", "IMAGE 2 = THE PERSON"];
    if (shoesImage) imageLabels.push("IMAGE 3 = SHOES REFERENCE");

    const shoesBlock = shoesImage
      ? `\n\nIMAGE 3 — SHOES REFERENCE.\nReplicate these shoes EXACTLY on the person's feet — same colour, material, shape, straps, sole and style. Treat IMAGE 3 as ground truth for footwear. Do not change the person's legs, feet size, stance, body height or body shape while adding the shoes.`
      : `\n\nFOOTWEAR: Render a pair of "${shoeStyle}" shoes on the person's feet that pair tastefully with the outfit. Realistic material, correct shape, correctly worn. Do not change the person's legs, feet size, stance, body height or body shape while adding the shoes.`;

    const prompt = `Photorealistic virtual try-on. You are given ${imageLabels.length} reference images: ${imageLabels.join(", ")}.

IMAGE 1 — UNSTITCHED FABRIC (raw cloth swatch).
You MUST replicate this fabric with 100% fidelity on the final garment:
- exact same colour and colour temperature (do not shift hue, saturation or brightness)
- exact same print/pattern, motifs, embroidery, prints, borders and their scale
- exact same weave, sheen and texture (silk, cotton, chiffon, lawn, velvet, etc.)
- preserve any border / pallu / panel layout naturally on the stitched garment
Treat IMAGE 1 as the ground truth for the fabric. Do NOT invent a new pattern or change colours.

IMAGE 2 — THE PERSON / IDENTITY LOCK.
This is a clothing-and-footwear replacement task, NOT a person replacement task. Preserve the uploaded person exactly:
- Keep the exact same face identity, facial structure, eyes, nose, lips, jawline, ears, eyebrows, expression and skin tone.
- Keep the exact same hair: hairstyle, hairline, length, volume, colour, parting, flyaways and coverage around the face.
- Keep the exact same body physique, body proportions, shoulder width, waist, arms, legs, posture, stance, height and camera angle.
- Keep the same age, gender presentation, ethnicity and natural imperfections. Do not beautify, slim, reshape, age, de-age, add makeup, smooth skin, change facial symmetry or create a new model.
- The face, hair, head shape and visible skin are ground truth from IMAGE 2 and must remain recognizable as the same real individual.
- If any instruction conflicts with identity preservation, identity preservation wins. Only change the clothing fabric/style and shoes.${shoesBlock}

TASK: Tailor the fabric from IMAGE 1 into a well-stitched "${style}" garment for a ${gender}, and dress the exact same person from IMAGE 2 in it, wearing ${shoeStyle ?? "appropriate"} shoes. Keep the original face, hair, body shape, height, pose and proportions unchanged. Show a single FULL-BODY, head-to-toe, sharp, photorealistic image with the person still recognizable as the same individual. Feet and shoes MUST be visible in frame. Studio-quality lighting, neutral clean background, natural fabric drape and realistic stitching.

STRICT OUTPUT RULES:
- Identity fidelity is mandatory: do not replace, redraw or reinterpret the face, hair, body physique, pose or height.
- High resolution, sharp, no pixelation, no blur, no compression artefacts, no upscaling smear.
- NO watermark, NO logo, NO signature, NO "Dreamslight", NO "Gemini", NO text, NO captions, NO borders, NO frame.
- Do not add any brand mark or sample/preview overlay anywhere in the image.
- Output ONLY the final clean try-on photo, nothing else.`;

    const content: Array<Record<string, unknown>> = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: fabricImage } },
      { type: "image_url", image_url: { url: personImage } },
    ];
    if (shoesImage) content.push({ type: "image_url", image_url: { url: shoesImage } });

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      if (resp.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Try-on failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      console.error("No image in response", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "No image returned" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ image: imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tryon error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
