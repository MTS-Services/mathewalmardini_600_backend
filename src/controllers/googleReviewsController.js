// B-spoke designs and construction, 80 Settlers Way, Sunbury
const DEFAULT_PLACE_ID = "ChIJ9cotiWNR1moRBtC5MQDqh9s";
// Place Details with reviews is a paid Google request, so the result is shared for 12 hours
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

let cache = { data: null, fetchedAt: 0 };

const fetchFromGoogle = async () => {
  const placeId = process.env.GOOGLE_PLACE_ID || DEFAULT_PLACE_ID;
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?languageCode=en`,
    {
      headers: {
        "X-Goog-Api-Key": process.env.GOOGLE_API_KEY,
        "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews",
      },
    },
  );
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error?.message || `Google returned ${response.status}`);
  }

  return {
    rating: body.rating,
    totalReviews: body.userRatingCount,
    reviewsUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    writeReviewUrl: `https://search.google.com/local/writereview?placeid=${placeId}`,
    // Google's API returns at most 5 reviews; the full list lives on Google
    reviews: (body.reviews || [])
      .filter((review) => review.text?.text)
      .map((review) => ({
        name: review.authorAttribution?.displayName,
        photo: review.authorAttribution?.photoUri,
        profileUrl: review.authorAttribution?.uri,
        rating: review.rating,
        text: review.text.text,
        relativeTime: review.relativePublishTimeDescription,
      })),
  };
};

class GoogleReviewsController {
  async getReviews(req, res) {
    const isFresh = cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS;

    if (!isFresh) {
      try {
        cache = { data: await fetchFromGoogle(), fetchedAt: Date.now() };
      } catch (error) {
        console.error("Google reviews fetch failed:", error.message);
        // Keep serving the last good copy if Google is unavailable
        if (!cache.data) {
          return res.status(502).json({
            success: false,
            message: "Could not load Google reviews",
          });
        }
      }
    }

    res.set("Cache-Control", "public, max-age=3600");
    res.json({ success: true, data: cache.data });
  }
}

module.exports = new GoogleReviewsController();
