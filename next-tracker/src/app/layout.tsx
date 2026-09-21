import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { SessionProvider } from "@/components/providers/session-provider";
import { NotificationCenter } from "@/components/layout/notification-center";
import { GlobalTimerBanner } from "@/components/layout/global-timer-banner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Office Time Tracker",
  description: "A premium, futuristic productivity application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground selection:bg-primary/30`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <AppSidebar />
              <main className="flex-1 overflow-x-hidden flex flex-col relative">
                <header className="h-16 flex items-center px-6 border-b border-white/5 bg-background/40 backdrop-blur-3xl sticky top-0 z-10">
                  <SidebarTrigger className="mr-4 hover:bg-white/10" />
                  <div className="flex-1 flex justify-end items-center gap-4">
                    <div className="text-xs text-muted-foreground tracking-widest uppercase hidden sm:block">
                      Press <kbd className="px-2 py-1 bg-muted rounded-md border border-border text-foreground font-mono shadow-sm">Alt</kbd> + <kbd className="px-2 py-1 bg-muted rounded-md border border-border text-foreground font-mono shadow-sm">K</kbd>
                    </div>
                    <NotificationCenter />
                    <ThemeToggle />
                  </div>
                </header>
                <div className="flex-1 p-6">
                  {children}
                </div>
              </main>
              <CommandPalette />
              <GlobalTimerBanner />
            </SidebarProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
