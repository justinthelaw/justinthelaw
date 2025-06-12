// Types for ChatBox utils
import type { ModelSelection } from "./modelSelection";

export interface MessageData {
  action: string;
  input?: string;
  modelSelection?: ModelSelection;
}
