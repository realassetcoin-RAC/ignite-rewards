import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Plus, RefreshCw, User, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LoyaltyCard {
  id: string;
  loyalty_number: string;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export const VirtualLoyaltyCard: React.FC = () => {
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadLoyaltyCard();
  }, []);

  const loadLoyaltyCard = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to load from user_loyalty_cards with multiple schema attempts
      let loyaltyData = null;
      let loadError = null;
      
      // Try public schema first
      try {
        console.log('Loading from public.user_loyalty_cards...');
        const { data, error } = await supabase
          .schema('public')
          .from('user_loyalty_cards')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        loyaltyData = data;
        console.log('Loaded from public schema:', data);
      } catch (publicError) {
        console.warn('Public schema load failed:', publicError);
        loadError = publicError;
        
        // Fallback to default schema
        try {
          console.log('Loading from default user_loyalty_cards...');
          const { data, error } = await supabase
            .from('user_loyalty_cards')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          
          loyaltyData = data;
          console.log('Loaded from default schema:', data);
        } catch (defaultError) {
          console.error('Default schema load also failed:', defaultError);
          loadError = defaultError;
        }
      }
      
      // Only show error if it's not a "no rows" error and we couldn't load from either schema
      if (loadError && loadError.code !== 'PGRST116') {
        console.error('Error loading loyalty card:', loadError);
        toast({
          title: "Error",
          description: "Failed to load loyalty card.",
          variant: "destructive",
        });
        return;
      }

      setLoyaltyCard(loyaltyData);
    } catch (error) {
      console.error('Error loading loyalty card:', error);
      toast({
        title: "Error",
        description: "Failed to load loyalty card.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLoyaltyCard = async () => {
    if (!formData.full_name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to create a virtual card.",
          variant: "destructive",
        });
        return;
      }

      // Generate loyalty number using the database function with multiple fallbacks
      let loyaltyNumber;
      
      // Try multiple approaches to generate loyalty number
      const generateLoyaltyNumber = async () => {
        const attempts = [
          // Attempt 1: api.generate_loyalty_number with email
          () => supabase.rpc('generate_loyalty_number', { user_email: user.email || '' }),
          // Attempt 2: public.generate_loyalty_number with email  
          () => supabase.schema('public').rpc('generate_loyalty_number', { user_email: user.email || '' }),
          // Attempt 3: api.generate_loyalty_number without params
          () => supabase.rpc('generate_loyalty_number'),
          // Attempt 4: public.generate_loyalty_number without params
          () => supabase.schema('public').rpc('generate_loyalty_number')
        ];
        
        for (let i = 0; i < attempts.length; i++) {
          try {
            console.log(`Attempting loyalty number generation method ${i + 1}...`);
            const { data: generatedNumber, error: numberError } = await attempts[i]();
            
            if (!numberError && generatedNumber) {
              console.log(`Success with method ${i + 1}, generated:`, generatedNumber);
              return generatedNumber;
            } else if (numberError) {
              console.warn(`Method ${i + 1} failed:`, numberError.message);
            }
          } catch (e) {
            console.warn(`Method ${i + 1} exception:`, e);
          }
        }
        
        // Final fallback: client-side generation
        console.log('All RPC methods failed, using client-side generation');
        const initial = (user.email || 'U').charAt(0).toUpperCase();
        const randomDigits = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        return initial + randomDigits;
      };
      
      loyaltyNumber = await generateLoyaltyNumber();
      console.log('Final loyalty number to use:', loyaltyNumber);

      // Insert into user_loyalty_cards with multiple schema attempts
      console.log('Attempting to insert loyalty card...');
      
      const insertData = {
        user_id: user.id,
        loyalty_number: loyaltyNumber,
        full_name: formData.full_name.trim(),
        email: user.email || '',
        phone: formData.phone.trim() || null,
        is_active: true
      };
      
      let insertResult = null;
      let insertError = null;
      
      // Try public schema first (this is the main table now)
      try {
        console.log('Trying public.user_loyalty_cards...');
        const { data, error } = await supabase
          .schema('public')
          .from('user_loyalty_cards')
          .insert(insertData)
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        insertResult = data;
        console.log('Successfully inserted into public.user_loyalty_cards:', data);
      } catch (publicError) {
        console.warn('Public schema insert failed:', publicError);
        insertError = publicError;
        
        // Fallback to default schema (should resolve to public anyway)
        try {
          console.log('Trying default schema user_loyalty_cards...');
          const { data, error } = await supabase
            .from('user_loyalty_cards')
            .insert(insertData)
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          insertResult = data;
          console.log('Successfully inserted into user_loyalty_cards:', data);
        } catch (defaultError) {
          console.error('Default schema insert also failed:', defaultError);
          throw defaultError;
        }
      }
      
      if (!insertResult) {
        throw new Error('Failed to insert loyalty card record');
      }

      setLoyaltyCard(insertResult);
      setShowCreateDialog(false);
      setFormData({ full_name: '', phone: '' });
      
      toast({
        title: "Success",
        description: "Your virtual loyalty card has been created!",
      });
    } catch (error: any) {
      console.error('Error creating loyalty card:', error);
      
      let errorMessage = 'Failed to create virtual card';
      
      // Provide specific error messages based on common issues
      if (error?.code === 'PGRST301') {
        errorMessage = 'Permission denied. Please check your account permissions.';
      } else if (error?.code === '42501') {
        errorMessage = 'Insufficient permissions to create loyalty card.';
      } else if (error?.code === 'PGRST116') {
        errorMessage = 'Loyalty card table not accessible. Please contact support.';
      } else if (error?.code === '23505') {
        errorMessage = 'A loyalty card already exists for your account.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!loyaltyCard) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle>Create Your Virtual Loyalty Card</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            Get your unique 8-digit loyalty number starting with your initial.
          </p>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Loyalty Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Your Loyalty Card</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <Button
                  onClick={createLoyaltyCard}
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Create Card
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <CreditCard className="w-8 h-8 mr-2" />
          <Badge variant="secondary" className="text-xs">
            {loyaltyCard.is_active ? 'ACTIVE' : 'INACTIVE'}
          </Badge>
        </div>
        <CardTitle className="text-xl">Virtual Loyalty Card</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-sm opacity-90 mb-1">Loyalty Number</div>
          <div className="text-3xl font-bold font-mono tracking-wider">
            {loyaltyCard.loyalty_number}
          </div>
        </div>
        
        <div className="space-y-3 pt-4 border-t border-primary-foreground/20">
          <div className="flex items-center text-sm">
            <User className="w-4 h-4 mr-2 opacity-80" />
            <span>{loyaltyCard.full_name}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Mail className="w-4 h-4 mr-2 opacity-80" />
            <span>{loyaltyCard.email}</span>
          </div>
          
          {loyaltyCard.phone && (
            <div className="flex items-center text-sm">
              <Phone className="w-4 h-4 mr-2 opacity-80" />
              <span>{loyaltyCard.phone}</span>
            </div>
          )}
        </div>
        
        <div className="text-xs opacity-70 text-center pt-2">
          Created: {new Date(loyaltyCard.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};