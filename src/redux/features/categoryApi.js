import { apiSlice } from "../api/apiSlice";

export const categoryApi = apiSlice.injectEndpoints({
  overrideExisting:true,
  endpoints: (builder) => ({
    addCategory: builder.mutation({
      query: (data) => ({
        url: "/api/category/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Categories"],
    }),
    getShowCategory: builder.query({
      query: () => `/api/category/show`,
      providesTags: ["Categories"],
    }),
    getProductTypeCategory: builder.query({
      query: (type) => `/api/category/show/${type}`
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/api/category/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({ url: `/api/category/${id}`, method: "DELETE" }),
      invalidatesTags: ["Categories"],
    }),
  }),
});

export const {
 useAddCategoryMutation,
 useGetProductTypeCategoryQuery,
 useGetShowCategoryQuery,
 useUpdateCategoryMutation,
 useDeleteCategoryMutation,
} = categoryApi;
