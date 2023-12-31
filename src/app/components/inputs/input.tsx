// import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { cn } from "@lib/utils";
import React from "react";
import { IconType } from "react-icons";
interface Props
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  icon?: IconType;
}

const Input = React.forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { name, icon: Icon, className, ...rest } = props;
  return (
    <div
      className={cn(
        "group relative my-4 flex items-center space-x-3 rounded-lg border-2 border-tran bg-gray-200/50 px-3 text-gray-800/80 focus-within:border-blue-500 dark:bg-surface-dark dark:text-onSurface-dark dark:shadow-none",
        className,
      )}
    >
      {Icon && (
        <Icon
          className="fill-gray-800/80 transition-none group-focus-within:fill-blue-500 dark:fill-surface-light"
          size={30}
        />
      )}
      <div className="relative w-full rounded-[inherit]">
        <input
          type="text"
          {...rest}
          className="peer w-full bg-tran p-3 pl-0 pt-6 outline-none"
          autoComplete="off"
          placeholder="&#8205;"
          required
          name={name?.toLowerCase().replace(" ", "_")}
          ref={ref}
        />

        <label
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 capitalize opacity-80 transition-all duration-200 peer-valid:top-2
          peer-valid:translate-y-0 peer-valid:text-xs peer-valid:text-blue-500 peer-focus:top-2
          peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-blue-500 peer-focus:opacity-100"
        >
          {name}
        </label>
      </div>
    </div>
  );
});

Input.displayName = "Input";

export default Input;
// ${styleOnEvent(
//     "group-focus-within",
//     "left-2 top-0 translate-y-0"
//   )}
