"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react"; // 换个更优雅的分割符

import { cn } from "./utils";

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-3 has-disabled:opacity-50", // 增加全局间距
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-2", className)} // 增加格子间的间距
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        // 基础样式：改为全圆角独立方块
        "relative flex h-12 w-10 items-center justify-center rounded-xl border border-input bg-background text-base font-semibold shadow-sm transition-all duration-300 antialiased",
        // 激活状态：增加环绕发光和上浮感
        "data-[active=true]:z-10 data-[active=true]:border-primary data-[active=true]:ring-4 data-[active=true]:ring-primary/10 data-[active=true]:-translate-y-[2px] data-[active=true]:shadow-md",
        // 错误状态
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        // 暗色模式微调
        "dark:bg-zinc-900 dark:border-zinc-800",
        className,
      )}
      {...props}
    >
      <span className="transition-all duration-200 scale-110">{char}</span>
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* 光标改为圆角矩形，更柔和 */}
          <div className="animate-caret-blink bg-primary h-5 w-[2px] rounded-full duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div 
      data-slot="input-otp-separator" 
      role="separator" 
      className="text-muted-foreground/50" // 让分割符不那么突兀
      {...props}
    >
      <Dot size={32} strokeWidth={3} />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
// "use client";

// import * as React from "react";
// import { OTPInput, OTPInputContext } from "input-otp";
// import { MinusIcon } from "lucide-react";

// import { cn } from "./utils";

// function InputOTP({
//   className,
//   containerClassName,
//   ...props
// }: React.ComponentProps<typeof OTPInput> & {
//   containerClassName?: string;
// }) {
//   return (
//     <OTPInput
//       data-slot="input-otp"
//       containerClassName={cn(
//         "flex items-center gap-2 has-disabled:opacity-50",
//         containerClassName,
//       )}
//       className={cn("disabled:cursor-not-allowed", className)}
//       {...props}
//     />
//   );
// }

// function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
//   return (
//     <div
//       data-slot="input-otp-group"
//       className={cn("flex items-center gap-1", className)}
//       {...props}
//     />
//   );
// }

// function InputOTPSlot({
//   index,
//   className,
//   ...props
// }: React.ComponentProps<"div"> & {
//   index: number;
// }) {
//   const inputOTPContext = React.useContext(OTPInputContext);
//   const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

//   return (
//     <div
//       data-slot="input-otp-slot"
//       data-active={isActive}
//       className={cn(
//         "data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm bg-input-background transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]",
//         className,
//       )}
//       {...props}
//     >
//       {char}
//       {hasFakeCaret && (
//         <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
//           <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
//         </div>
//       )}
//     </div>
//   );
// }

// function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
//   return (
//     <div data-slot="input-otp-separator" role="separator" {...props}>
//       <MinusIcon />
//     </div>
//   );
// }

// export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
