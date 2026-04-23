import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("w-full max-w-xl mx-auto px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}
