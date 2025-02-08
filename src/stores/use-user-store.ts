import { create } from "zustand";

type UserStore = {
  username: string | null | undefined;
  installationId: number | null | undefined;
  changeUsername: (username: string) => void;
  changeInstallationId: (installationId: number) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  username: undefined,
  installationId: undefined,
  changeUsername: (username: string) => {
    set({ username });
    localStorage.setItem("username", username);
  },
  changeInstallationId: (installationId: number) => {
    set({ installationId: installationId });
    localStorage.setItem("installationId", installationId);
  },
}));
