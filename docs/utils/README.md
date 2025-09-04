# Utils & Validation

## `cn(...classNames)`
Tailwind-friendly className combiner. Merges conditional classes and resolves conflicts using `tailwind-merge`.

- **Signature**: `cn(...inputs: ClassValue[]): string`

```tsx
import { cn } from "@/lib/utils";

function Button({ primary }: { primary?: boolean }) {
	return (
		<button
			className={cn(
				"px-3 py-2 rounded",
				primary ? "bg-primary text-white" : "bg-secondary text-foreground"
			)}
		>
			Click
		</button>
	);
}
```

## Validation Schemas (zod)
From `@/utils/validation`.

### `emailSchema`
- `z.string().email()`

### `uuidSchema`
- `z.string().uuid()`

### `virtualCardSchema`
Fields: `card_name`, `card_type`, `description?`, `image_url?`, `subscription_plan?`, `pricing_type` (`free|one_time|monthly|annual`), `one_time_fee?`, `monthly_fee?`, `annual_fee?`, `features?`, `is_active?`.

### `merchantSchema`
Fields: `business_name`, `business_type?`, `contact_email?`, `phone?`, `address?`, `city?`, `country?`, `subscription_plan?`, `status?` (`pending|active|suspended|inactive`), `monthly_fee?`, `annual_fee?`.

### Usage Example
```ts
import { merchantSchema, sanitizeNumber, sanitizeString } from "@/utils/validation";

const form = {
	business_name: sanitizeString(input.name),
	monthly_fee: sanitizeNumber(input.monthly_fee),
};

const parsed = merchantSchema.parse(form);
```

## Sanitizers
### `sanitizeString(input: string): string`
- Trims and strips `<` and `>`.

### `sanitizeNumber(input: number): number`
- Clamps to >= 0 and rounds to 2 decimals.

## Rate Limiting (client-side)
### `checkRateLimit(key: string, maxRequests = 10, windowMs = 60000): boolean`
- Returns false if the key exceeded the limit within the window.

## Error Message Sanitization
### `sanitizeErrorMessage(error: unknown): string`
- Masks UUID-like ids and returns a generic fallback for non-Errors.
