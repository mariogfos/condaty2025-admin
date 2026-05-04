// import { Geist, Geist_Mono } from "next/font/google";
import "../styles/theme.css";
import "../styles/utils.css";
import "@dayflow/core/dist/styles.css";
import AxiosInstanceProvider from "@/mk/contexts/AxiosInstanceProvider";
import axiosInterceptors from "@/mk/interceptors/axiosInterceptors";
import AuthProvider from "@/mk/contexts/AuthProvider";
import Layout from "@/components/layout/Layout";
import { Metadata, Viewport } from "next";
import ChatInstantDb from "@/mk/components/chat/ChatInstantDb";
import NotifInstantDb from "@/mk/components/notif/ActiveNotificationDB";
import { ImageModalProvider } from "@/contexts/ImageModalContext";
import AppLanguageLayer from "@/i18n/AppLanguageLayer";
// import { ReactScan } from "@/mk/utils/reactscan/ReactScan";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Condaty",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Cantady",
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
    <html lang="es" suppressHydrationWarning>
      {/* <ReactScan /> */}
      <body cz-shortcut-listen="true">
        <AxiosInstanceProvider interceptors={axiosInterceptors}>
          <AppLanguageLayer>
            <AuthProvider>
              <ImageModalProvider>
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
                <ChatInstantDb />
              </ImageModalProvider>
            </AuthProvider>
          </AppLanguageLayer>
        </AxiosInstanceProvider>
      </body>
    </html>
  );
}
