'use client';
import { useActionState } from 'react';
import { mutate, login, Result } from '@/app/admin/actions';
export function AdminForm({
  children,
  csrf,
  action,
  id,
  loginForm = false,
  danger = false,
}: {
  children?: React.ReactNode;
  csrf: string;
  action?: string;
  id?: string;
  loginForm?: boolean;
  danger?: boolean;
}) {
  const [state, submit, pending] = useActionState<Result, FormData>(loginForm ? login : mutate, {});
  return (
    <form
      action={submit}
      onSubmit={(e) => {
        if (danger && !confirm('Delete this record? This cannot be undone.')) e.preventDefault();
      }}
      className="admin-form"
    >
      <input type="hidden" name="csrf" value={csrf} />
      <input type="hidden" name="action" value={action ?? ''} />
      <input type="hidden" name="id" value={id ?? ''} />
      {children}
      <button className={'button ' + (danger ? 'danger' : 'red')} disabled={pending}>
        {pending
          ? 'Please wait…'
          : loginForm
            ? 'Sign in'
            : action?.startsWith('delete')
              ? 'Delete'
              : action === 'logout'
                ? 'Log out'
                : action === 'upload'
                  ? 'Upload image'
                  : 'Save changes'}
      </button>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="form-success">
          {state.success}
          {action === 'logout' && (
            <>
              {' '}
              <a href="/admin/login">Return to login</a>
            </>
          )}
        </p>
      )}
    </form>
  );
}
