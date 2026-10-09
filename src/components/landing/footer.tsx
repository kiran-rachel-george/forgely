import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-800 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Forgely. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-slate-300">
            Login
          </Link>
          <Link href="/signup" className="hover:text-slate-300">
            Sign up
          </Link>
          <a
            href="https://vercel.com"
            className="hover:text-slate-300"
            target="_blank"
            rel="noreferrer"
          >
            Deploy on Vercel
          </a>
        </div>
      </div>
    </footer>
  );
}
