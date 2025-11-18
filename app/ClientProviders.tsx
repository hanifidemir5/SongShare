"use client"; // only this file is a Client Component
import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryclient";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SongsProvider } from "./contexts/SongsContext";
import { SpotifyAuthProvider } from "./contexts/SpotifyAuthContext";
import { YouTubeAuthProvider } from "./contexts/YoutubeAuthContext";
import { AuthProvider } from "./contexts/AuthContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SongsProvider>
        <AuthProvider>
          <YouTubeAuthProvider>
            <SpotifyAuthProvider>{children}</SpotifyAuthProvider>
          </YouTubeAuthProvider>
        </AuthProvider>
      </SongsProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
