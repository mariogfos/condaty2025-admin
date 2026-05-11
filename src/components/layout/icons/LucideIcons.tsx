import {
  BellDot,
  BriefcaseBusiness,
  Building,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Globe,
  HandCoins,
  House,
  Landmark,
  ListTodo,
  LogOut,
  Megaphone,
  Menu,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Umbrella,
  Users,
  Wallet,
} from "lucide-react";
import { IconType, LucideWrap } from "@/mk/components/ui/Icon/Icon";

type LucidePreset = {
  absoluteStrokeWidth?: boolean;
  size?: number | string;
  strokeWidth?: number;
};

const createLucideIcon =
  (
    icon: any,
    {
      absoluteStrokeWidth = true,
      size = 20,
      strokeWidth = 1.25,
    }: LucidePreset = {},
  ) =>
  ({ size: customSize, ...props }: IconType) =>
    (
      <LucideWrap
        icon={icon}
        absoluteStrokeWidth={absoluteStrokeWidth}
        size={customSize ?? size}
        strokeWidth={strokeWidth}
        {...props}
      />
    );

export const IconArrowLeft = createLucideIcon(ChevronLeft, {
  size: 18,
  strokeWidth: 1.35,
});
export const IconArrowUp = createLucideIcon(ChevronUp, {
  size: 18,
  strokeWidth: 1.35,
});
export const IconArrowDown = createLucideIcon(ChevronDown, {
  size: 18,
  strokeWidth: 1.35,
});
export const IconHome = createLucideIcon(House);
export const IconNotification = createLucideIcon(BellDot);
export const IconSetting = createLucideIcon(Settings);
export const IconMenu = createLucideIcon(Menu, {
  strokeWidth: 1.35,
});
export const IconUmbrella = createLucideIcon(Umbrella);
export const IconLogout = createLucideIcon(LogOut, {
  strokeWidth: 1.35,
});
export const IconDepartments = createLucideIcon(Building2);
export const IconGroup = createLucideIcon(Users);
export const IconPayments = createLucideIcon(HandCoins);
export const IconWorld = createLucideIcon(Globe);
export const IconMonitorLine = createLucideIcon(ListTodo);
export const IconMessage = createLucideIcon(MessagesSquare);
export const IconSecurityV2 = createLucideIcon(ShieldCheck);
export const IconBackOffice = createLucideIcon(BriefcaseBusiness);
export const IconFinance = createLucideIcon(Wallet);
export const IconAdministracion = createLucideIcon(Building);
export const IconCommunication = createLucideIcon(Megaphone);
