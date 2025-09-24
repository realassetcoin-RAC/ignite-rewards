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

      console.log('Loading loyalty card for user:', user.id);
      
      // Load from user_loyalty_cards (public schema - this should work after the fix)
      const { data: loyaltyData, error } = await supabase
        .from('user_loyalty_cards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading loyalty card:', error);
        toast({
          title: "Error",
          description: "Failed to load loyalty card. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setLoyaltyCard(loyaltyData);
      console.log('Loyalty card loaded:', loyaltyData);
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

      console.log('Creating loyalty card for user:', user.id);

      // Step 1: Generate loyalty number using the fixed function
      console.log('Generating loyalty number...');
      let loyaltyNumber;
      
      try {
        // Try the primary method (should work after database fix)
        const { data: generatedNumber, error: numberError } = await supabase
          .rpc('generate_loyalty_number', { user_email: user.email || '' });
        
        if (numberError) {
          console.warn('Primary generation failed:', numberError.message);
          
          // Fallback to parameterless version
          const { data: fallbackNumber, error: fallbackError } = await supabase
            .rpc('generate_loyalty_number');
          
          if (fallbackError) {
            console.warn('Fallback generation failed:', fallbackError.message);
            throw new Error('Database loyalty number generation failed');
          }
          
          loyaltyNumber = fallbackNumber;
        } else {
          loyaltyNumber = generatedNumber;
        }
      } catch (dbError) {
        console.warn('Database generation failed, using client-side fallback:', dbError);
        // Client-side fallback
        const initial = (user.email || 'U').charAt(0).toUpperCase();
        const randomDigits = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        loyaltyNumber = initial + randomDigits;
      }
      
      console.log('Generated loyalty number:', loyaltyNumber);

      // Step 2: Insert into database
      console.log('Inserting loyalty card into database...');
      const insertData = {
        user_id: user.id,
        loyalty_number: loyaltyNumber,
        full_name: formData.full_name.trim(),
        email: user.email || '',
        phone: formData.phone.trim() || null,
        is_active: true
      };
      
      const { data: insertResult, error: insertError } = await supabase
        .from('user_loyalty_cards')
        .insert(insertData)
        .select()
        .single();
      
      if (insertError) {
        console.error('Insert failed:', insertError);
        throw insertError;
      }
      
      console.log('Loyalty card created successfully:', insertResult);

      setLoyaltyCard(insertResult);
      setShowCreateDialog(false);
      setFormData({ full_name: '', phone: '' });
      
      toast({
        title: "Success!",
        description: `Your virtual loyalty card has been created! Your loyalty number is ${loyaltyNumber}`,
      });
    } catch (error: any) {
      console.error('Error creating loyalty card:', error);
      
      let errorMessage = 'Failed to create virtual card. Please try again.';
      
      // Provide specific error messages based on common issues
      if (error?.code === 'PGRST301') {
        errorMessage = 'Permission denied. Please contact support.';
      } else if (error?.code === '42501') {
        errorMessage = 'Insufficient permissions. Please contact support.';
      } else if (error?.code === 'PGRST116') {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (error?.code === '23505') {
        errorMessage = 'You already have a loyalty card. Please refresh the page.';
      } else if (error?.message?.includes('ambiguous')) {
        errorMessage = 'Database configuration issue. Please contact support.';
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
          <div className="flex flex-col items-center space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading your loyalty card...</p>
          </div>
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
            Get your unique loyalty number and start earning rewards today.
          </p>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-1/4">
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
                    disabled={creating}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    disabled={creating}
                  />
                </div>
                
                <Button
                  onClick={createLoyaltyCard}
                  disabled={creating || !formData.full_name.trim()}
                  className="w-full"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating Card...
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
          <div className="text-3xl font-bold font-mono tracking-wider bg-black/10 rounded-lg py-2 px-4">
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
        
        <div className="text-xs opacity-70 text-center pt-2 border-t border-primary-foreground/20">
          Created: {new Date(loyaltyCard.created_at).toLocaleDateString()}
        </div>
        
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full mt-4"
          onClick={loadLoyaltyCard}
        >
          <RefreshCw className="w-3 h-3 mr-2" />
          Refresh Card
        </Button>
      </CardContent>
    </Card>
  );
};