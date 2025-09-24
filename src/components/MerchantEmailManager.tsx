import React, { useState, useEffect } from 'react';
// Email management component for merchants
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

interface MerchantEmail {
  id: string;
  email_address: string;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
}

interface MerchantEmailManagerProps {
  merchantId: string;
  subscriptionPlan?: {
    email_limit?: number;
    name: string;
  } | null;
}

export const MerchantEmailManager: React.FC<MerchantEmailManagerProps> = ({
  merchantId,
  subscriptionPlan
}) => {
  const [emails, setEmails] = useState<MerchantEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingEmail, setAddingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const emailLimit = subscriptionPlan?.email_limit || 1;

  useEffect(() => {
    loadEmails();
  }, [merchantId]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('merchant_emails')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading emails:', error);
        toast({
          title: "Error",
          description: "Failed to load email addresses.",
          variant: "destructive",
        });
        return;
      }

      setEmails(data || []);
    } catch (error) {
      console.error('Error loading emails:', error);
      toast({
        title: "Error",
        description: "Failed to load email addresses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEmail = async () => {
    if (!newEmail.trim()) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address format.",
        variant: "destructive",
      });
      return;
    }

    // Check if email already exists
    if (emails.some(email => email.email_address.toLowerCase() === newEmail.toLowerCase())) {
      toast({
        title: "Email Exists",
        description: "This email address is already added.",
        variant: "destructive",
      });
      return;
    }

    // Check email limit
    if (emails.length >= emailLimit) {
      toast({
        title: "Email Limit Reached",
        description: `You have reached the maximum of ${emailLimit} email addresses for your ${subscriptionPlan?.name || 'current'} plan.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingEmail(true);
      const { data, error } = await supabase
        .from('merchant_emails')
        .insert({
          merchant_id: merchantId,
          email_address: newEmail.trim(),
          is_primary: emails.length === 0, // First email is primary
          is_verified: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding email:', error);
        toast({
          title: "Error",
          description: "Failed to add email address.",
          variant: "destructive",
        });
        return;
      }

      setEmails(prev => [...prev, data]);
      setNewEmail('');
      setDialogOpen(false);
      
      toast({
        title: "Email Added",
        description: "Email address has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding email:', error);
      toast({
        title: "Error",
        description: "Failed to add email address.",
        variant: "destructive",
      });
    } finally {
      setAddingEmail(false);
    }
  };

  const removeEmail = async (emailId: string, emailAddress: string) => {
    try {
      const { error } = await supabase
        .from('merchant_emails')
        .delete()
        .eq('id', emailId);

      if (error) {
        console.error('Error removing email:', error);
        toast({
          title: "Error",
          description: "Failed to remove email address.",
          variant: "destructive",
        });
        return;
      }

      setEmails(prev => prev.filter(email => email.id !== emailId));
      
      toast({
        title: "Email Removed",
        description: `${emailAddress} has been removed.`,
      });
    } catch (error) {
      console.error('Error removing email:', error);
      toast({
        title: "Error",
        description: "Failed to remove email address.",
        variant: "destructive",
      });
    }
  };

  const setPrimaryEmail = async (emailId: string) => {
    try {
      // First, unset all primary emails
      await supabase
        .from('merchant_emails')
        .update({ is_primary: false })
        .eq('merchant_id', merchantId);

      // Then set the selected email as primary
      const { error } = await supabase
        .from('merchant_emails')
        .update({ is_primary: true })
        .eq('id', emailId);

      if (error) {
        console.error('Error setting primary email:', error);
        toast({
          title: "Error",
          description: "Failed to set primary email.",
          variant: "destructive",
        });
        return;
      }

      setEmails(prev => prev.map(email => ({
        ...email,
        is_primary: email.id === emailId
      })));
      
      toast({
        title: "Primary Email Updated",
        description: "Primary email has been updated successfully.",
      });
    } catch (error) {
      console.error('Error setting primary email:', error);
      toast({
        title: "Error",
        description: "Failed to set primary email.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading emails...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Management
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {emails.length} / {emailLimit} emails
            </Badge>
            {emails.length < emailLimit && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Email Address</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="business@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={addEmail}
                        disabled={addingEmail}
                      >
                        {addingEmail ? 'Adding...' : 'Add Email'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {emails.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Email Addresses</h3>
            <p className="text-muted-foreground mb-4">
              Add email addresses for your business communications.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Email
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {emails.map((email) => (
              <div
                key={email.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {email.is_primary && (
                      <Badge variant="default" className="text-xs">
                        Primary
                      </Badge>
                    )}
                    {email.is_verified ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{email.email_address}</div>
                    <div className="text-sm text-muted-foreground">
                      {email.is_verified ? 'Verified' : 'Pending verification'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!email.is_primary && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPrimaryEmail(email.id)}
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeEmail(email.id, email.email_address)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {emails.length >= emailLimit && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Email limit reached for {subscriptionPlan?.name || 'current'} plan
              </span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Upgrade your plan to add more email addresses.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
