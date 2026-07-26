import makeStyles from "@mui/styles/makeStyles";
import { memo, useEffect, useRef } from "react";

import useStorage from "../hooks/useStorage";
import autoscroll from "../utils/autoscroll";
import ChatCards from "./ChatCards";
import Scrollbox from "./Scrollbox";
import Subheading from "./Subheading";

const useStyles = makeStyles({
  chatPanel: {
    display: "flex",
    flexDirection: "column",
  },
  chatHeader: {
    transition: "text-shadow 0.5s",
    "&:hover": {
      cursor: "pointer",
      textShadow: "0 0 0.75px",
    },
  },
  chat: {
    overflowY: "auto",
    flexGrow: 1,
    overflowWrap: "anywhere",
    padding: "0 4px",
  },
});

/** Shows a log of sets found during a game and how long each took to find. */
function Chat({ title, history, gameMode, startedAt }) {
  const classes = useStyles();

  const chatEl = useRef();
  useEffect(() => {
    return autoscroll(chatEl.current);
  }, []);

  const [chatHidden, setChatHidden] = useStorage("chat-hidden", "no");

  function toggleChat() {
    setChatHidden(chatHidden === "yes" ? "no" : "yes");
  }

  return (
    <section
      className={classes.chatPanel}
      style={{ flexGrow: 1, overflowY: "hidden" }}
    >
      <Subheading className={classes.chatHeader} onClick={toggleChat}>
        {title} {chatHidden === "yes" && "(Hidden)"}
      </Subheading>
      {chatHidden !== "yes" && (
        <Scrollbox className={classes.chat} ref={chatEl}>
          {(history || []).map((item, i) => (
            <ChatCards
              key={i}
              item={item}
              gameMode={gameMode}
              previousTime={i > 0 ? history[i - 1].time : startedAt}
            />
          ))}
        </Scrollbox>
      )}
    </section>
  );
}

export default memo(Chat);
