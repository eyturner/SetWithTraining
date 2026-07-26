import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useContext } from "react";

import { SettingsContext } from "../context";

function SlowSetThresholdDialog(props) {
  const { open, onClose, title } = props;

  const { slowSetThreshold, setSlowSetThreshold } = useContext(SettingsContext);

  const handleChange = (event) => {
    const value = event.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setSlowSetThreshold(value);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          If finding a Set during a solo game takes longer than this many
          seconds, it gets added to your Practice Hard Boards queue so you
          can drill it later. The threshold is currently{" "}
          <b>
            <code>{slowSetThreshold}</code>
          </b>{" "}
          seconds.
        </DialogContentText>
        <TextField
          variant="standard"
          label="Threshold (seconds)"
          value={slowSetThreshold}
          onChange={handleChange}
          inputProps={{ inputMode: "decimal" }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SlowSetThresholdDialog;
