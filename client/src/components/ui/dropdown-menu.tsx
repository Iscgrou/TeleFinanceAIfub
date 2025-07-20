import { cn } from "@/lib/utils";
import { Button } from "./button";
import { useState, useRef, useEffect, ReactNode } from "react";

interface DropdownMenuProps {
  children: ReactNode;
}

interface DropdownMenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps {
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

function DropdownMenuContext() {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerRef, setTriggerRef] = useState<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef &&
        !triggerRef.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, triggerRef]);

  return { isOpen, setIsOpen, triggerRef, setTriggerRef, contentRef };
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const context = DropdownMenuContext();
  
  return (
    <div className="relative inline-block text-right">
      {Array.isArray(children) ? 
        children.map((child, index) => 
          child.type === DropdownMenuTrigger || child.type === DropdownMenuContent
            ? { ...child, props: { ...child.props, context } }
            : child
        ) : children}
    </div>
  );
}

export function DropdownMenuTrigger({ children, asChild, ...props }: DropdownMenuTriggerProps & { context?: any }) {
  const context = (props as any).context || DropdownMenuContext();
  
  const handleClick = () => {
    context.setIsOpen(!context.isOpen);
  };

  if (asChild && children) {
    const child = children as any;
    return {
      ...child,
      props: {
        ...child.props,
        ref: context.setTriggerRef,
        onClick: handleClick
      }
    };
  }

  return (
    <Button
      ref={context.setTriggerRef}
      onClick={handleClick}
      variant="ghost"
      className="p-0"
    >
      {children}
    </Button>
  );
}

export function DropdownMenuContent({ 
  children, 
  align = "end", 
  className,
  ...props 
}: DropdownMenuContentProps & { context?: any }) {
  const context = (props as any).context || DropdownMenuContext();
  
  if (!context.isOpen) return null;

  const alignClass = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2",
    end: "right-0"
  }[align];

  return (
    <div
      ref={context.contentRef}
      className={cn(
        "absolute top-full mt-2 min-w-[12rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md z-50",
        alignClass,
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ 
  children, 
  onClick, 
  className 
}: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}