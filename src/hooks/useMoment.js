import moment from "moment";
import { useEffect, useState } from "react";

function useMoment(delay = 1000) {
  const [time, setTime] = useState(moment());

  useEffect(() => {
    const id = setInterval(() => {
      setTime(moment());
    }, delay);
    return () => clearInterval(id);
  }, [delay]);

  return time;
}

export default useMoment;
