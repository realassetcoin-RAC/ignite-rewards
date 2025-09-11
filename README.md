# RAC Rewards Platform

This repository contains the RAC Rewards web app and backend schema: loyalty dashboards, Admin panel, Contact system, DAO governance, Marketplace, and Solana rewards integrations.

## Quick Start

1) Install dependencies
```bash
npm install
```

2) Configure Supabase env (create `.env` in project root)
```bash
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3) Apply database migrations (recommended)
Use your preferred workflow to apply SQL files in `supabase/migrations/` to your Supabase project (order by filename).

4) Run the app
```bash
npm run dev
```

## Feature Matrix

- Auth and roles: Supabase auth, robust admin checks
- Admin Panel: virtual cards, merchants, referrals, rewards, marketplace, users, health, errors, settings
- Contact System: AI chatbot + email, tickets, attachments, categories/tags, Slack notifications
- DAO Governance: org, members, proposals, votes; create draft proposals from UI
- Marketplace: listings (draft/live), investments aggregation, NFT card tiers
- Analytics: revenue (date range), all‑time revenue, top merchants, platform metrics
- Solana: wallet management, rewards tracking, vesting (DB-backed), claim flow (stubbed on-chain)

## Migrations Provided

- 2025090901_contact_system.sql: Contact tickets, chatbot, Slack settings, RPC
- 2025090902_dao.sql: DAO org/members/proposals/votes, change requests
- 2025090903_marketplace.sql: listings, investments, distributions, earnings, NFT tiers
- 2025090904_rewards.sql: rewards_config, config_proposals, anonymous_users
- 2025090905_admin_helpers.sql: helper RPCs (is_admin, check_admin_access, get_current_user_profile)
- 2025090906_solana_rewards_wallets.sql: user_wallets, user_rewards, earnings, history, vesting

Apply these in order. Ensure RLS policies match your environment.

## Notes

- Slack webhooks: populate `slack_integration_settings` with category and webhook_url.
- Storage: create `contact-attachments` bucket if you plan to upload files from the Contact chatbot.
