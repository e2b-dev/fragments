import "@/styles/globals.css";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import type { AppProps } from "next/app";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "identified_only",
    session_recording: {
      recordCrossOriginIframes: true,
    },
  });
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PostHogProvider client={posthog}>
      <Component {...pageProps} />
    </PostHogProvider>
  );
}
