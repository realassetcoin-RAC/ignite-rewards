-- Loyalty NFT System Schema (Custodial & Non-Custodial)
-- This schema supports the new loyalty NFT requirements with custodial and non-custodial recognition

-- Table for NFT Collections
CREATE TABLE IF NOT EXISTS nft_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    contract_address VARCHAR(42), -- Smart contract address for this collection
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for NFT Types (based on spreadsheet data)
CREATE TABLE IF NOT EXISTS nft_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES nft_collections(id) ON DELETE CASCADE,
    nft_name VARCHAR(100) NOT NULL, -- Pearl White, Lava Orange, etc.
    display_name VARCHAR(150) NOT NULL,
    buy_price_usdt DECIMAL(10,2) NOT NULL DEFAULT 0,
    rarity VARCHAR(50) NOT NULL, -- Common, Less Common, Rare, Very Rare
    mint_quantity INTEGER NOT NULL DEFAULT 0,
    is_upgradeable BOOLEAN DEFAULT false,
    is_evolvable BOOLEAN DEFAULT true,
    is_fractional_eligible BOOLEAN DEFAULT true,
    auto_staking_duration VARCHAR(20) DEFAULT 'Forever', -- Forever, 30 days, etc.
    earn_on_spend_ratio DECIMAL(5,4) NOT NULL DEFAULT 0.0100, -- 1.00% = 0.0100
    upgrade_bonus_ratio DECIMAL(5,4) DEFAULT 0.0000, -- Only for custodial upgraded NFTs
    evolution_min_investment DECIMAL(10,2) DEFAULT 0,
    evolution_earnings_ratio DECIMAL(5,4) DEFAULT 0.0000,
    is_custodial BOOLEAN NOT NULL, -- true for custodial, false for non-custodial
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, nft_name, is_custodial)
);

-- Table for User NFT Ownership (Custodial)
CREATE TABLE IF NOT EXISTS user_custodial_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES nft_types(id) ON DELETE CASCADE,
    token_id VARCHAR(100), -- NFT token ID from smart contract
    is_upgraded BOOLEAN DEFAULT false,
    is_evolved BOOLEAN DEFAULT false,
    evolved_token_id VARCHAR(100), -- Token ID of evolved 3D NFT
    current_investment DECIMAL(15,2) DEFAULT 0, -- Current investment for evolution eligibility
    auto_staking_enabled BOOLEAN DEFAULT false,
    auto_staking_asset_id UUID, -- Reference to tokenized asset for auto-staking
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    upgraded_at TIMESTAMP WITH TIME ZONE,
    evolved_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- Each user can only hold one loyalty NFT
);

-- Table for Non-Custodial NFT Tracking (for analytics and verification)
CREATE TABLE IF NOT EXISTS user_non_custodial_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) NOT NULL,
    nft_type_id UUID NOT NULL REFERENCES nft_types(id) ON DELETE CASCADE,
    token_id VARCHAR(100) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token_id, contract_address)
);

-- Table for NFT Evolution History
CREATE TABLE IF NOT EXISTS nft_evolution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_nft_type_id UUID NOT NULL REFERENCES nft_types(id) ON DELETE CASCADE,
    evolved_nft_type_id UUID NOT NULL REFERENCES nft_types(id) ON DELETE CASCADE,
    original_token_id VARCHAR(100),
    evolved_token_id VARCHAR(100),
    investment_amount DECIMAL(15,2) NOT NULL,
    evolution_triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Table for NFT Upgrade History
CREATE TABLE IF NOT EXISTS nft_upgrade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES nft_types(id) ON DELETE CASCADE,
    original_earn_ratio DECIMAL(5,4) NOT NULL,
    new_earn_ratio DECIMAL(5,4) NOT NULL,
    upgrade_bonus_ratio DECIMAL(5,4) NOT NULL,
    upgraded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Table for Auto-Staking Configurations
CREATE TABLE IF NOT EXISTS nft_auto_staking_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nft_id UUID NOT NULL REFERENCES user_custodial_nfts(id) ON DELETE CASCADE,
    tokenized_asset_id UUID NOT NULL, -- Reference to marketplace asset
    auto_staking_enabled BOOLEAN DEFAULT false,
    staking_percentage DECIMAL(5,2) DEFAULT 100.00, -- Percentage of rewards to auto-stake
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, nft_id)
);

-- Table for Fractional Investment Eligibility
CREATE TABLE IF NOT EXISTS nft_fractional_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nft_type_id UUID NOT NULL REFERENCES nft_types(id) ON DELETE CASCADE,
    tokenized_asset_id UUID NOT NULL, -- Reference to marketplace asset
    investment_amount DECIMAL(15,2) NOT NULL,
    fractional_shares DECIMAL(18,8) NOT NULL,
    investment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Table for NFT Parameter Changes (DAO Governance)
CREATE TABLE IF NOT EXISTS nft_parameter_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_type_id UUID NOT NULL REFERENCES nft_types(id) ON DELETE CASCADE,
    parameter_name VARCHAR(100) NOT NULL, -- earn_on_spend_ratio, evolution_min_investment, etc.
    old_value TEXT NOT NULL,
    new_value TEXT NOT NULL,
    change_reason TEXT,
    proposed_by UUID NOT NULL REFERENCES auth.users(id),
    dao_proposal_id UUID, -- Reference to DAO proposal
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, implemented
    approved_at TIMESTAMP WITH TIME ZONE,
    implemented_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for NFT Minting Control
CREATE TABLE IF NOT EXISTS nft_minting_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_type_id UUID NOT NULL REFERENCES nft_types(id) ON DELETE CASCADE,
    minting_enabled BOOLEAN DEFAULT true,
    total_minted INTEGER DEFAULT 0,
    max_mintable INTEGER NOT NULL,
    minting_paused_reason TEXT,
    paused_by UUID REFERENCES auth.users(id),
    paused_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nft_type_id)
);

-- Table for NFT Metadata and 3D Assets
CREATE TABLE IF NOT EXISTS nft_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_type_id UUID NOT NULL REFERENCES nft_types(id) ON DELETE CASCADE,
    metadata_type VARCHAR(50) NOT NULL, -- base, evolved, 3d
    metadata_uri TEXT NOT NULL,
    image_uri TEXT,
    animation_uri TEXT,
    attributes JSONB, -- NFT attributes and traits
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nft_types_collection ON nft_types(collection_id);
CREATE INDEX IF NOT EXISTS idx_nft_types_custodial ON nft_types(is_custodial);
CREATE INDEX IF NOT EXISTS idx_nft_types_rarity ON nft_types(rarity);
CREATE INDEX IF NOT EXISTS idx_user_custodial_nfts_user ON user_custodial_nfts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custodial_nfts_type ON user_custodial_nfts(nft_type_id);
CREATE INDEX IF NOT EXISTS idx_user_non_custodial_nfts_user ON user_non_custodial_nfts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_non_custodial_nfts_wallet ON user_non_custodial_nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nft_evolution_history_user ON nft_evolution_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_upgrade_history_user ON nft_upgrade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_parameter_changes_nft_type ON nft_parameter_changes(nft_type_id);
CREATE INDEX IF NOT EXISTS idx_nft_parameter_changes_status ON nft_parameter_changes(status);

-- Row Level Security (RLS) Policies
ALTER TABLE nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custodial_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_non_custodial_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_evolution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_upgrade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_auto_staking_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_fractional_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_parameter_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_minting_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nft_collections (public read, admin write)
CREATE POLICY "Anyone can view active collections" ON nft_collections
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage collections" ON nft_collections
    FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for nft_types (public read, admin write)
CREATE POLICY "Anyone can view active NFT types" ON nft_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage NFT types" ON nft_types
    FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for user_custodial_nfts
CREATE POLICY "Users can view their own custodial NFTs" ON user_custodial_nfts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own custodial NFTs" ON user_custodial_nfts
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can view all custodial NFTs" ON user_custodial_nfts
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for user_non_custodial_nfts
CREATE POLICY "Users can view their own non-custodial NFTs" ON user_non_custodial_nfts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own non-custodial NFTs" ON user_non_custodial_nfts
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for other tables
CREATE POLICY "Users can view their own evolution history" ON nft_evolution_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own upgrade history" ON nft_upgrade_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own auto-staking configs" ON nft_auto_staking_configs
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their own fractional investments" ON nft_fractional_investments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Anyone can view parameter changes" ON nft_parameter_changes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage parameter changes" ON nft_parameter_changes
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view minting control" ON nft_minting_control
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage minting control" ON nft_minting_control
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view NFT metadata" ON nft_metadata
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage NFT metadata" ON nft_metadata
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_nft_collections_updated_at 
    BEFORE UPDATE ON nft_collections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nft_types_updated_at 
    BEFORE UPDATE ON nft_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_custodial_nfts_updated_at 
    BEFORE UPDATE ON user_custodial_nfts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_non_custodial_nfts_updated_at 
    BEFORE UPDATE ON user_non_custodial_nfts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nft_auto_staking_configs_updated_at 
    BEFORE UPDATE ON nft_auto_staking_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nft_minting_control_updated_at 
    BEFORE UPDATE ON nft_minting_control 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default collection
INSERT INTO nft_collections (collection_name, display_name, description) VALUES
('classic', 'Classic Collection', 'The original loyalty NFT collection featuring various rarity levels and benefits')
ON CONFLICT (collection_name) DO NOTHING;

-- Insert Custodial NFT Types (based on spreadsheet data)
INSERT INTO nft_types (
    collection_id, nft_name, display_name, buy_price_usdt, rarity, mint_quantity,
    is_upgradeable, is_evolvable, is_fractional_eligible, auto_staking_duration,
    earn_on_spend_ratio, upgrade_bonus_ratio, evolution_min_investment, evolution_earnings_ratio,
    is_custodial
) VALUES
-- Custodial NFTs
((SELECT id FROM nft_collections WHERE collection_name = 'classic'), 'Pearl White', 'Pearl White', 0, 'Common', 10000, true, true, true, 'Forever', 0.0100, 0.0000, 100, 0.0025, true),
((SELECT id FROM nft_collections WHERE collection_name = 'classic'), 'Lava Orange', 'Lava Orange', 100, 'Less Common', 3000, true, true, true, 'Forever', 0.0110, 0.0010, 500, 0.0050, true),
((SELECT id FROM nft_collections WHERE collection_name = 'classic'), 'Pink', 'Pink', 100, 'Less Common', 3000, true, true, true, 'Forever', 0.0110, 0.0010, 500, 0.0050, true),
((SELECT id FROM nft_collections WHERE collection_name = 'classic'), 'Silver', 'Silver', 200, 'Rare', 750, true, true, true, 'Forever', 0.0120, 0.0015, 1000, 0.0075, true),
((SELECT id FROM nft_collections WHERE collection_name = 'classic'), 'Gold', 'Gold', 300, 'Rare', 750, true, true, true, 'Forever', 0.0130, 0.0020, 1500, 0.0100, true),
((SELECT id FROM nft_collections WHERE collection_name = 'classic'), 'Black', 'Black', 500, 'Very Rare', 250, true, true, true, 'Forever', 0.0140, 0.0030, 2500, 0.0125, true),

-- Non-Custodial NFTs
((SELECT id FROM nft_collections WHERE collection_name = 'classic'), 'Pearl White', 'Pearl White', 100, 'Common', 10000, false, true, true, 'Forever', 0.0100, 0.0000, 500, 0.0050, false),
((SELECT id FROM nft_collections WHERE collection_name = 'classic'), 'Lava Orange', 'Lava Orange', 500, 'Less Common', 3000, false, true, true, 'Forever', 0.0110, 0.0000, 2500, 0.0125, false),
((SELECT id FROM nft_collections WHERE collection_name = 'classic'), 'Pink', 'Pink', 500, 'Less Common', 3000, false, true, true, 'Forever', 0.0110, 0.0000, 2500, 0.0125, false),
((SELECT id FROM nft_collections WHERE collection_name = 'classic'), 'Silver', 'Silver', 1000, 'Rare', 750, false, true, true, 'Forever', 0.0120, 0.0000, 5000, 0.0015, false),
((SELECT id FROM nft_collections WHERE collection_name = 'classic'), 'Gold', 'Gold', 1000, 'Rare', 750, false, true, true, 'Forever', 0.0130, 0.0000, 5000, 0.0020, false),
((SELECT id FROM nft_collections WHERE collection_name = 'classic'), 'Black', 'Black', 2500, 'Very Rare', 250, false, true, true, 'Forever', 0.0140, 0.0000, 12500, 0.0030, false)
ON CONFLICT (collection_id, nft_name, is_custodial) DO NOTHING;

-- Insert minting control for each NFT type
INSERT INTO nft_minting_control (nft_type_id, max_mintable, minting_enabled)
SELECT id, mint_quantity, true FROM nft_types
ON CONFLICT (nft_type_id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
