export const calculateShopRating = (shop) => {
  if (!shop?.products?.length) {
    return {
      averageRating: null,
      totalReviews: 0,
    };
  }

  const reviews = shop.products.flatMap((p) => p.reviews || []);

  if (reviews.length === 0) {
    return {
      averageRating: null,
      totalReviews: 0,
    };
  }

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);

  return {
    averageRating: Number((total / reviews.length).toFixed(1)),
    totalReviews: reviews.length,
  };
};
