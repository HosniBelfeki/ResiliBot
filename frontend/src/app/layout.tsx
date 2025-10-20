'use client';

import React from 'react';
import { Inter } from "next/font/google";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import "./globals.css";
import { useAppStore } from '@/store/useAppStore';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create theme based on app store theme
const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: '#0ea5e9',
      light: '#f0f9ff',
      dark: '#0369a1',
    },
    secondary: {
      main: '#64748b',
      light: '#f1f5f9',
      dark: '#334155',
    },
  },
  typography: {
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: mode === 'dark' ? '#475569 #0f172a' : '#cbd5e1 #ffffff',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: mode === 'dark' ? '#0f172a' : '#ffffff',
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: mode === 'dark' ? '#475569' : '#cbd5e1',
            minHeight: 24,
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: mode === 'dark' ? '#64748b' : '#94a3b8',
          },
        },
      },
    },
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme } = useAppStore();
  const muiTheme = getTheme(theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme
  );

  return (
    <html lang="en" data-theme={muiTheme.palette.mode}>
      <head>
        <title>ResiliBot - Autonomous Incident Response</title>
        <meta name="description" content="AI-powered autonomous incident response and monitoring platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable}`}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
