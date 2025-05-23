"use client";
import { SessionProvider } from "next-auth/react"
export const ClientLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    )
}
