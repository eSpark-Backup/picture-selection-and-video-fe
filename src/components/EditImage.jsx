import { useEffect, useState, useCallback } from "react";
import { Box, Grid, Slider, Button, Stack, Typography } from "@mui/material";
import Cropper from "react-easy-crop";
import * as faceapi from "face-api.js";
import Toolbar from "../components/Toolbar";
import Guide from "../components/Guide";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import {
  useEditImageMutation,
  useGetImageUrlByIdQuery,
  useUpdatePhotoStatusMutation,
} from "../services/reviewer";
import { createImage, getCroppedImg } from "../services/_utils";
import { EDIT_IMAGE_STYLE } from "../style";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from "../store/slices/selectedUserSlice";
import { setSelectedImage } from "../store/slices/selectedImageSlice";

const EditImage = () => {
  const {
    mainBox,
    gridContainer,
    toolbarGrid,
    imageGrid,
    cropBox,
    croppedImage,
    button,
  } = EDIT_IMAGE_STYLE || {};
  const [cropping, setCropping] = useState(true);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const navigate = useNavigate();
  const { id, imageId } = useParams({});
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [editImage, { isLoading: upLoading }] = useEditImageMutation();
  const [updatePhotoStatus, { isLoading: isUpdating }] =
    useUpdatePhotoStatusMutation();
  const { image } = useSelector((state) => state?.selectedImage) || {};
  const { user } = useSelector((state) => state?.selectedUser) || {};
  const { data } = useGetImageUrlByIdQuery({ id: imageId });
  const [croppedBlob, setCroppedBlob] = useState(null);
  const dispatch = useDispatch();

  const canSave = crop.x === 0 && crop.y === 0 && zoom === 1;

  useEffect(() => {
    (async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
      } catch (err) {
        console.error("Failed to load face-api models", err);
        toast.error("Failed to load face detection models");
      }
    })();
  }, []);

  const detectFacesInBlob = useCallback(async (blob) => {
    try {
      const img = await createImage(URL.createObjectURL(blob));

      const detections = await faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.3,
        })
      );

      return detections.length > 0;
    } catch (err) {
      console.error("Face detect error", err);
      return false;
    }
  }, []);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updatePhotoStatus({
        id,
        data: { status: newStatus.toLowerCase() },
      }).unwrap();

      toast.success("Status updated successfully!");

      const updatedStatus = res?.data?.status;

      if (user) {
        const updatedUser = {
          ...user,
          photos: user?.photos?.map((img) =>
            img?.photo_id === res?.data?.photo_id
              ? { ...img, status: updatedStatus }
              : img
          ),
        };

        dispatch(setSelectedUser(updatedUser));
      }
      if (image) {
        const updateImage = {
          ...image,
          status: updatedStatus,
        };

        dispatch(setSelectedImage(updateImage));
      }
    } catch (err) {
      console.error("❌ Failed to update:", err);
      toast.error("Status update failed! Please try again.");
    }
  };

  const handleCrop = useCallback(async () => {
    const dataURL = data?.data;
    try {
      if (!image?.photo_url) return null;

      if (!croppedAreaPixels || croppedAreaPixels.width < 1) {
        toast.error("Please adjust the crop once before saving.");
        return;
      }

      const { blob, url } = await getCroppedImg(dataURL, croppedAreaPixels);

      const hasFace = await detectFacesInBlob(blob);
      if (!hasFace) {
        toast.info("No face detected in cropped image.");
        return null;
      }

      setCroppedBlob(blob);
      setCroppedImageUrl(url);

      toast.success("Image adjusted successfully!");

      return blob;
    } catch (err) {
      console.error("Crop error:", err);
      toast.error("Something went wrong while adjusting");
      return null;
    }
  }, [image?.photo_url, croppedAreaPixels, detectFacesInBlob]);

  const handleSave = useCallback(
    async (blobToUpload) => {
      try {
        const formData = new FormData();

        if (blobToUpload) {
          const fileType = blobToUpload.type || "image/jpeg";
          const extension = fileType.split("/")[1] || "jpg";
          const fileName = `cropped_${Date.now()}.${extension}`;

          const file = new File([blobToUpload], fileName, { type: fileType });
          formData.append("file", file);
        } else {
          console.warn("No cropped blob found, uploading original image");

          const response = await fetch(image?.photo_url);
          const blobFromUrl = await response.blob();

          const fileType = blobFromUrl.type || "image/jpeg";
          const extension = fileType.split("/")[1] || "jpg";
          const fileName = `image_${Date.now()}.${extension}`;

          const file = new File([blobFromUrl], fileName, { type: fileType });
          formData.append("file", file);
        }

        const res = await editImage({ id: imageId, formData }).unwrap();

        if (res?.success) {
          toast.success("adjusted image uploaded successfully!");

          const { photo_id, photo_url } = res?.data || {};

          if (user) {
            const updatedUser = {
              ...user,
              photos: user?.photos?.map((img) =>
                img?.photo_id === photo_id
                  ? { ...img, photo_id: photo_id, photo_url: photo_url }
                  : img
              ),
            };
            dispatch(setSelectedUser(updatedUser));
          }
          navigate(`/user/${id}`);
        }
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Something went wrong during upload");
      }
    },
    [editImage, id, image, navigate]
  );

  const handleCropThenSave = async () => {
    const blob = await handleCrop();

    if (blob) {
      await handleSave(blob);
    }
  };

  return (
    <Box sx={mainBox}>
      <Grid container sx={gridContainer}>
        <Grid size={12} sx={toolbarGrid}>
          <Toolbar
            onSaveDisabled={canSave}
            onSave={handleCropThenSave}
            onSaveLoading={upLoading || isUpdating}
          />
        </Grid>
        <Guide />

        <Grid size={12} sx={imageGrid}>
          {cropping ? (
            <Box sx={cropBox}>
              <Cropper
                key={image?.photo_url}
                image={image?.photo_url}
                crossOrigin="anonymous"
                crop={crop}
                zoom={zoom}
                aspect={1}
                objectFit="contain"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  cropAreaStyle: {
                    border: "4px solid red",
                    borderRadius: "50%",
                  },
                }}
              />
            </Box>
          ) : croppedImageUrl ? (
            <Box
              component="img"
              src={croppedImageUrl}
              sx={croppedImage}
              crossOrigin="anonymous"
            />
          ) : image?.photo_url ? (
            <Box
              component="img"
              src={image?.photo_url}
              sx={croppedImage}
              crossOrigin="anonymous"
            />
          ) : null}
        </Grid>
        <Grid sx={12}>
          {cropping && (
            <Stack spacing={2} alignItems="center" my={3}>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                disabled={isUpdating || upLoading}
                onChange={(e, z) => setZoom(z)}
              />
              <Typography variant="body1">
                Status: {image?.status || "pending"}
              </Typography>
              <Stack direction={"row"} spacing={1.5}>
                <Button
                  variant="contained"
                  disabled={isUpdating || upLoading}
                  onClick={() =>
                    handleStatusChange(image?.photo_id, "approved")
                  }
                  sx={button}
                >
                  Approved
                </Button>
                <Button
                  variant="contained"
                  disabled={isUpdating || upLoading}
                  color="accent"
                  onClick={() =>
                    handleStatusChange(image?.photo_id, "rejected")
                  }
                  sx={button}
                >
                  Rejected
                </Button>
              </Stack>
            </Stack>
          )}
          <Stack spacing={2} alignItems="center">
            <Button
              variant="contained"
              onClick={() => navigate(`/user/${id}`)}
              disabled={upLoading || isUpdating}
              sx={button}
            >
              {"Go to back"}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EditImage;
