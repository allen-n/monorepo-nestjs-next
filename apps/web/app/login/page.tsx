import { authenticate } from '@web/app/lib/actions';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex text-black">
        {' '}
        <form action={authenticate}>
          <input type="email" name="email" placeholder="Email" required />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
          />
          <button className="text-white" type="submit">
            Login
          </button>
        </form>
      </div>
    </main>
  );
}
