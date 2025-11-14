import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import * as faceapi from "face-api.js";
import {
  useDeleteImageMutation,
  useGetImagesQuery,
  useUploadImageMutation,
} from "../services/image";
import { useSubmitImagesMutation } from "../services/processImage";
import { IMAGES_STYLE } from "../style";
import ConfirmationModal from "../components/ConfirmationModal";

const StandardImageList = ({ images = [], handleDeleteImage = () => {} }) => {
  const { imageListContainer, imageBox, image, deleteIconStack, deleteIcon } =
    IMAGES_STYLE || {};

  return (
    <Box sx={imageListContainer(images?.length)}>
      {images?.map((item, index) => (
        <Box key={index} sx={imageBox}>
          <Box
            component="img"
            sx={image}
            src={item?.photo_url}
            alt={`${item?.photo_id}`}
            loading="lazy"
          />
          <Stack direction="row" spacing={1} sx={deleteIconStack}>
            <HighlightOffIcon
              onClick={() => handleDeleteImage(item?.photo_id)}
              sx={deleteIcon}
            />
          </Stack>
        </Box>
      ))}
    </Box>
  );
};

const Images = () => {
  const { container, innerStack, uploadButton, submitButton, scrollBox } =
    IMAGES_STYLE || {};
  const id = localStorage.getItem("accessToken");
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const [deleteImage] = useDeleteImageMutation();
  const [uploadImage, { isLoading: uploadLoading }] = useUploadImageMutation();
  const [submitImages, { isLoading: submitLoading }] =
    useSubmitImagesMutation();
  const [open, setOpen] = useState(false);

  const { data, isLoading, refetch } = useGetImagesQuery({ id });
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleClick = () => fileInputRef.current.click();

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      ]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.src = src;
    });

  // const handleFileChange = async (e) => {
  //   const files = Array.from(e.target.files);
  //   if (!files.length) return;

  //   if (!modelsLoaded) {
  //     toast.info("Please wait, face detection is loading...");
  //     return;
  //   }

  //   let uploadedCount = 0;

  //   for (let file of files) {
  //     const imageURL = URL.createObjectURL(file);
  //     const img = await loadImage(imageURL);

  //     try {
  //       const detections = await faceapi.detectAllFaces(
  //         img,
  //         new faceapi.TinyFaceDetectorOptions()
  //       );

  //       if (detections.length === 0) {
  //         toast.error(`${file.name}: No human face detected`);
  //         continue;
  //       }

  //       const formData = new FormData();
  //       formData.append("files", file);

  //       const res = await uploadImage({ id, formData }).unwrap();
  //       if (res?.success) {
  //         uploadedCount += 1;
  //       }
  //     } catch (err) {
  //       console.error(err);
  //       toast.error(`${file.name} upload failed!`);
  //     } finally {
  //       URL.revokeObjectURL(imageURL);
  //     }
  //   }

  //   if (uploadedCount > 0) {
  //     toast.success(`${uploadedCount} photo uploaded successfully!`);
  //     refetch();
  //   }
  // };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const existingCount = data?.data?.length || 0;
    const totalCount = existingCount + files.length;

    if (totalCount > 30) {
      toast.info(`You can only upload up to 30 photos.`);

      setTimeout(() => {
        toast.info(`You have already uploaded ${existingCount}.`);
      }, 1500);

      return;
    }

    if (!modelsLoaded) {
      toast.info("Please wait, face detection is loading...");
      return;
    }

    let uploadedCount = 0;

    for (let file of files) {
      const imageURL = URL.createObjectURL(file);
      const img = await loadImage(imageURL);

      try {
        const detections = await faceapi.detectAllFaces(
          img,
          new faceapi.TinyFaceDetectorOptions()
        );

        if (detections.length === 0) {
          toast.error(`${file.name}: No human face detected`);
          continue;
        }

        const formData = new FormData();
        formData.append("files", file);

        const res = await uploadImage({ id, formData }).unwrap();
        if (res?.success) {
          uploadedCount += 1;
        }
      } catch (err) {
        console.error(err);
        toast.error(`${file.name} upload failed!`);
      } finally {
        URL.revokeObjectURL(imageURL);
      }
    }

    if (uploadedCount > 0) {
      toast.success(`${uploadedCount} photo uploaded successfully!`);
      refetch();
    }
  };

  const handleDeleteImage = async (photo_id) => {
    try {
      const res = await deleteImage({ id: photo_id }).unwrap();
      if (res?.success) {
        toast.success("Image deleted successfully!");
        refetch();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete image!");
    }
  };

  const handleSubmit = async () => {
    try {
      const photo_ids = data?.data?.map((img) => img?.photo_id);
      if (!photo_ids?.length) {
        toast.info("No images to submit");
        return;
      }

      const res = await submitImages({ id, body: { photo_ids } }).unwrap();
      if (res) {
        toast.success("Thank you! Your photos are submitted.");
        setOpen(false);
        // refetch();
        setTimeout(() => {
          toast.info("We’ll email you when your holograms are ready");
          setTimeout(() => {
            localStorage.removeItem("accessToken");
            navigate("/");
          }, 3000);
        }, 5000);
      }
    } catch (err) {
      console.error(err);
      toast.error("Image submission failed!");
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Stack sx={container}>
      <Stack sx={innerStack}>
        <Stack spacing={1.5} alignItems="center">
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Typography variant="h4" fontWeight={600}>
              {`Add your photos: ${data?.data?.length || 0}/30 uploaded`}
            </Typography>
            <Typography variant="body2">
              Only upload clear, focused face photos.
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="center" spacing={1.5}>
            <Button
              variant="contained"
              color="accent"
              onClick={handleClick}
              loading={uploadLoading}
              disabled={data?.data?.length >= 30 || uploadLoading}
              sx={uploadButton}
            >
              Upload Photos
            </Button>

            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            <Button
              variant="contained"
              onClick={handleOpen}
              disabled={uploadLoading || data?.data?.length === 0}
              loading={submitLoading}
              sx={submitButton}
            >
              Submit Photos
            </Button>
          </Stack>
        </Stack>

        <ConfirmationModal
          open={open}
          onClose={handleClose}
          onConfirm={handleSubmit}
          cancelLoading={submitLoading}
          content={"click cancel to upload more images or confirm to submit."}
        />

        <Box sx={scrollBox}>
          {data?.data?.length > 0 ? (
            <StandardImageList
              images={data?.data}
              handleDeleteImage={handleDeleteImage}
            />
          ) : isLoading ? (
            <CircularProgress size={30} />
          ) : null}
        </Box>
      </Stack>
    </Stack>
  );
};

export default Images;
