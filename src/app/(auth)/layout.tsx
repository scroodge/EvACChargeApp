export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background bg-[radial-gradient(circle_at_top,_rgba(15,157,169,0.22),transparent_72%)]">
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-[calc(env(safe-area-inset-top)+48px)]">
        {children}
      </div>
    </div>
  );
}
