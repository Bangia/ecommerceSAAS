import { apiSlice } from "../api/apiSlice";

export const testimonialApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAllTestimonials: builder.query({ query: (type) => `/api/testimonial/all${type ? `?type=${type}` : ""}`, providesTags: ["Testimonials"] }),
    addTestimonial: builder.mutation({ query: (data) => ({ url: "/api/testimonial/add", method: "POST", body: data }), invalidatesTags: ["Testimonials"] }),
    updateTestimonial: builder.mutation({ query: ({ id, ...data }) => ({ url: `/api/testimonial/${id}`, method: "PUT", body: data }), invalidatesTags: ["Testimonials"] }),
    deleteTestimonial: builder.mutation({ query: (id) => ({ url: `/api/testimonial/${id}`, method: "DELETE" }), invalidatesTags: ["Testimonials"] }),
  }),
});

export const { useGetAllTestimonialsQuery, useAddTestimonialMutation, useUpdateTestimonialMutation, useDeleteTestimonialMutation } = testimonialApi;