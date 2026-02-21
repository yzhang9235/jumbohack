"use client";

import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

import { cn } from "./utils";

function Menubar({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Root>) {
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      className={cn(
        // 升级：更柔和的背景，增加毛玻璃感和更细腻的阴影
        "bg-background/80 backdrop-blur-md flex h-10 items-center gap-1 rounded-xl border p-1.5 shadow-sm antialiased",
        className,
      )}
      {...props}
    />
  );
}

function MenubarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
  return (
    <MenubarPrimitive.Trigger
      data-slot="menubar-trigger"
      className={cn(
        // 升级：增加 transition 动画，激活时稍微有点缩放感或更明显的圆角
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent/80 data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-lg px-3 py-1 text-sm font-medium outline-none select-none transition-all duration-200 active:scale-95",
        className,
      )}
      {...props}
    />
  );
}

function MenubarContent({
  className,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Content>) {
  return (
    <MenubarPortal>
      <MenubarPrimitive.Content
        data-slot="menubar-content"
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          // 升级：更强烈的投影，更大的圆角，以及入场动画优化
          "bg-popover/95 text-popover-foreground backdrop-blur-xl z-50 min-w-[13rem] overflow-hidden rounded-xl border p-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)]",
          "data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100", // 这里的 zoom-in-100 更顺滑
          className,
        )}
        {...props}
      />
    </MenubarPortal>
  );
}

function MenubarItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <MenubarPrimitive.Item
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        // 升级：更宽的内边距，更轻盈的 Hover 效果
        "relative flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none transition-colors",
        "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground/80",
        className,
      )}
      {...props}
    />
  );
}

function MenubarShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="menubar-shortcut"
      className={cn(
        // 升级：给快捷键增加类似“按键”的视觉效果
        "text-muted-foreground/60 ml-auto text-[10px] font-sans tracking-tighter border border-border/50 bg-muted/50 px-1.5 py-0.5 rounded-[4px] shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

/* 保持其他辅助组件逻辑一致，仅优化间距和圆角 */
function MenubarSeparator({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  return <MenubarPrimitive.Separator className={cn("bg-border/60 -mx-1.5 my-1.5 h-px", className)} {...props} />;
}

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
};


// ... 其他组件 (MenubarCheckboxItem, MenubarRadioItem 等) 建议参考上述 Item 的 px-2.5 和 rounded-lg 进行统一
// "use client";

// import * as React from "react";
// import * as MenubarPrimitive from "@radix-ui/react-menubar";
// import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

// import { cn } from "./utils";

// function Menubar({
//   className,
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.Root>) {
//   return (
//     <MenubarPrimitive.Root
//       data-slot="menubar"
//       className={cn(
//         "bg-background flex h-9 items-center gap-1 rounded-md border p-1 shadow-xs",
//         className,
//       )}
//       {...props}
//     />
//   );
// }

// function MenubarMenu({
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
//   return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />;
// }

// function MenubarGroup({
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.Group>) {
//   return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />;
// }

// function MenubarPortal({
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
//   return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />;
// }

// function MenubarRadioGroup({
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
//   return (
//     <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
//   );
// }

// function MenubarTrigger({
//   className,
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
//   return (
//     <MenubarPrimitive.Trigger
//       data-slot="menubar-trigger"
//       className={cn(
//         "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none",
//         className,
//       )}
//       {...props}
//     />
//   );
// }

// function MenubarContent({
//   className,
//   align = "start",
//   alignOffset = -4,
//   sideOffset = 8,
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.Content>) {
//   return (
//     <MenubarPortal>
//       <MenubarPrimitive.Content
//         data-slot="menubar-content"
//         align={align}
//         alignOffset={alignOffset}
//         sideOffset={sideOffset}
//         className={cn(
//           "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[12rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-md",
//           className,
//         )}
//         {...props}
//       />
//     </MenubarPortal>
//   );
// }

// function MenubarItem({
//   className,
//   inset,
//   variant = "default",
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.Item> & {
//   inset?: boolean;
//   variant?: "default" | "destructive";
// }) {
//   return (
//     <MenubarPrimitive.Item
//       data-slot="menubar-item"
//       data-inset={inset}
//       data-variant={variant}
//       className={cn(
//         "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
//         className,
//       )}
//       {...props}
//     />
//   );
// }

// function MenubarCheckboxItem({
//   className,
//   children,
//   checked,
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem>) {
//   return (
//     <MenubarPrimitive.CheckboxItem
//       data-slot="menubar-checkbox-item"
//       className={cn(
//         "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
//         className,
//       )}
//       checked={checked}
//       {...props}
//     >
//       <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
//         <MenubarPrimitive.ItemIndicator>
//           <CheckIcon className="size-4" />
//         </MenubarPrimitive.ItemIndicator>
//       </span>
//       {children}
//     </MenubarPrimitive.CheckboxItem>
//   );
// }

// function MenubarRadioItem({
//   className,
//   children,
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.RadioItem>) {
//   return (
//     <MenubarPrimitive.RadioItem
//       data-slot="menubar-radio-item"
//       className={cn(
//         "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
//         className,
//       )}
//       {...props}
//     >
//       <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
//         <MenubarPrimitive.ItemIndicator>
//           <CircleIcon className="size-2 fill-current" />
//         </MenubarPrimitive.ItemIndicator>
//       </span>
//       {children}
//     </MenubarPrimitive.RadioItem>
//   );
// }

// function MenubarLabel({
//   className,
//   inset,
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.Label> & {
//   inset?: boolean;
// }) {
//   return (
//     <MenubarPrimitive.Label
//       data-slot="menubar-label"
//       data-inset={inset}
//       className={cn(
//         "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
//         className,
//       )}
//       {...props}
//     />
//   );
// }

// function MenubarSeparator({
//   className,
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
//   return (
//     <MenubarPrimitive.Separator
//       data-slot="menubar-separator"
//       className={cn("bg-border -mx-1 my-1 h-px", className)}
//       {...props}
//     />
//   );
// }

// function MenubarShortcut({
//   className,
//   ...props
// }: React.ComponentProps<"span">) {
//   return (
//     <span
//       data-slot="menubar-shortcut"
//       className={cn(
//         "text-muted-foreground ml-auto text-xs tracking-widest",
//         className,
//       )}
//       {...props}
//     />
//   );
// }

// function MenubarSub({
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
//   return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
// }

// function MenubarSubTrigger({
//   className,
//   inset,
//   children,
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
//   inset?: boolean;
// }) {
//   return (
//     <MenubarPrimitive.SubTrigger
//       data-slot="menubar-sub-trigger"
//       data-inset={inset}
//       className={cn(
//         "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[inset]:pl-8",
//         className,
//       )}
//       {...props}
//     >
//       {children}
//       <ChevronRightIcon className="ml-auto h-4 w-4" />
//     </MenubarPrimitive.SubTrigger>
//   );
// }

// function MenubarSubContent({
//   className,
//   ...props
// }: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
//   return (
//     <MenubarPrimitive.SubContent
//       data-slot="menubar-sub-content"
//       className={cn(
//         "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
//         className,
//       )}
//       {...props}
//     />
//   );
// }

// export {
//   Menubar,
//   MenubarPortal,
//   MenubarMenu,
//   MenubarTrigger,
//   MenubarContent,
//   MenubarGroup,
//   MenubarSeparator,
//   MenubarLabel,
//   MenubarItem,
//   MenubarShortcut,
//   MenubarCheckboxItem,
//   MenubarRadioGroup,
//   MenubarRadioItem,
//   MenubarSub,
//   MenubarSubTrigger,
//   MenubarSubContent,
// };
