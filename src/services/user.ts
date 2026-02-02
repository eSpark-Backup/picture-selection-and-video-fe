import { SUBMIT_FORM } from "../api/apiEndPoints";
import { apiSlice } from "../api/apiSlice";

export const imageApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addUser: builder.mutation({
      query: (formData) => ({
        url: SUBMIT_FORM,
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const { useAddUserMutation } = imageApiSlice;
