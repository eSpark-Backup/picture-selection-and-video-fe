import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Grid,
  Slider,
  Button,
  Stack,
  LinearProgress,
  Typography,
} from "@mui/material";
import Cropper from "react-easy-crop";
import * as faceapi from "face-api.js";
import Toolbar from "../components/Toolbar";
import Guide from "../components/Guide";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import {
  useEditImageMutation,
  useGetImageByIdQuery,
  useUpdatePhotoStatusMutation,
} from "../services/reviewer";
import { createImage, getCroppedImg } from "../services/_utils";
import { EDIT_IMAGE_STYLE } from "../style";

const EditImage = () => {
  const {
    mainBox,
    gridContainer,
    toolbarGrid,
    imageGrid,
    cropBox,
    croppedImage,
    slider,
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
  const { data, isLoading, refetch } = useGetImageByIdQuery({
    id: imageId,
  });

  const [croppedBlob, setCroppedBlob] = useState(null);
  const imageData = data?.data || {};

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
    const img = await createImage(URL.createObjectURL(blob));
    const detections = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions()
    );
    return detections.length > 0;
  }, []);

  const handleCrop = useCallback(async () => {
    try {
      if (!imageData?.photo_url) return;

      const { blob, url } = await getCroppedImg(
        imageData?.photo_url,
        croppedAreaPixels
      );

      const hasFace = await detectFacesInBlob(blob);
      if (!hasFace) {
        toast.info("No face detected in cropped image.");
        return;
      }

      setCroppedBlob(blob);
      setCroppedImageUrl(url);
      setCropping(false);
      toast.success("Image adjusted successfully!");
    } catch (err) {
      console.error("Crop error:", err);
      toast.error("Something went wrong while adjusting");
    }
  }, [imageData?.photo_url, croppedAreaPixels, detectFacesInBlob]);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const formData = new FormData();

      if (croppedBlob) {
        const fileType = croppedBlob.type || "image/jpeg";
        const extension = fileType.split("/")[1] || "jpg";
        const fileName = `cropped_${Date.now()}.${extension}`;
        const file = new File([croppedBlob], fileName, { type: fileType });

        formData.append("file", file);
      } else {
        console.warn("No adjust blob found, uploading original image");
        const response = await fetch(imageData?.photo_url);
        const blobFromUrl = await response.blob();

        const fileType = blobFromUrl.type || "image/jpeg";
        const extension = fileType.split("/")[1] || "jpg";
        const fileName = `image_${Date.now()}.${extension}`;
        const fileFromUrl = new File([blobFromUrl], fileName, {
          type: fileType,
        });

        formData.append("file", fileFromUrl);
      }

      const res = await editImage({ id: imageId, formData }).unwrap();

      if (res?.success) {
        toast.success("adjusted image uploaded successfully!");
        setCropping(false);
        navigate(`/user/${id}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Something went wrong during upload");
    }
  }, [editImage, id, imageData, croppedBlob, navigate]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePhotoStatus({
        id,
        data: { status: newStatus.toLowerCase() },
      }).unwrap();

      toast.success("Status updated successfully!");

      refetch();
    } catch (err) {
      console.error("❌ Failed to update:", err);
      toast.error("Status update failed! Please try again.");
    }
  };

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={mainBox}>
      <Grid container sx={gridContainer}>
        <Grid size={12} sx={toolbarGrid}>
          <Toolbar
            onCrop={handleCrop}
            onSave={handleSave}
            onSaveLoading={upLoading || isLoading || isUpdating}
          />
        </Grid>
        <Guide />

        <Grid size={12} sx={imageGrid}>
          {cropping ? (
            <Box sx={cropBox}>
              <Cropper
                image={imageData?.photo_url}
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
            <Box component="img" src={croppedImageUrl} sx={croppedImage} />
          ) : imageData?.photo_url ? (
            <Box component="img" src={imageData?.photo_url} sx={croppedImage} />
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
                Status: {imageData?.status || "pending"}
              </Typography>
              <Stack direction={"row"} spacing={1.5}>
                <Button
                  variant="contained"
                  disabled={isUpdating || upLoading}
                  onClick={() =>
                    handleStatusChange(imageData?.photo_id, "approved")
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
                    handleStatusChange(imageData?.photo_id, "rejected")
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
              disabled={upLoading || isLoading || isUpdating}
              sx={button}
            >
              {"Go to back"}
            </Button>
          </Stack>{" "}
        </Grid>
      </Grid>
    </Box>
  );
};

export default EditImage;
