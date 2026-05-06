import { ReactNode } from "react";
import { Navbar } from "./Navbar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navbar />
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>
    </div>
  );
}