import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/theme.css";
import "../styles/utils.css";
import AxiosInstanceProvider from "@/mk/contexts/AxiosInstanceProvider";
import axiosInterceptors from "@/mk/interceptors/axiosInterceptors";
import AuthProvider from "@/mk/contexts/AuthProvider";
import Layout from "@/components/layout/Layout";
import { Metadata, Viewport } from "next";
import ChatInstantDb from "@/mk/components/chat/ChatInstantDb";
import { ImageModalProvider } from "@/contexts/ImageModalContext";
import AppLanguageLayer from "@/i18n/AppLanguageLayer";
// import { ReactScan } from "@/mk/utils/reactscan/ReactScan";

const appSans = Inter({
  subsets: ["latin"],
  variable: "--font-app-sans",
  display: "swap",
});

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
    <html
      lang="es"
      className={appSans.variable}
      suppressHydrationWarning
    >
      {/* <ReactScan /> */}
      <body className={appSans.className} cz-shortcut-listen="true">
        <AxiosInstanceProvider interceptors={axiosInterceptors}>
          <AppLanguageLayer>
            <AuthProvider>
              <ImageModalProvider>
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
