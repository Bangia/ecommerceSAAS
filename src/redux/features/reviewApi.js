import { apiSlice } from "../api/apiSlice";

export const reviewApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    addReview: builder.mutation({
      query: (data) => ({
        url: "/api/review/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => ["Products",{ type: "Product", id: arg.productId }],
    }),
    getAllReviews: builder.query({
      query: () => "/api/review/all",
      providesTags: ["Reviews"],
    }),
    updateReview: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/api/review/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Reviews", "Products"],
    }),
    deleteReview: builder.mutation({
      query: (id) => ({ url: `/api/review/${id}`, method: "DELETE" }),
      invalidatesTags: ["Reviews", "Products"],
    }),
  }),
});

export const {
  useAddReviewMutation,
  useGetAllReviewsQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = reviewApi;
