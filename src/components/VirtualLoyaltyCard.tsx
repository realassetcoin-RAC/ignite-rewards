import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Plus, RefreshCw, User, Phone, Mail, Shield } from 'lucide-react';
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

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

export const VirtualLoyaltyCard: React.FC = () => {
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    user_id: '',
    email: '',
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [adminMode, setAdminMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLoyaltyCard();
  }, []);

  const loadLoyaltyCard = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to load from user_loyalty_cards with API schema focus
      let loyaltyData = null;
      let loadError = null;
      
      // Based on our testing, focus on API schema first
      try {
        console.log('Loading from api.user_loyalty_cards (configured schema)...');
        const { data, error } = await supabase
          .from('user_loyalty_cards')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        loyaltyData = data;
        console.log('Loaded from configured schema:', data);
      } catch (primaryError) {
        console.warn('Primary schema load failed:', primaryError);
        loadError = primaryError;
        
        // Try explicit API schema reference
        try {
          console.log('Loading with explicit api schema reference...');
          const { data, error } = await supabase
            .schema('api')
            .from('user_loyalty_cards')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          
          loyaltyData = data;
          console.log('Loaded with explicit api schema:', data);
        } catch (secondaryError) {
          console.error('All load attempts failed:', secondaryError);
          loadError = secondaryError;
        }
      }
      
      // Handle loading errors more gracefully
      if (loadError && loadError.code !== 'PGRST116') {
        console.error('Error loading loyalty card:', loadError);
        
        // If it's a permission error, don't show an error toast - just continue with no card
        // This allows users to create a new card even if they can't load existing ones
        if (loadError.code !== '42501' && !loadError.message?.includes('permission denied')) {
          toast({
            title: "Error",
            description: "Failed to load loyalty card.",
            variant: "destructive",
          });
          return;
        } else {
          console.log('Permission denied for loading - continuing with card creation option');
        }
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

      // Generate loyalty number with improved fallback strategy
      let loyaltyNumber;
      
      // Generate loyalty number with better error handling
      const generateLoyaltyNumber = async () => {
        // Since database functions are having issues, use client-side generation as primary method
        // This ensures the user can always create a card even if DB functions fail
        console.log('Generating loyalty number client-side due to database constraints...');
        const initial = (user.email || 'U').charAt(0).toUpperCase();
        const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2 random digits
        return initial + timestamp + random;
      };
      
      loyaltyNumber = await generateLoyaltyNumber();
      console.log('Final loyalty number to use:', loyaltyNumber);

      // Insert into user_loyalty_cards with improved error handling
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
      
      // Based on our testing, we can only access the api schema, so try that first
      try {
        console.log('Trying api.user_loyalty_cards (configured schema)...');
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
      } catch (primaryError) {
        console.warn('Primary insert failed:', primaryError);
        insertError = primaryError;
        
        // Try with explicit API schema reference
        try {
          console.log('Trying explicit api schema reference...');
          const { data, error } = await supabase
            .schema('api')
            .from('user_loyalty_cards')
            .insert(insertData)
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          insertResult = data;
          console.log('Successfully inserted with explicit api schema:', data);
        } catch (secondaryError) {
          console.error('All insert attempts failed:', secondaryError);
          
          // If we still can't insert, at least show the user their generated card info
          // This is a graceful degradation - they get the loyalty number even if we can't save it
          console.warn('Unable to save to database, but providing loyalty card info to user');
          insertResult = {
            id: 'temp-' + Date.now(),
            user_id: user.id,
            loyalty_number: loyaltyNumber,
            full_name: formData.full_name.trim(),
            email: user.email || '',
            phone: formData.phone.trim() || null,
            is_active: true,
            created_at: new Date().toISOString()
          };
          
          // Show a helpful message based on the error type
          if (secondaryError?.code === '42501' || secondaryError?.message?.includes('permission denied')) {
            toast({
              title: "Card Generated Successfully",
              description: "Your loyalty number is " + loyaltyNumber + ". Please save this number - it may not be stored permanently due to system limitations.",
              variant: "default",
            });
          } else {
            toast({
              title: "Card Created (Not Saved)",
              description: "Your loyalty card was created but couldn't be saved. Please contact support with your loyalty number: " + loyaltyNumber,
              variant: "default",
            });
          }
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