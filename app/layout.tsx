"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

// Ví phổ biến
import {
    PhantomWalletAdapter,
    BackpackWalletAdapter,
    SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import "@solana/wallet-adapter-react-ui/styles.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Doomsday Pet",
    description: "Web3 Pet Game",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const network = WalletAdapterNetwork.Devnet; // ← đổi tùy bạn muốn Devnet/Mainnet

    const endpoint = "https://api.devnet.solana.com";

    const wallets = [
        new PhantomWalletAdapter(),
        new BackpackWalletAdapter(),
        new SolflareWalletAdapter(),
    ];

    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

                {/* 🔥 Đây là phần cực quan trọng mà bạn đang thiếu */}
                <ConnectionProvider endpoint={endpoint}>
                    <WalletProvider wallets={wallets} autoConnect>
                        <WalletModalProvider>
                            {children}
                        </WalletModalProvider>
                    </WalletProvider>
                </ConnectionProvider>

            </body>
        </html>
    );
}
