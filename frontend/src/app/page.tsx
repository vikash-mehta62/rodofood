import { redirect } from 'next/navigation';

// Root redirects to landing page
export default function RootPage() {
  redirect('/landing');
}
