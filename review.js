export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { restaurantName, rating, tags } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  const prompt = `Write a natural, authentic, human-sounding 2-sentence Google review for a restaurant named "${restaurantName}". 
  The customer gave ${rating} out of 5 stars and highlighted: ${tags.join(", ")}. 
  Do not use hashtags, emojis, or overly robotic marketing words. Keep it casual and realistic.`;

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
    const reviewText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!reviewText) {
      return res.status(500).json({ error: "Failed to generate text" });
    }

    return res.status(200).json({ review: reviewText });
  } catch (error) {
    return res.status(500).json({ error: "Gemini API request failed" });
  }
}
