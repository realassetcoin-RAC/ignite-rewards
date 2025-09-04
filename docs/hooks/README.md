# Hooks

## useSecureAuth

Provides authenticated user state, profile, role, and helpers.

- **Returns**: `{ user, session, profile, isAdmin, loading, error, signOut, refreshAuth }`
- **When to use**: Any component that needs auth state or admin gating.

```tsx
import { useSecureAuth } from "@/hooks/useSecureAuth";

export function ProfileGate() {
	const { user, profile, isAdmin, loading, error, signOut } = useSecureAuth();

	if (loading) return <div>Loading…</div>;
	if (error) return <div>Error: {error}</div>;
	if (!user) return <div>Please sign in.</div>;

	return (
		<div>
			<h2>Hello {profile?.full_name ?? user.email}</h2>
			{isAdmin && <span>Admin</span>}
			<button onClick={signOut}>Sign out</button>
		</div>
	);
}
```

### Behavior
- Subscribes to Supabase auth state changes.
- Fetches profile via `get_current_user_profile` and admin status via `is_admin` RPCs in parallel.
- Exposes `refreshAuth()` to manually re-fetch state.

### Types
- `profile`: `{ id, email, full_name | null, role, created_at, updated_at } | null`

## useToast
Programmatic toasts and state subscription for the UI toaster.

- **Exports**: `{ useToast, toast }`
- **Toast props**: `title?: ReactNode`, `description?: ReactNode`, `action?: ToastActionElement`, plus UI props from `ToastProps`.

```tsx
import { useToast, toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export function Demo() {
	const { toasts, dismiss } = useToast();

	return (
		<>
			<button
				onClick={() =>
					toast({ title: "Saved", description: "Your changes are live." })
				}
			>
				Show toast
			</button>
			<Toaster />
			<ul>
				{toasts.map(t => (
					<li key={t.id}>
						{t.title} <button onClick={() => dismiss(t.id)}>Dismiss</button>
					</li>
				))}
			</ul>
		</>
	);
}
```

### Behavior
- Queue size limited to 1 (new toasts replace older).
- Auto-removal after a long delay; closed toasts set `open=false` before removal.
- `toast({...})` returns `{ id, dismiss, update }` for imperative control.

## useIsMobile
Media-query hook for responsive logic.

- **Returns**: `boolean` — true if viewport width < 768px.
- **Usage**:

```tsx
import { useIsMobile } from "@/hooks/use-mobile";

export function ResponsiveHeading() {
	const isMobile = useIsMobile();
	return <h1 className={isMobile ? "text-xl" : "text-3xl"}>Hello</h1>;
}
```
