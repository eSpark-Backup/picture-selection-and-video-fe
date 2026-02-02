import { IMAGES, SINGLE_IMAGE, SUBMIT_IMAGES, UPLOAD_IMAGE } from "../api/apiEndPoints";
import { apiSlice } from "../api/apiSlice";

export const imageApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getImages: builder.query({
      query: ({ id }) => ({
        url: `${IMAGES}${id}`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }),
      providesTags: ["Images"],
    }),

    getSingleImage: builder.query({
      query: ({ id }) => ({
        url: `${SINGLE_IMAGE}${id}`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }),
      providesTags: ["SingleImage"],
    }),

    uploadImage: builder.mutation({
      query: ({ id, formData }) => ({
        url: `${SUBMIT_IMAGES}${id}`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Images"],
    }),

    adjustImage: builder.mutation({
      query: ({ id, formData }) => ({
        url: `${SINGLE_IMAGE}${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Images"],
    }),

    deleteImage: builder.mutation({
      query: ({ id }) => ({
        url: `${SINGLE_IMAGE}${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Images"],
    }),
  }),
});

export const {
  useGetImagesQuery,
  useGetSingleImageQuery,
  useUploadImageMutation,
  useAdjustImageMutation,
  useDeleteImageMutation,
} = imageApiSlice;
