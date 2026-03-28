import { useState } from "react";

export type Locale = "en" | "zh";

const STRINGS = {
  en: {
    swap:        "SWAP",        pool:        "LIQUIDITY",
    perps:       "PERPETUALS",  farm:        "YIELD FARM",
    locker:      "LOCKER",      quests:      "QUESTS",
    staking:     "STAKING",     leaderboard: "LEADERBOARD",
    bridge:      "BRIDGE",      profile:     "PROFILE",
    create:      "CREATE",      admin:       "ADMIN",
    connect:     "CONNECT",     signIn:      "SIGN IN",
    signedIn:    "SIGNED IN",   disconnect:  "DISCONNECT",
    manageWallet:"MANAGE WALLET",viewProfile:"VIEW PROFILE",
    live:        "LIVE",
  },
  zh: {
    swap:        "兑换",         pool:        "流动性",
    perps:       "永续合约",     farm:        "收益农场",
    locker:      "锁仓",         quests:      "任务",
    staking:     "质押",         leaderboard: "排行榜",
    bridge:      "跨链桥",       profile:     "个人资料",
    create:      "创建任务",     admin:       "管理员",
    connect:     "连接钱包",     signIn:      "登录",
    signedIn:    "已登录",       disconnect:  "断开连接",
    manageWallet:"管理钱包",     viewProfile: "查看资料",
    live:        "实时",
  },
};

export type StringKey = keyof typeof STRINGS.en;

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(() => {
    return (localStorage.getItem("jinkfi_locale") as Locale) ?? "en";
  });

  const toggle = () => {
    const next: Locale = locale === "en" ? "zh" : "en";
    localStorage.setItem("jinkfi_locale", next);
    setLocale(next);
  };

  const t = (key: StringKey): string => STRINGS[locale][key];

  return { locale, toggle, t };
}
