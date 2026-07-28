import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-4 dark:bg-black">
      <LoginForm callbackUrl={callbackUrl ?? "/"} />
    </div>
  );
}
