-- =====================================================
-- LOYALTY APPLICATION DAO INTEGRATION SCHEMA
-- Tracks changes to loyalty application that require DAO approval
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Change request types
CREATE TYPE change_request_type AS ENUM (
    'loyalty_rule_change',
    'reward_structure_change',
    'merchant_settings_change',
    'platform_config_change',
    'user_interface_change',
    'security_policy_change',
    'data_handling_change'
);

-- Impact levels
CREATE TYPE impact_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- Change request status
CREATE TYPE change_request_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'implemented',
    'rolled_back'
);

-- =====================================================
-- LOYALTY CHANGE REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS loyalty_change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type change_request_type NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    detailed_description TEXT,
    
    -- Change details
    affected_components TEXT[] NOT NULL, -- Array of affected system components
    impact_level impact_level NOT NULL,
    requires_dao_approval BOOLEAN DEFAULT true,
    
    -- Current vs proposed values
    current_value JSONB, -- Current configuration/behavior
    proposed_value JSONB, -- Proposed new configuration/behavior
    change_summary TEXT, -- Human-readable summary of the change
    
    -- DAO integration
    dao_proposal_id UUID REFERENCES dao_proposals(id) ON DELETE SET NULL,
    dao_vote_result VARCHAR(20), -- 'passed', 'rejected', 'pending'
    dao_vote_percentage DECIMAL(5,2), -- Percentage of yes votes
    
    -- Implementation tracking
    implementation_notes TEXT,
    rollback_plan TEXT,
    testing_requirements TEXT,
    
    -- Status and timestamps
    status change_request_status DEFAULT 'pending',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    implemented_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    implemented_at TIMESTAMP WITH TIME ZONE,
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    tags TEXT[],
    external_references JSONB, -- Links to documentation, tickets, etc.
    risk_assessment JSONB -- Risk analysis data
);

-- =====================================================
-- LOYALTY CONFIGURATION SNAPSHOTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS loyalty_config_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_request_id UUID REFERENCES loyalty_change_requests(id) ON DELETE CASCADE,
    component_name VARCHAR(100) NOT NULL,
    configuration_data JSONB NOT NULL,
    snapshot_type VARCHAR(20) DEFAULT 'before', -- 'before', 'after', 'rollback'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LOYALTY CHANGE IMPACT ANALYSIS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS loyalty_change_impact_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_request_id UUID REFERENCES loyalty_change_requests(id) ON DELETE CASCADE,
    
    -- Impact metrics
    affected_users_count INTEGER,
    affected_merchants_count INTEGER,
    affected_transactions_count INTEGER,
    estimated_revenue_impact DECIMAL(15,2),
    estimated_cost_impact DECIMAL(15,2),
    
    -- Risk factors
    security_risk_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    performance_impact VARCHAR(20), -- 'none', 'minimal', 'moderate', 'significant'
    user_experience_impact VARCHAR(20), -- 'positive', 'neutral', 'negative'
    compliance_impact TEXT,
    
    -- Analysis metadata
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    analysis_notes TEXT
);

-- =====================================================
-- LOYALTY CHANGE APPROVAL WORKFLOW TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS loyalty_change_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_request_id UUID REFERENCES loyalty_change_requests(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    approval_type VARCHAR(20) NOT NULL, -- 'dao_vote', 'admin_approval', 'technical_review'
    decision VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'conditional'
    comments TEXT,
    conditions TEXT, -- Any conditions for conditional approval
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LOYALTY CHANGE IMPLEMENTATION LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS loyalty_change_implementation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_request_id UUID REFERENCES loyalty_change_requests(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    step_description TEXT,
    status VARCHAR(20) NOT NULL, -- 'pending', 'in_progress', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    rollback_required BOOLEAN DEFAULT false,
    implemented_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Change requests indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_change_requests_type ON loyalty_change_requests(type);
CREATE INDEX IF NOT EXISTS idx_loyalty_change_requests_status ON loyalty_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_change_requests_impact_level ON loyalty_change_requests(impact_level);
CREATE INDEX IF NOT EXISTS idx_loyalty_change_requests_created_by ON loyalty_change_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_loyalty_change_requests_created_at ON loyalty_change_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_change_requests_dao_proposal ON loyalty_change_requests(dao_proposal_id);

-- Configuration snapshots indexes
CREATE INDEX IF NOT EXISTS idx_config_snapshots_change_request ON loyalty_config_snapshots(change_request_id);
CREATE INDEX IF NOT EXISTS idx_config_snapshots_component ON loyalty_config_snapshots(component_name);
CREATE INDEX IF NOT EXISTS idx_config_snapshots_type ON loyalty_config_snapshots(snapshot_type);

-- Impact analysis indexes
CREATE INDEX IF NOT EXISTS idx_impact_analysis_change_request ON loyalty_change_impact_analysis(change_request_id);
CREATE INDEX IF NOT EXISTS idx_impact_analysis_date ON loyalty_change_impact_analysis(analysis_date);

-- Approval workflow indexes
CREATE INDEX IF NOT EXISTS idx_approvals_change_request ON loyalty_change_approvals(change_request_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON loyalty_change_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_decision ON loyalty_change_approvals(decision);

-- Implementation log indexes
CREATE INDEX IF NOT EXISTS idx_implementation_log_change_request ON loyalty_change_implementation_log(change_request_id);
CREATE INDEX IF NOT EXISTS idx_implementation_log_status ON loyalty_change_implementation_log(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE loyalty_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_config_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_change_impact_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_change_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_change_implementation_log ENABLE ROW LEVEL SECURITY;

-- Change requests policies
CREATE POLICY "Anyone can view change requests" ON loyalty_change_requests
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create change requests" ON loyalty_change_requests
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Change request creators can update their requests" ON loyalty_change_requests
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can update any change request" ON loyalty_change_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'founder')
        )
    );

-- Configuration snapshots policies
CREATE POLICY "Anyone can view configuration snapshots" ON loyalty_config_snapshots
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create snapshots" ON loyalty_config_snapshots
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Impact analysis policies
CREATE POLICY "Anyone can view impact analysis" ON loyalty_change_impact_analysis
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create impact analysis" ON loyalty_change_impact_analysis
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Approval workflow policies
CREATE POLICY "Anyone can view approvals" ON loyalty_change_approvals
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create approvals" ON loyalty_change_approvals
    FOR INSERT WITH CHECK (auth.uid() = approver_id);

-- Implementation log policies
CREATE POLICY "Anyone can view implementation log" ON loyalty_change_implementation_log
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create implementation log entries" ON loyalty_change_implementation_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically create DAO proposal for high-impact changes
CREATE OR REPLACE FUNCTION auto_create_dao_proposal_for_change()
RETURNS TRIGGER AS $$
DECLARE
    dao_id UUID;
    proposer_membership RECORD;
    proposal_id UUID;
BEGIN
    -- Only create proposal for high/critical impact changes that require DAO approval
    IF NEW.impact_level IN ('high', 'critical') AND NEW.requires_dao_approval = true THEN
        
        -- Get the first active DAO (in a real system, you might want to specify which DAO)
        SELECT id INTO dao_id FROM dao_organizations WHERE is_active = true LIMIT 1;
        
        IF dao_id IS NOT NULL THEN
            -- Check if the creator is a DAO member
            SELECT * INTO proposer_membership 
            FROM dao_members 
            WHERE dao_id = dao_id 
            AND user_id = NEW.created_by 
            AND is_active = true;
            
            IF proposer_membership IS NOT NULL THEN
                -- Create DAO proposal
                INSERT INTO dao_proposals (
                    dao_id,
                    proposer_id,
                    title,
                    description,
                    full_description,
                    category,
                    voting_type,
                    status,
                    treasury_impact_amount,
                    treasury_impact_currency,
                    tags,
                    external_links
                ) VALUES (
                    dao_id,
                    NEW.created_by,
                    NEW.title,
                    NEW.description,
                    COALESCE(NEW.detailed_description, NEW.description),
                    'governance',
                    CASE 
                        WHEN NEW.impact_level = 'critical' THEN 'super_majority'
                        ELSE 'simple_majority'
                    END,
                    'draft',
                    0,
                    'SOL',
                    ARRAY[NEW.type::text, 'impact-' || NEW.impact_level::text, 'loyalty-change'],
                    jsonb_build_object(
                        'change_request_id', NEW.id,
                        'change_type', NEW.type,
                        'impact_level', NEW.impact_level,
                        'affected_components', NEW.affected_components
                    )
                ) RETURNING id INTO proposal_id;
                
                -- Update the change request with the proposal ID
                NEW.dao_proposal_id = proposal_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create DAO proposals
CREATE TRIGGER auto_create_dao_proposal_trigger
    AFTER INSERT ON loyalty_change_requests
    FOR EACH ROW EXECUTE FUNCTION auto_create_dao_proposal_for_change();

-- Function to update change request status when DAO proposal status changes
CREATE OR REPLACE FUNCTION update_change_request_from_dao_proposal()
RETURNS TRIGGER AS $$
BEGIN
    -- Update change request when DAO proposal status changes
    IF OLD.status != NEW.status THEN
        UPDATE loyalty_change_requests
        SET 
            status = CASE 
                WHEN NEW.status = 'passed' THEN 'approved'
                WHEN NEW.status = 'rejected' THEN 'rejected'
                ELSE 'pending'
            END,
            dao_vote_result = CASE 
                WHEN NEW.status = 'passed' THEN 'passed'
                WHEN NEW.status = 'rejected' THEN 'rejected'
                ELSE 'pending'
            END,
            dao_vote_percentage = CASE 
                WHEN NEW.total_votes > 0 THEN (NEW.yes_votes::DECIMAL / NEW.total_votes::DECIMAL) * 100
                ELSE 0
            END,
            approved_at = CASE 
                WHEN NEW.status = 'passed' THEN NOW()
                ELSE NULL
            END,
            rejected_at = CASE 
                WHEN NEW.status = 'rejected' THEN NOW()
                ELSE NULL
            END
        WHERE dao_proposal_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update change requests when DAO proposals change
CREATE TRIGGER update_change_request_from_dao_trigger
    AFTER UPDATE ON dao_proposals
    FOR EACH ROW EXECUTE FUNCTION update_change_request_from_dao_proposal();

-- Function to create configuration snapshot
CREATE OR REPLACE FUNCTION create_config_snapshot(
    p_change_request_id UUID,
    p_component_name VARCHAR(100),
    p_config_data JSONB,
    p_snapshot_type VARCHAR(20) DEFAULT 'before'
)
RETURNS UUID AS $$
DECLARE
    snapshot_id UUID;
BEGIN
    INSERT INTO loyalty_config_snapshots (
        change_request_id,
        component_name,
        configuration_data,
        snapshot_type
    ) VALUES (
        p_change_request_id,
        p_component_name,
        p_config_data,
        p_snapshot_type
    ) RETURNING id INTO snapshot_id;
    
    RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if change requires DAO approval
CREATE OR REPLACE FUNCTION requires_dao_approval(
    p_change_type change_request_type,
    p_impact_level impact_level
) RETURNS BOOLEAN AS $$
BEGIN
    -- Critical changes always require DAO approval
    IF p_impact_level = 'critical' THEN
        RETURN true;
    END IF;
    
    -- High impact changes require DAO approval
    IF p_impact_level = 'high' THEN
        RETURN true;
    END IF;
    
    -- Medium impact changes for certain types require DAO approval
    IF p_impact_level = 'medium' THEN
        RETURN p_change_type IN (
            'loyalty_rule_change',
            'reward_structure_change',
            'platform_config_change',
            'security_policy_change'
        );
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for pending changes requiring DAO approval
CREATE OR REPLACE VIEW pending_dao_changes AS
SELECT 
    lcr.*,
    dp.title as dao_proposal_title,
    dp.status as dao_proposal_status,
    dp.total_votes as dao_total_votes,
    dp.yes_votes as dao_yes_votes,
    dp.no_votes as dao_no_votes,
    dp.participation_rate as dao_participation_rate,
    u.email as created_by_email,
    u.full_name as created_by_name
FROM loyalty_change_requests lcr
LEFT JOIN dao_proposals dp ON lcr.dao_proposal_id = dp.id
LEFT JOIN auth.users u ON lcr.created_by = u.id
WHERE lcr.status = 'pending' 
AND lcr.requires_dao_approval = true
ORDER BY lcr.created_at DESC;

-- View for change request statistics
CREATE OR REPLACE VIEW change_request_stats AS
SELECT 
    type,
    impact_level,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (COALESCE(approved_at, rejected_at, implemented_at) - created_at))/86400) as avg_processing_days
FROM loyalty_change_requests
GROUP BY type, impact_level, status;

-- View for DAO integration summary
CREATE OR REPLACE VIEW dao_integration_summary AS
SELECT 
    COUNT(*) as total_change_requests,
    COUNT(CASE WHEN requires_dao_approval THEN 1 END) as requires_dao_approval_count,
    COUNT(CASE WHEN dao_proposal_id IS NOT NULL THEN 1 END) as has_dao_proposal_count,
    COUNT(CASE WHEN status = 'approved' AND dao_proposal_id IS NOT NULL THEN 1 END) as dao_approved_count,
    COUNT(CASE WHEN status = 'rejected' AND dao_proposal_id IS NOT NULL THEN 1 END) as dao_rejected_count,
    AVG(dao_vote_percentage) as avg_dao_vote_percentage
FROM loyalty_change_requests;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample change requests
INSERT INTO loyalty_change_requests (
    type,
    title,
    description,
    affected_components,
    impact_level,
    requires_dao_approval,
    current_value,
    proposed_value,
    created_by,
    tags
) VALUES 
(
    'loyalty_rule_change',
    'Increase loyalty point multiplier from 1x to 1.2x',
    'Proposal to increase the loyalty point multiplier for all merchants to boost customer engagement',
    ARRAY['reward_calculation', 'merchant_dashboard', 'user_dashboard'],
    'high',
    true,
    '{"multiplier": 1.0}',
    '{"multiplier": 1.2}',
    (SELECT id FROM auth.users LIMIT 1),
    ARRAY['loyalty', 'rewards', 'multiplier', 'engagement']
),
(
    'reward_structure_change',
    'Add Solana USDC as payment option',
    'Enable USDC payments on Solana blockchain for loyalty transactions',
    ARRAY['payment_processing', 'wallet_integration', 'transaction_handling'],
    'medium',
    true,
    '{"supported_currencies": ["SOL"]}',
    '{"supported_currencies": ["SOL", "USDC"]}',
    (SELECT id FROM auth.users LIMIT 1),
    ARRAY['solana', 'usdc', 'payments', 'blockchain']
);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Loyalty DAO Integration Schema Created Successfully!';
    RAISE NOTICE '📊 Tables Created: 5';
    RAISE NOTICE '🔐 RLS Policies: Enabled';
    RAISE NOTICE '⚡ Functions: 4';
    RAISE NOTICE '🎯 Triggers: 2';
    RAISE NOTICE '📈 Views: 3';
    RAISE NOTICE '🚀 Ready for Loyalty-DAO Integration!';
END $$;
