import { useSearchParams } from "react-router-dom";

import GamePage from "./GamePage";
import TrainingPage from "./TrainingPage";

function GameRoute() {
  const [searchParams] = useSearchParams();
  const training = searchParams.get("training");

  if (training) {
    return <TrainingPage type={training} />;
  }
  return <GamePage />;
}

export default GameRoute;
