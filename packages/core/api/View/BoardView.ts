import { IBoardView, NishanArg } from "@nishan/types";
import Aggregator from "./Aggregator";

/**
 * A class to represent board view of Notion
 * @noInheritDoc
 */

class BoardView extends Aggregator<IBoardView> {
  constructor(arg: NishanArg) {
    super({ ...arg });
  }
}

export default BoardView;