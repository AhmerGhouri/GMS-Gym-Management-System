import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to dashboard by default. Middleware will handle auth redirection.
  redirect('/dashboard');
}
