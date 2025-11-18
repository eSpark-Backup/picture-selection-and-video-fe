import { Box, Stack, Typography } from "@mui/material";
import UserForm from "../components/UserForm";
import video from "../assets/remove.mp4";
import { HOME_STYLE } from "../style";

const Home = () => {
  const { mainStack, innerStack, videoBox } = HOME_STYLE || {};
  return (
    <Stack sx={mainStack}>
      <Typography
        sx={{
          fontSize: { xs: "15px", sm: "16px" },
          textAlign: { xs: "center", sm: "start" },
          width: "fit-content",
          fontWeight: 700,
          color: "#000",
          mb: { xs: 4, md: 2.5 },
          mx: 2.5,
        }}
      >
        {"Add your information to begin the hologram process!"}
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} sx={innerStack}>
        <UserForm />
        <Box
          component="video"
          src={video}
          autoPlay
          loop
          muted
          controls={false}
          sx={videoBox}
        />
      </Stack>
    </Stack>
  );
};

export default Home;
