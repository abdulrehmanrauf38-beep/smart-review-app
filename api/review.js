module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { restaurantName, rating, tags } = req.body || {};
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();

  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY missing in Vercel" });
  }

  const prompt = `Write a natural, human-sounding 2-sentence Google review for a restaurant named "${restaurantName}". The customer gave ${rating} out of 5 stars and highlighted: ${tags.join(", ")}. No hashtags or emojis.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
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
      return res.status(500).json({ error: data.error?.message || JSON.stringify(data) });
    }

    const reviewText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reviewText) {
      return res.status(500).json({ error: "Empty response from Gemini" });
    }

    return res.status(200).json({ review: reviewText });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
