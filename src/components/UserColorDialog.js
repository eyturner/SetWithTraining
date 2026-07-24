import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import makeStyles from "@mui/styles/makeStyles";
import clsx from "clsx";
import { useContext } from "react";

import { UserContext } from "../context";
import { colors } from "../util";

const useStyles = makeStyles({
  colorBox: {
    display: "block",
    height: 24,
    width: "100%",
    cursor: "pointer",
    outline: "none",
    border: "none",
    transition: "margin 0.1s",
    "&:hover": {
      margin: "2px 0",
    },
  },
  active: {
    margin: "2px 0",
  },
});

function UserColorDialog({ open, onClose, title }) {
  const user = useContext(UserContext);
  const classes = useStyles();

  function handleChange(color) {
    user.setColor(color);
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {Object.keys(colors).map((color) => (
          <button
            key={color}
            className={clsx({
              [classes.colorBox]: true,
              [classes.active]: color === user.color,
            })}
            style={{ background: colors[color][400] }}
            onClick={() => handleChange(color)}
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UserColorDialog;
