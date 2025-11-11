import { Box, LinearProgress, Typography } from "@mui/material";
import DynamicTable from "../components/DynamicTable";
import {
  useCreateVideoMutation,
  useGetDashboardQuery,
  useUpdatePhotoStatusMutation,
} from "../services/reviewer";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const DashboardPage = () => {
  const [updatePhotoStatus, { isLoading: isUpdating }] =
    useUpdatePhotoStatusMutation();
  const [createVideo, { isLoading: videoLoading }] = useCreateVideoMutation();
  const navigate = useNavigate();
  const { data, isLoading: isUsersLoading } = useGetDashboardQuery();
  const users = data?.data || [];

  // const tableData = users?.map(({ photo_id, status, user }) => ({
  //   id: user?.user_id,
  //   name: user?.first_name,
  //   email: user?.email,
  //   phone: user?.phone,
  //   status: status,
  //   photo_id: photo_id,
  // }));

  // console.log(tableData, "tableData");

  const groupedData = Object?.values(
    users?.reduce((acc, { photo_id, status, user }) => {
      if (!acc[user?.user_id]) {
        acc[user?.user_id] = {
          id: user?.user_id,
          name: user?.first_name,
          email: user?.email,
          phone: user?.phone,
          photos: [],
        };
      }
      acc[user?.user_id]?.photos?.push({ photo_id, status });
      return acc;
    }, {})
  );

  const tableData = groupedData.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.photos[0]?.status || "N/A",
    photo_id: user.photos[0]?.photo_id,
  }));

  console.log(tableData, "groupedData");
  const tableColumns = [
    { id: "name", label: "Name" },
    { id: "email", label: "Email" },
    { id: "phone", label: "Phone Number" },
    { id: "status", label: "Status" },
  ];

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePhotoStatus({
        id,
        data: { status: newStatus.toLowerCase() },
      }).unwrap();

      console.log(`✅ Status of user ${id} updated to ${newStatus}`);
    } catch (err) {
      console.error("❌ Failed to update:", err);
      toast.error("Status update failed! Please try again.");
    }
  };

  const handleCreateVideo = async (data) => {
    const userImages = users?.filter(
      (item) => item?.user?.user_id === Number(data.id)
    );
    try {
      const photo_ids = userImages?.map((img) => img?.photo_id);

      if (!photo_ids.length) {
        toast.info("No images to submit");
        return;
      }

      const payload = { photo_ids };

      const res = await createVideo({ body: payload }).unwrap();

      if (res) {
        toast.success(`Video created successfully`);
        setTimeout(() => {
          toast.success(`Video send successfully`);
        }, 3000);
        console.log("Server Response:", res.data);
      }
    } catch (err) {
      console.error("Video failed:", err);
      toast.error("Video creation failed!");
    }
  };

  const handleClickAction = (text, data) => {
    if (text === "view") {
      navigate(`/user/${data?.id}`);
    } else if (text === "edit") {
      handleCreateVideo(data);
    }
  };

  if (isUsersLoading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Users
      </Typography>
      <Box my={3}>
        <DynamicTable
          rows={tableData}
          columns={tableColumns}
          onStatusChange={handleStatusChange}
          onClick={handleClickAction}
        />
      </Box>
    </Box>
  );
};

export default DashboardPage;
