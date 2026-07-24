import { useTheme } from "@mui/material/styles";
import { useContext } from "react";

import { UserContext } from "../context";
import { colors } from "../util";

function User({ id, style, component, render, ...other }) {
  const theme = useTheme();
  const user = useContext(UserContext);

  const userData = { name: user.name, color: user.color };

  const Component = component || "span";
  const userEl = (
    <Component
      style={{
        color: Object.hasOwn(colors, userData.color)
          ? colors[userData.color][theme.palette.mode === "dark" ? 100 : 900]
          : "inherit",
        fontWeight: 500,
        ...style,
      }}
      {...other}
    >
      <span>{userData.name}</span>
    </Component>
  );
  return render ? render(userData, userEl) : userEl;
}

export default User;
