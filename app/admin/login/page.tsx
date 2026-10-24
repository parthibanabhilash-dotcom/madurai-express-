import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { session } from '@/lib/auth';
import { AdminForm } from '@/components/admin-form';
export default async function Login() {
  if (await session()) redirect('/admin');
  const csrf = (await cookies()).get('mm_login_csrf')?.value;
  if (!csrf) redirect('/admin/login/init');
  return (
    <div className="login-card">
      <a className="footer-brand" href="/">
        MADURAI EXPRESS.
      </a>
      <p className="eyebrow">RESTAURANT ADMINISTRATION</p>
      <h1>Welcome back.</h1>
      <p>Sign in to manage your restaurant.</p>
      <AdminForm csrf={csrf} loginForm>
        <label>
          Email
          <input type="email" name="email" required autoComplete="username" />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            required
            maxLength={256}
            autoComplete="current-password"
          />
        </label>
      </AdminForm>
      <a href="/">← Back to website</a>
    </div>
  );
}
