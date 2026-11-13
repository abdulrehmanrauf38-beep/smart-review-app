module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { restaurantName = "this restaurant", rating = 5, tags = [] } = req.body || {};
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();

  const prompt = `Write a natural, authentic, human-sounding 2-sentence Google review for a restaurant named "${restaurantName}". The customer gave ${rating} out of 5 stars and highlighted: ${tags.join(", ")}. Do not use hashtags, emojis, or robotic marketing words.`;

  const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

  if (apiKey) {
    for (const model of models) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        clearTimeout(timer);
        const data = await response.json();
        const reviewText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (response.ok && reviewText) {
          return res.status(200).json({ review: reviewText });
        }
      } catch (e) {
        // Move immediately to next model or fallback
      }
    }
  }

  // Instant zero-wait fallback if Gemini servers are temporarily overloaded
  const highlights = tags.length > 1
    ? `${tags.slice(0, -1).join(", ")} and ${tags[tags.length - 1]}`
    : tags[0] || "the overall experience";

  const fallbackReview = `Had a wonderful experience at ${restaurantName}, especially with the ${highlights.toLowerCase()}. Everything was handled smoothly and I would definitely visit again!`;
  return res.status(200).json({ review: fallbackReview });
};
