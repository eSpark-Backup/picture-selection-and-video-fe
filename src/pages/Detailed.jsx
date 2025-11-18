import { Box, Grid, LinearProgress, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import {
  useDeleteImageForReviewerMutation,
  useGetDashboardQuery,
} from "../services/reviewer";
import { toast } from "react-toastify";
import { DETAILED_STYLE } from "../style";

const StandardImageList = ({
  userId = "",
  navigate,
  images = [],
  handleDeleteImage = () => {},
}) => {
  const { container, imageBox, image, iconStack, deleteIcon } =
    DETAILED_STYLE || {};
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
              onClick={() => navigate(`/user/${userId}/${item?.photo_id}`)}
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

  const { data, refetch, isLoading } = useGetDashboardQuery();

  const users = data?.data || [];

  const userImages =
    users?.find((item) => item?.user_id === Number(id))?.photos || [];

  const handleDeleteImage = async (id) => {
    try {
      const res = await deleteImage({ id }).unwrap();
      if (res?.success) {
        toast.success("Image deleted successfully!");
        refetch();
      }
    } catch (err) {
      toast.error("Image delete failed!");
      console.error(err);
    }
  };

  if (isLoading || deleteLoading) {
    return <LinearProgress />;
  }

  return (
    <Stack spacing={2}>
      <Stack>
        <Typography variant="h5" fontWeight={600} mb={3}>
          Images
        </Typography>
      </Stack>
      {userImages?.length > 0 ? (
        <StandardImageList
          userId={id}
          navigate={navigate}
          images={userImages}
          handleDeleteImage={handleDeleteImage}
        />
      ) : (
        <Typography variant="body2">Images not found!</Typography>
      )}
    </Stack>
  );
};

export default Detailed;
