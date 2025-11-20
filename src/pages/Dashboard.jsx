import { Box, LinearProgress, Typography } from "@mui/material";
import DynamicTable from "../components/DynamicTable";
import {
  useCreateVideoMutation,
  useGetDashboardQuery,
} from "../services/reviewer";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useState } from "react";

dayjs.extend(utc);
dayjs.extend(timezone);

function formatToLocal(isoTimestamp) {
  const cleanISO = isoTimestamp.split(".")[0] + "Z";
  return dayjs.utc(cleanISO).tz(dayjs.tz.guess()).format("DD-MM-YYYY hh:mm A");
}

const DashboardPage = () => {
  const [page, setPage] = useState(0); // DataGrid page starts 0
  const [limit, setLimit] = useState(10); // pageSize
  const [createVideo, { isLoading: videoLoading }] = useCreateVideoMutation();
  const navigate = useNavigate();
  const { data, isLoading: isUsersLoading } = useGetDashboardQuery({
    page: page + 1,
    limit,
  });

  const users = data?.data || [];
  const total = data?.total_users || 0;

  const tableData = users.map((user) => {
    const photos = user?.photos || [];

    return {
      id: user.user_id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone: user.phone,
      created_at: user.created_at ? formatToLocal(user.created_at) : "",
      status:
        photos.length > 0
          ? photos.every((photo) => photo.status !== "pending")
          : false,
      // photo_id: photos[0]?.photo_id || null,
    };
  });

  const tableColumns = [
    { id: "created_at", label: "Created" },
    { id: "name", label: "Name" },
    { id: "email", label: "Email" },
    { id: "phone", label: "Phone Number" },
  ];

  const handleCreateVideo = async (data) => {
    const userImages = users?.find((item) => item?.user_id === Number(data.id));

    try {
      const photo_ids = userImages?.photos?.map((img) => img?.photo_id);

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
          onClick={handleClickAction}
          page={page}
          limit={limit}
          total={total}
          setPage={setPage}
          setLimit={setLimit}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </Box>
    </Box>
  );
};

export default DashboardPage;
