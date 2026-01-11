"use client"; // only this file is a Client Component
import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryclient";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PlayerProvider } from "./contexts/PlayerContext";
import SidebarPlayer from "@/components/layout/SidebarPlayer";
import { SongsProvider } from "./contexts/SongsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PlayerProvider>
        <SongsProvider>
          <AuthProvider>
            <ToastContainer />
            {children}
            <SidebarPlayer />
          </AuthProvider>
        </SongsProvider>
      </PlayerProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
