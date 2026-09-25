import { apiSlice } from "../api/apiSlice";

export const typeApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAllTypes: builder.query({ query: () => "/api/type/all", providesTags: ["ProductTypes"] }),
    addType: builder.mutation({ query: (data) => ({ url: "/api/type/add", method: "POST", body: data }), invalidatesTags: ["ProductTypes"] }),
    updateType: builder.mutation({ query: ({ id, ...data }) => ({ url: `/api/type/${id}`, method: "PUT", body: data }), invalidatesTags: ["ProductTypes"] }),
    deleteType: builder.mutation({ query: (id) => ({ url: `/api/type/${id}`, method: "DELETE" }), invalidatesTags: ["ProductTypes"] }),
  }),
});

export const { useGetAllTypesQuery, useAddTypeMutation, useUpdateTypeMutation, useDeleteTypeMutation } = typeApi;