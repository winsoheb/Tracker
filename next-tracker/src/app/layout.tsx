import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";

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
      >
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
                  <div className="text-xs text-muted-foreground/60 tracking-widest uppercase">
                    Press <kbd className="px-2 py-1 bg-white/5 rounded-md border border-white/10 text-white font-mono shadow-sm">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white/5 rounded-md border border-white/10 text-white font-mono shadow-sm">K</kbd>
                  </div>
                </div>
              </header>
              <div className="flex-1 p-6">
                {children}
              </div>
            </main>
            <CommandPalette />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
