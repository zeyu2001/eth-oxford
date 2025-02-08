import { create } from "zustand";

type UserStore = {
  username: string | null;
  installationId: number | null;
  changeUsername: (username: string) => void;
  changeInstallationId: (installationId: number) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  username: null,
  installationId: null,
  changeUsername: (username: string) => set({ username }),
  changeInstallationId: (installationId: number) =>
    set({ installationId: installationId }),
}));
