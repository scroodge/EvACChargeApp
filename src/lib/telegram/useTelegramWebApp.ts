"use client";

import { useEffect, useState } from "react";

export type TelegramUser = {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
};

export type TelegramThemeParams = Record<string, string | undefined>;

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  themeParams?: TelegramThemeParams;
  colorScheme?: "light" | "dark";
  viewportHeight?: number;
  platform?: string;
  ready?: () => void;
  expand?: () => void;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export type TelegramWebAppState = {
  isTelegram: boolean;
  initData: string;
  user?: TelegramUser;
  themeParams: TelegramThemeParams;
  colorScheme?: "light" | "dark";
  viewportHeight?: number;
  platform?: string;
};

const defaultState: TelegramWebAppState = {
  isTelegram: false,
  initData: "",
  themeParams: {},
};

export function useTelegramWebApp() {
  const [state, setState] = useState<TelegramWebAppState>(defaultState);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const webApp = (window as TelegramWindow).Telegram?.WebApp;
    if (!webApp) return;

    webApp.ready?.();
    webApp.expand?.();

    window.setTimeout(() => {
      setState(getTelegramSnapshot());
    }, 0);
  }, []);

  return state;
}

function getTelegramSnapshot(): TelegramWebAppState {
  if (typeof window === "undefined") return defaultState;

  const webApp = (window as TelegramWindow).Telegram?.WebApp;
  if (!webApp) return defaultState;

  return {
    isTelegram: true,
    initData: webApp.initData ?? "",
    user: webApp.initDataUnsafe?.user,
    themeParams: webApp.themeParams ?? {},
    colorScheme: webApp.colorScheme,
    viewportHeight: webApp.viewportHeight,
    platform: webApp.platform,
  };
}
