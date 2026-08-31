type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: "50%",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,149,106,0.06) 0%, transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}
