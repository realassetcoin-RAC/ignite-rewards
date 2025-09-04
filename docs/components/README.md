# Components

## QrCodeGenerator
Generates a transaction QR code for a merchant and provides download/copy actions.

- **Import**: `import { QrCodeGenerator } from "@/components/QrCodeGenerator"`
- **Props**:
  - `merchantId: string`
  - `onClose: () => void`
  - `onTransactionCreated: () => void`

```tsx
<QrCodeGenerator
	merchantId={merchant.id}
	onClose={() => setOpen(false)}
	onTransactionCreated={() => refetchTransactions()}
/>
```

### Behavior
- Persists QR metadata in `transaction_qr_codes` via Supabase, expires in 24h.
- Renders generated PNG data URL; offers download and clipboard copy.

## VirtualLoyaltyCard
Displays or creates the current user’s loyalty card.

- **Import**: `import { VirtualLoyaltyCard } from "@/components/VirtualLoyaltyCard"`
- **Props**: none

```tsx
<VirtualLoyaltyCard />
```

### Behavior
- Loads card from `user_loyalty_cards` for the signed-in user.
- Creates a new card using RPC `generate_loyalty_number` and inserts the row.

## Toaster
Container for rendering toast notifications from `useToast`.

- **Import**: `import { Toaster } from "@/components/ui/toaster"`
- **Usage**: Place once near app root.

```tsx
export function App() {
	return (
		<>
			{/* ...routes */}
			<Toaster />
		</>
	);
}
```

## SignupSection
Landing page section that opens customer and merchant signup modals.

- **Import**: `import SignupSection from "@/components/SignupSection"`
- **Props**: none

```tsx
<SignupSection />
```

### Notes
- Internally manages modal state for `CustomerSignupModal` and `MerchantSignupModal`.
