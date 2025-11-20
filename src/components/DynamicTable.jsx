import { DataGrid } from "@mui/x-data-grid";
import { Box, IconButton, MenuItem, Select } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SlowMotionVideoIcon from "@mui/icons-material/SlowMotionVideo";
import { DYNAMIC_TABLE_STYLE } from "../style";

const STATUS_OPTIONS = ["pending", "approved", "rejected"];

const DynamicDataGrid = ({
  rows = [],
  columns = [],
  onStatusChange = () => {},
  onClick = () => {},

  page = 0,
  limit = 0,
  total = 0,
  onPageChange = () => {},
}) => {
  const { gridBox, grid } = DYNAMIC_TABLE_STYLE || {};
  const enhancedColumns = [
    ...columns.map((col) => ({
      field: col.id,
      headerName: col.label,
      flex: 1,
      minWidth: 150,
      sortable: false,
      filterable: false,
      renderCell:
        col.id === "status"
          ? (params) => (
              <Select
                size="small"
                value={params.value}
                onChange={(e) =>
                  onStatusChange(params.row.photo_id, e.target.value)
                }
                sx={{ width: "100%", fontSize: 14 }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            )
          : undefined,
    })),
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      minWidth: 160,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => onClick("view", params.row)}
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            color="warning"
            disabled={!params?.row?.status}
            onClick={() => onClick("edit", params.row)}
          >
            <SlowMotionVideoIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={gridBox}>
      <DataGrid
        rows={rows}
        columns={enhancedColumns}
        disableColumnFilter
        disableColumnMenu
        disableSelectionOnClick
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
        }}
        page={page}
        pageSize={limit}
        rowCount={total}
        paginationMode="server"
        onPaginationModelChange={(model) => {
          onPageChange(model.page);
        }}
        pageSizeOptions={[10, 20, 30]}
        getRowId={(row) => row.id}
        hideFooterSelectedRowCount
        sx={grid}
      />
    </Box>
  );
};

export default DynamicDataGrid;
