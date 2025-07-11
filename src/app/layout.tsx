// import { Geist, Geist_Mono } from "next/font/google";
import "../styles/theme.css";
import "../styles/utils.css";
import AxiosInstanceProvider from "@/mk/contexts/AxiosInstanceProvider";
import axiosInterceptors from "@/mk/interceptors/axiosInterceptors";
import AuthProvider from "@/mk/contexts/AuthProvider";
import Layout from "@/components/layout/Layout";
import { Metadata, Viewport } from "next";
import ChatInstantDb from "@/mk/components/chat/ChatInstantDb";
import NotifInstantDb from "@/mk/components/notif/ActiveNotificationDB";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Default App Name",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Default Description",
  other: {
    google: "notranslate",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body cz-shortcut-listen="false">
        <AxiosInstanceProvider interceptors={axiosInterceptors}>
          <AuthProvider>
            <NotifInstantDb />
            <div
              id="portal-root"
              style={{
                position: "absolute",
                overflow: "visible",
                zIndex: 9999,
                width: "100%",
              }}
            ></div>
            <Layout>{children}</Layout>
            {/* <ChatInstantDb /> */}
          </AuthProvider>
        </AxiosInstanceProvider>
      </body>
    </html>
  );
}
