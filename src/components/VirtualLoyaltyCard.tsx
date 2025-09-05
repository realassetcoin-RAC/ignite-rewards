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

      // Try to load from api.user_loyalty_cards first, then fallback to public.user_loyalty_cards
      let data, error;
      
      try {
        const result = await (supabase as any)
          .from('api.user_loyalty_cards')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        data = result.data;
        error = result.error;
      } catch (apiError) {
        console.error('Failed to load from api.user_loyalty_cards, trying public schema:', apiError);
        
        // Fallback to public schema
        try {
          const result = await (supabase as any)
            .from('public.user_loyalty_cards')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          data = result.data;
          error = result.error;
        } catch (publicError) {
          console.error('Failed to load from public.user_loyalty_cards:', publicError);
          error = publicError;
        }
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading loyalty card:', error);
        toast({
          title: "Error",
          description: "Failed to load loyalty card.",
          variant: "destructive",
        });
        return;
      }

      setLoyaltyCard(data);
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

      // Generate loyalty number using the database function
      let loyaltyNumber;
      try {
        // Try the api schema function first (with user_email parameter)
        const { data: generatedNumber, error: numberError } = await (supabase as any)
          .rpc('generate_loyalty_number', { user_email: user.email || '' });

        if (numberError) {
          console.error('Error generating loyalty number from api schema:', numberError);
          
          // Try the public schema function (no parameters)
          try {
            const { data: publicGeneratedNumber, error: publicNumberError } = await (supabase as any)
              .rpc('generate_loyalty_number');
            
            if (publicNumberError) {
              console.error('Error generating loyalty number from public schema:', publicNumberError);
              throw publicNumberError;
            }
            
            loyaltyNumber = publicGeneratedNumber;
            console.log('Generated loyalty number from public schema:', loyaltyNumber);
          } catch (publicError) {
            console.error('Public schema RPC call failed, using fallback:', publicError);
            throw publicError;
          }
        } else if (!generatedNumber) {
          console.error('No loyalty number generated from api schema');
          throw new Error('No loyalty number generated');
        } else {
          loyaltyNumber = generatedNumber;
          console.log('Generated loyalty number from api schema:', loyaltyNumber);
        }
      } catch (rpcError) {
        console.error('All RPC calls failed, using fallback:', rpcError);
        // Fallback: generate a simple loyalty number
        const initial = (user.email || 'U').charAt(0).toUpperCase();
        const randomDigits = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        loyaltyNumber = initial + randomDigits;
        console.log('Using fallback loyalty number:', loyaltyNumber);
      }

      // Try to insert into api.user_loyalty_cards first, then fallback to public.user_loyalty_cards
      let data, error;
      
      try {
        console.log('Attempting to insert into api.user_loyalty_cards...');
        const result = await (supabase as any)
          .from('api.user_loyalty_cards')
          .insert({
            user_id: user.id,
            loyalty_number: loyaltyNumber,
            full_name: formData.full_name.trim(),
            email: user.email || '',
            phone: formData.phone.trim() || null,
          })
          .select()
          .single();
        
        data = result.data;
        error = result.error;
        
        if (error) {
          console.error('Error inserting into api.user_loyalty_cards:', error);
          throw error;
        }
        
        console.log('Successfully inserted into api.user_loyalty_cards:', data);
      } catch (apiError) {
        console.error('Failed to insert into api.user_loyalty_cards, trying public schema:', apiError);
        
        // Fallback to public schema
        try {
          console.log('Attempting to insert into public.user_loyalty_cards...');
          const result = await (supabase as any)
            .from('public.user_loyalty_cards')
            .insert({
              user_id: user.id,
              loyalty_number: loyaltyNumber,
              full_name: formData.full_name.trim(),
              email: user.email || '',
              phone: formData.phone.trim() || null,
            })
            .select()
            .single();
          
          data = result.data;
          error = result.error;
          
          if (error) {
            console.error('Error inserting into public.user_loyalty_cards:', error);
            throw error;
          }
          
          console.log('Successfully inserted into public.user_loyalty_cards:', data);
        } catch (publicError) {
          console.error('Failed to insert into public.user_loyalty_cards:', publicError);
          error = publicError;
        }
      }

      if (error) {
        console.error('Error creating loyalty card:', error);
        const errorMessage = error.message || 'Failed to create loyalty card';
        toast({
          title: "Error",
          description: `Failed to create virtual card: ${errorMessage}`,
          variant: "destructive",
        });
        return;
      }

      setLoyaltyCard(data);
      setShowCreateDialog(false);
      setFormData({ full_name: '', phone: '' });
      
      toast({
        title: "Success",
        description: "Your virtual loyalty card has been created!",
      });
    } catch (error: any) {
      console.error('Error creating loyalty card:', error);
      const errorMessage = error?.message || 'Failed to create virtual card';
      
      // Don't show error toast if it's already been shown in the specific error handling above
      if (!error?.handled) {
        toast({
          title: "Error",
          description: `Failed to create virtual card: ${errorMessage}`,
          variant: "destructive",
        });
      }
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