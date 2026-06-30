export type ReviewSummary = {
  totalReviews: number;
  averageRating: number;
  verifiedPurchaseReviews: number;
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ProductReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  verifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

export type AdminReviewItem = ProductReviewItem & {
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
  };
};
