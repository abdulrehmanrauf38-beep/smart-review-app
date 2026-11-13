module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { restaurantName, rating, tags } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY missing in Vercel" });
  }

  const prompt = `Write a natural, authentic, human-sounding 2-sentence Google review for a restaurant named "${restaurantName}". The customer gave ${rating} out of 5 stars and highlighted: ${tags.join(", ")}. Do not use hashtags, emojis, or robotic marketing words.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "Gemini API error" });
    }

    const reviewText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return res.status(200).json({ review: reviewText });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
