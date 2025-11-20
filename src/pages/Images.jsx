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

import { useUploadImageMutation } from "../services/image";
import { useSubmitImagesMutation } from "../services/processImage";

import { IMAGES_STYLE } from "../style";
import ConfirmationModal from "../components/ConfirmationModal";

// ---------------------------------------------------------
// IMAGE → BASE64 + COMPRESS
// ---------------------------------------------------------
const fileToBase64 = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });

async function compressBase64(base64Str) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 900;
      let width = img.width;
      let height = img.height;

      if (width > MAX || height > MAX) {
        if (width > height) {
          height *= MAX / width;
          width = MAX;
        } else {
          width *= MAX / height;
          height = MAX;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
  });
}

const base64ToFile = async (base64, fileName) => {
  const res = await fetch(base64);
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type });
};

// ---------------------------------------------------------
// IMAGE LIST COMPONENT
// ---------------------------------------------------------
const StandardImageList = ({ images, handleDeleteImage }) => {
  const { imageListContainer, imageBox, image, deleteIconStack, deleteIcon } =
    IMAGES_STYLE || {};

  return (
    <Box sx={imageListContainer(images.length)}>
      {images.map((item, index) => (
        <Box key={index} sx={imageBox}>
          <img src={item.base64} style={image} alt="preview" />

          <Stack sx={deleteIconStack}>
            <HighlightOffIcon
              onClick={() => handleDeleteImage(index)}
              sx={deleteIcon}
            />
          </Stack>
        </Box>
      ))}
    </Box>
  );
};

// ---------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------
const Images = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const id = localStorage.getItem("accessToken");

  const { container, innerStack, uploadButton, submitButton, scrollBox } =
    IMAGES_STYLE || {};

  const [localImages, setLocalImages] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);

  const [uploadImage, { isLoading: uploadLoading }] = useUploadImageMutation();
  const [submitImages, { isLoading: submitLoading }] =
    useSubmitImagesMutation();

  // ---------------------------------------------------------
  // LOAD FACE API MODELS + LOAD LOCAL STORAGE IMAGES
  // ---------------------------------------------------------
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelsLoaded(true);
      } catch (err) {
        console.error("Face Model Load Error:", err);
      }
    };

    loadModels();

    const saved = JSON.parse(localStorage.getItem("localImages") || "[]");
    setLocalImages(saved);
  }, []);

  const saveLocal = (arr) => {
    localStorage.setItem("localImages", JSON.stringify(arr));
  };

  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.src = src;
    });

  const simpleFaceCheck = async (img) => {
    try {
      const detections = await faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.2,
        })
      );
      return detections.length > 0;
    } catch (err) {
      return false;
    }
  };

  // ---------------------------------------------------------
  // ADD NEW IMAGES
  // ---------------------------------------------------------
  const handleFileChange = async (e) => {
    if (!modelsLoaded) {
      toast.error("Face model not loaded");
      return;
    }

    setProcessingImages(true);

    let files = [...e.target.files];

    if (localImages.length + files.length > 30) {
      toast.error("Max 30 photos allowed");
      setProcessingImages(false);
      return;
    }

    const newImages = [];

    for (let file of files) {
      let base64 = await fileToBase64(file);
      base64 = await compressBase64(base64);

      const imgEl = await loadImage(base64);
      const hasFace = await simpleFaceCheck(imgEl);

      if (!hasFace) {
        toast.info(`${file.name}: No face detected`);
        continue;
      }

      newImages.push({
        name: file.name,
        base64,
        uploaded: false,
        photo_id: null,
      });
    }

    const updated = [...localImages, ...newImages];
    setLocalImages(updated);
    saveLocal(updated);

    setProcessingImages(false);
  };

  // ---------------------------------------------------------
  // DELETE LOCAL IMAGE
  // ---------------------------------------------------------
  const handleDeleteLocalImage = (index) => {
    const updated = localImages.filter((_, i) => i !== index);
    setLocalImages(updated);
    saveLocal(updated);
  };

  // ---------------------------------------------------------
  // SUBMIT PROCESS
  // ---------------------------------------------------------
  const handleSubmit = async () => {
    if (!localImages.length) {
      toast.error("Upload photos first");
      return;
    }

    for (let imgObj of localImages) {
      if (imgObj.uploaded) continue;

      const file = await base64ToFile(imgObj.base64, imgObj.name);
      const formData = new FormData();
      formData.append("files", file);

      const res = await uploadImage({ id, formData }).unwrap();

      const uploadedList = res?.data || [];
      const lastUploaded = uploadedList[uploadedList.length - 1];

      imgObj.uploaded = true;
      imgObj.photo_id = lastUploaded?.photo_id || null;
    }

    saveLocal(localImages);

    const photo_ids = localImages
      .filter((img) => img.photo_id)
      .map((img) => img.photo_id);

    if (!photo_ids.length) {
      toast.error("No valid photo_ids found");
      return;
    }

    try {
      await submitImages({ id, body: { photo_ids } }).unwrap();

      toast.success("Photos submitted successfully!");
      setLocalImages([]);
      localStorage.removeItem("localImages");
      setOpen(false);

      setTimeout(() => {
        toast.info("We’ll email you when your holograms are ready");

        setTimeout(() => {
          localStorage.removeItem("accessToken");
          navigate("/");
        }, 3000);
      }, 5000);
    } catch (err) {
      toast.error("Final submission failed!");
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () =>
    submitLoading || uploadLoading ? () => {} : setOpen(false);

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <Stack sx={container}>
      <Stack sx={innerStack}>
        <Stack spacing={1.5} alignItems="center">
          <Typography
            variant="h4"
            fontWeight={600}
            px={1.5}
            textAlign={{ xs: "center", sm: "start" }}
          >
            {`Add your photos: ${localImages?.length}/30 uploaded`}
          </Typography>

          <Typography variant="body2">
            Only upload clear, focused face photos.
          </Typography>

          <Stack
            direction="row"
            justifyContent="center"
            spacing={1.5}
            width={{ xs: "95%" }}
          >
            <Button
              variant="contained"
              color="accent"
              onClick={() => fileInputRef.current.click()}
              disabled={
                localImages.length >= 30 ||
                uploadLoading ||
                submitLoading ||
                processingImages
              }
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
              disabled={
                uploadLoading || submitLoading || localImages.length === 0
              }
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
          cancelLoading={submitLoading || uploadLoading}
          confirmLoading={submitLoading || uploadLoading}
          content={
            uploadLoading
              ? "Your images are being uploaded. Please wait..."
              : submitLoading
              ? "Your photos are being submitted. Please wait..."
              : "Click cancel to upload more images or confirm to submit."
          }
        />

        <Box sx={scrollBox}>
          {localImages.length > 0 ? (
            <StandardImageList
              images={localImages}
              handleDeleteImage={handleDeleteLocalImage}
            />
          ) : processingImages ? (
            <Stack spacing={1} alignItems={"center"}>
              <CircularProgress size={30} />
              <Typography variant="body2">
                Uploading your photos... Please wait
              </Typography>
            </Stack>
          ) : null}
        </Box>
      </Stack>
    </Stack>
  );
};

export default Images;
