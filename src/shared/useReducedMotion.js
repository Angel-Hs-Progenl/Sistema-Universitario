import { useMotionPreference } from "./MotionPreference";

export default function useReducedMotion() {
  // Contrato conservado para Brand y WelcomeArt; CR-006 usa la elección del footer.
  return !useMotionPreference().enabled;
}
