import { Box, Grid, LinearProgress, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { useDeleteImageForReviewerMutation } from "../services/reviewer";
import { toast } from "react-toastify";
import { DETAILED_STYLE } from "../style";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from "../store/slices/selectedUserSlice";
import { setSelectedImage } from "../store/slices/selectedImageSlice";

const StandardImageList = ({
  userId = "",
  navigate,
  images = [],
  user = {},
  handleDeleteImage = () => {},
}) => {
  const { container, imageBox, image, iconStack, deleteIcon } =
    DETAILED_STYLE || {};

  const dispatch = useDispatch();

  return (
    <Grid container spacing={2} maxWidth={1920} sx={container}>
      {images?.map((item, index) => (
        <Grid item key={index} xs={3} xl={2.4}>
          <Box sx={imageBox}>
            <Box
              component="img"
              src={item?.photo_url}
              alt={`${item?.photo_id}`}
              loading="lazy"
              onClick={() => {
                dispatch(
                  setSelectedImage({
                    photo_id: item?.photo_id,
                    photo_url: item?.photo_url,
                    status: item?.status,
                  })
                );
                navigate(`/user/${userId}/${item?.photo_id}`);
              }}
              sx={image}
            />
            <Stack
              direction={"row"}
              justifyContent={"space-between"}
              sx={iconStack}
            >
              <Box
                sx={{
                  py: 0.5,
                  px: 1.5,
                  borderRadius: "999px",
                  backgroundColor: "#fff",
                  color: "black",
                }}
              >
                <Typography
                  fontSize={{ xs: "10px", sm: "10.5px", md: "12px" }}
                  textTransform={"capitalize"}
                >
                  {item?.status}
                </Typography>
              </Box>
              <HighlightOffIcon
                onClick={() => handleDeleteImage(item?.photo_id)}
                sx={deleteIcon}
              />
            </Stack>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

const Detailed = () => {
  const [deleteImage, { isLoading: deleteLoading }] =
    useDeleteImageForReviewerMutation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.selectedUser) || {};

  const handleDeleteImage = async (id) => {
    try {
      const res = await deleteImage({ id }).unwrap();
      if (res?.success) {
        toast.success("Image deleted successfully!");
        if (user) {
          const updatedUser = {
            ...user,
            photos: user?.photos?.filter((img) => img?.photo_id !== id),
          };
          dispatch(setSelectedUser(updatedUser));
        }
      }
    } catch (err) {
      toast.error("Image delete failed!");
      console.error(err);
    }
  };

  if (deleteLoading) {
    return <LinearProgress />;
  }

  return (
    <Stack spacing={2}>
      <Stack>
        <Typography variant="h5" fontWeight={600} mb={3}>
          Images
        </Typography>
      </Stack>
      {user?.photos?.length ? (
        <StandardImageList
          user={user}
          userId={id}
          navigate={navigate}
          images={user?.photos}
          handleDeleteImage={handleDeleteImage}
        />
      ) : (
        <Typography variant="body2">Images not found!</Typography>
      )}
    </Stack>
  );
};

export default Detailed;
