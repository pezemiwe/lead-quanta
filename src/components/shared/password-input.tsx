import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input, type InputProps } from "./input";

type PasswordInputProps = Omit<InputProps, "type" | "icon" | "endAdornment">;

export const PasswordInput = ({ ...props }: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      autoComplete={props.autoComplete ?? "current-password"}
      icon={<LockKeyhole className="h-full w-full" />}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="flex h-8 w-8 items-center justify-center rounded-md text-dark-gray/55 transition-colors hover:bg-pale-red hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/45"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      }
    />
  );
};
