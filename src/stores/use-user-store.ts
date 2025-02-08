import { create } from "zustand";

type UserStore = {
  username: string | null | undefined;
  installationId: number | null | undefined;
  changeUsername: (username: string | null) => void;
  changeInstallationId: (installationId: number | null) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  username: undefined,
  installationId: undefined,
  changeUsername: (username: string | null) => {
    set({ username });
    if (username === null) {
      localStorage.removeItem("username");
      return;
    }
    localStorage.setItem("username", username);
  },
  changeInstallationId: (installationId: number | null) => {
    set({ installationId: installationId });
    if (installationId === null) {
      localStorage.removeItem("installationId");
      return;
    }
    localStorage.setItem("installationId", installationId.toString());
  },
}));
