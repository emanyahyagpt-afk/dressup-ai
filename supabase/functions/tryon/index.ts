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

    const imageLabels: string[] = ["IMAGE 1 = THE PERSON / BASE PHOTO", "IMAGE 2 = UNSTITCHED FABRIC"];
    if (shoesImage) imageLabels.push("IMAGE 3 = SHOES REFERENCE");

    const shoesBlock = shoesImage
      ? `\n\nIMAGE 3 — SHOES REFERENCE.\nIf the original person photo shows the feet, replace only the footwear with these shoes exactly — same colour, material, shape, straps, sole and style. Treat IMAGE 3 as ground truth for footwear. If the feet are cropped out or hidden, do NOT extend the body, change the pose, invent legs, or reframe the image just to show shoes.`
      : `\n\nFOOTWEAR: If the original person photo shows the feet, render a pair of "${shoeStyle}" shoes naturally on the same feet. If the feet are cropped out or hidden, do NOT extend the body, change the pose, invent legs, or reframe the image just to show shoes.`;

    const prompt = `Photorealistic identity-preserving virtual try-on. You are given ${imageLabels.length} reference images: ${imageLabels.join(", ")}.

IMAGE 1 — THE PERSON / BASE PHOTO / IDENTITY AND POSE LOCK.
Use IMAGE 1 as the actual base canvas for the final result. This is an image-editing task, not a new person generation task.
Preserve the uploaded person exactly:
- Keep the exact same face identity, facial structure, eyes, nose, lips, jawline, ears, eyebrows, expression and skin tone.
- Keep the exact same hair: hairstyle, hairline, length, volume, colour, parting, flyaways and coverage around the face.
- Keep the exact same body physique, body proportions, shoulder width, waist, arms, legs, posture, stance, height and camera angle.
- Keep the exact same pose, head angle, hand placement, limb placement, crop, framing, background perspective, lighting direction and shadows.
- Keep the same age, gender presentation, ethnicity and natural imperfections. Do not beautify, slim, reshape, age, de-age, add makeup, smooth skin, change facial symmetry or create a new model.
- The face, hair, head shape, visible skin, hands, arms, legs, body silhouette and pose are locked regions from IMAGE 1 and must remain recognizable as the same real individual.
- If any instruction conflicts with identity, hair, body, pose, framing or crop preservation, preservation wins. Only edit clothing and visible footwear.

IMAGE 2 — UNSTITCHED FABRIC (raw cloth swatch).
You MUST replicate this fabric with 100% fidelity on the visible final garment:
- exact same colour and colour temperature (do not shift hue, saturation or brightness)
- exact same print/pattern, motifs, embroidery, prints, borders and their scale
- exact same weave, sheen and texture (silk, cotton, chiffon, lawn, velvet, etc.)
- preserve any border / pallu / panel layout naturally on the stitched garment
Treat IMAGE 2 as the ground truth for the fabric. Do NOT invent a new pattern or change colours.${shoesBlock}

TASK: Edit IMAGE 1 directly by replacing only the person's current visible clothing with a well-stitched "${style}" garment for a ${gender}, tailored from the fabric in IMAGE 2. Preserve the exact original face, hair, body shape, height, pose, proportions, camera angle, crop and background. Add footwear only where the original feet are already visible. Do not create a different pose, full-body version, studio model, new background, new face, new hair, or altered body. Natural fabric drape and realistic stitching should follow the original body's locked shape and pose.

STRICT OUTPUT RULES:
- Identity fidelity is mandatory: do not replace, redraw or reinterpret the face, hair, body physique, pose, height, stance, crop or camera angle.
- Do not force a full-body output if the uploaded photo is not full-body; never invent missing legs/feet or alter the person's pose to show shoes.
- High resolution, sharp, no pixelation, no blur, no compression artefacts, no upscaling smear.
- NO watermark, NO logo, NO signature, NO "Dreamslight", NO "Gemini", NO text, NO captions, NO borders, NO frame.
- Do not add any brand mark or sample/preview overlay anywhere in the image.
- Output ONLY the final clean try-on photo, nothing else.`;

    const content: Array<Record<string, unknown>> = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: personImage } },
      { type: "image_url", image_url: { url: fabricImage } },
    ];
    if (shoesImage) content.push({ type: "image_url", image_url: { url: shoesImage } });

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image",
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
