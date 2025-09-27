import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getSolanaNFTService } from '@/lib/solanaNFTService';
import { 
  Link, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Database,
  Zap,
  Shield
} from 'lucide-react';

interface SmartContract {
  id: string;
  contract_name: string;
  contract_address: string;
  network: string;
  contract_type: string;
  is_active: boolean;
  created_at: string;
}

interface BlockchainTransaction {
  id: string;
  transaction_hash: string;
  transaction_type: string;
  status: string;
  network: string;
  created_at: string;
}

interface SmartContractIntegrationProps {
  userId: string;
  onContractSync?: (contractName: string) => void;
}

export const SmartContractIntegration: React.FC<SmartContractIntegrationProps> = ({
  userId,
  onContractSync
}) => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [solanaService] = useState(() => getSolanaNFTService());

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadContracts(),
        loadTransactions()
      ]);
    } catch (error) {
      console.error('Error loading smart contract data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load smart contract information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async () => {
    const { data, error } = await supabase
      .from('smart_contracts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    setContracts(data || []);
  };

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('blockchain_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    setTransactions(data || []);
  };

  const syncContractToBlockchain = async (contract: SmartContract) => {
    setSyncing(contract.contract_name);
    
    try {
      let result;
      
      if (contract.contract_type === 'nft') {
        // Get NFT data from database
        const { data: nftData, error: nftError } = await supabase
          .from('nft_types')
          .select('*')
          .eq('name', contract.contract_name.replace('_contract', ''))
          .single();

        if (nftError || !nftData) {
          throw new Error('NFT data not found in database');
        }

        // Convert to Solana format and sync
        const solanaParams = solanaService.convertDatabaseToSolana(nftData);
        result = await solanaService.createNFT(solanaParams);
      } else {
        // For other contract types, use generic sync
        result = await solanaService.syncNFTToDatabase(contract.contract_name, 'SYMBOL');
      }

      if (result) {
        // Record the blockchain transaction
        await supabase
          .from('blockchain_transactions')
          .insert({
            user_id: userId,
            contract_id: contract.id,
            transaction_hash: result,
            transaction_type: 'contract_sync',
            status: 'confirmed',
            network: contract.network
          });

        toast({
          title: "Contract Synced Successfully",
          description: `${contract.contract_name} has been synced to the blockchain.`,
          variant: "default"
        });

        onContractSync?.(contract.contract_name);
        loadTransactions(); // Refresh transactions
      }

    } catch (error) {
      console.error('Contract sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : 'Failed to sync contract to blockchain.',
        variant: "destructive"
      });
    } finally {
      setSyncing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContractTypeIcon = (type: string) => {
    switch (type) {
      case 'nft':
        return '🎨';
      case 'token':
        return '🪙';
      case 'dao':
        return '🏛️';
      case 'staking':
        return '💰';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Loading smart contract data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Smart Contracts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Smart Contracts
          </CardTitle>
          <CardDescription>
            Manage and sync your smart contracts with the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No smart contracts configured</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getContractTypeIcon(contract.contract_type)}
                    </div>
                    <div>
                      <div className="font-medium">{contract.contract_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {contract.contract_address.slice(0, 8)}...{contract.contract_address.slice(-8)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {contract.network}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {contract.contract_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => syncContractToBlockchain(contract)}
                      disabled={syncing === contract.contract_name}
                      size="sm"
                      variant="outline"
                    >
                      {syncing === contract.contract_name ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Sync
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => window.open(`https://explorer.solana.com/address/${contract.contract_address}`, '_blank')}
                      size="sm"
                      variant="ghost"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Recent Blockchain Transactions
          </CardTitle>
          <CardDescription>
            Your recent blockchain interactions and contract deployments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No blockchain transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {tx.status === 'confirmed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : tx.status === 'pending' ? (
                        <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {tx.transaction_type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {tx.transaction_hash.slice(0, 12)}...{tx.transaction_hash.slice(-12)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(tx.status)}>
                      {tx.status}
                    </Badge>
                    <Button
                      onClick={() => window.open(`https://explorer.solana.com/tx/${tx.transaction_hash}`, '_blank')}
                      size="sm"
                      variant="ghost"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium text-green-800">Database</div>
              <div className="text-sm text-green-600">Connected</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="font-medium text-yellow-800">Blockchain</div>
              <div className="text-sm text-yellow-600">Mock Mode</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium text-blue-800">Security</div>
              <div className="text-sm text-blue-600">Active</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              <strong>Note:</strong> Smart contract integration is currently running in mock mode. 
              Install @solana/web3.js and @coral-xyz/anchor packages for full blockchain functionality.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
