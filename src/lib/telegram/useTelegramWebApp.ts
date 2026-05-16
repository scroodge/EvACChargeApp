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

export type TelegramSafeAreaInset = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

type TelegramWebApp = NonNullable<Window["Telegram"]>["WebApp"];

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

type TelegramWebAppSnapshot = {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  themeParams?: TelegramThemeParams;
  colorScheme?: "light" | "dark";
  viewportHeight?: number;
  viewportStableHeight?: number;
  platform?: string;
  safeAreaInset?: TelegramSafeAreaInset;
  contentSafeAreaInset?: TelegramSafeAreaInset;
} & NonNullable<TelegramWebApp>;

export type TelegramWebAppState = {
  isTelegram: boolean;
  initData: string;
  user?: TelegramUser;
  themeParams: TelegramThemeParams;
  colorScheme?: "light" | "dark";
  viewportHeight?: number;
  viewportStableHeight?: number;
  platform?: string;
  safeAreaInset?: TelegramSafeAreaInset;
  contentSafeAreaInset?: TelegramSafeAreaInset;
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

    const updateViewport = () => {
      setState(getTelegramSnapshot());
    };

    window.setTimeout(updateViewport, 0);
    webApp.onEvent?.("viewportChanged", updateViewport);

    return () => {
      webApp.offEvent?.("viewportChanged", updateViewport);
    };
  }, []);

  return state;
}

function getTelegramSnapshot(): TelegramWebAppState {
  if (typeof window === "undefined") return defaultState;

  const webApp = (window as TelegramWindow).Telegram?.WebApp as
    | TelegramWebAppSnapshot
    | undefined;
  if (!webApp) return defaultState;

  return {
    isTelegram: true,
    initData: webApp.initData ?? "",
    user: webApp.initDataUnsafe?.user,
    themeParams: webApp.themeParams ?? {},
    colorScheme: webApp.colorScheme,
    viewportHeight: webApp.viewportHeight,
    viewportStableHeight: webApp.viewportStableHeight,
    platform: webApp.platform,
    safeAreaInset: webApp.safeAreaInset,
    contentSafeAreaInset: webApp.contentSafeAreaInset,
  };
}
