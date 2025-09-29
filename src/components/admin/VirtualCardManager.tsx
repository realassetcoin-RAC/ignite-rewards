import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, CreditCard, ArrowLeft, Save, AlertCircle } from "lucide-react";
import CustomTooltip from "@/components/ui/custom-tooltip";
import EvolutionPreview from "./EvolutionPreview"; // ✅ Evolution system preview
import { virtualCardSchema, validateFormData, useFieldValidation, imageUrlSchema, positiveNumberSchema, decimalSchema } from '@/utils/validation';

interface VirtualCard {
  id: string;
  card_name: string;
  card_type: string;
  description: string;
  image_url: string;
  evolution_image_url?: string; // ✅ IMPLEMENT REQUIREMENT: Evolution system with .gif format
  pricing_type: string;
  one_time_fee: number;
  monthly_fee: number;
  annual_fee: number;
  features: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  // ✅ IMPLEMENT REQUIREMENT: Complete NFT attributes as per specification
  collection?: string; // Collection field
  display_name?: string;
  buy_price_nft?: number; // Buy Price NFT field (separate from pricing)
  rarity?: string;
  mint_quantity?: number; // Mint field
  is_upgradeable?: boolean; // Upgrade (Yes/No)
  is_evolvable?: boolean; // Evolve (Yes/No)
  is_fractional_eligible?: boolean; // Fractional (Yes/No)
  is_custodial?: boolean;
  auto_staking_duration?: string; // Auto Staking in platform
  earn_on_spend_ratio?: number; // Earn on Spend (%)
  upgrade_bonus_ratio?: number; // Upgrade Bonus from Tokenization (%)
  evolution_min_investment?: number; // Evolution Minimum Investment
  evolution_earnings_ratio?: number; // Evolution Earnings (%)
  passive_income_rate?: number;
  custodial_income_rate?: number;
}

interface VirtualCardManagerProps {
  onStatsUpdate: () => void;
}

const VirtualCardManager = ({ onStatsUpdate }: VirtualCardManagerProps) => {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<VirtualCard | null>(null);
  const [availableCardTypes, setAvailableCardTypes] = useState<string[]>([]);
  // customPlans removed - no longer needed for NFT/loyalty cards
  const { toast } = useToast();

  // ✅ IMPLEMENT REQUIREMENT: Validate file formats for standard and evolution images
  const validateImageUrls = (data: any) => {
    const errors: string[] = [];
    
    // Validate standard image URL format
    if (data.image_url) {
      const standardFormats = /\.(jpg|jpeg|png)(\?.*)?$/i;
      if (!standardFormats.test(data.image_url)) {
        errors.push('Standard image must be .jpg, .jpeg, or .png format');
      }
    }
    
    // Validate evolution image URL format (only if provided)
    if (data.evolution_image_url && data.evolution_image_url.trim()) {
      const evolutionFormats = /\.(gif)(\?.*)?$/i;
      if (!evolutionFormats.test(data.evolution_image_url)) {
        errors.push('Evolution image must be .gif format for 3D animation');
      }
    }
    
    return errors;
  };

  const form = useForm({
    defaultValues: {
      card_name: "",
      card_type: "Standard",
      description: "",
      image_url: "",
      evolution_image_url: "", // ✅ Evolution 3D animated NFT image
      pricing_type: "free",
      one_time_fee: 0,
      monthly_fee: 0,
      annual_fee: 0,
      features: "",
      is_active: true,
      custom_card_type: "",
      custom_plan: "",
      // ✅ IMPLEMENT REQUIREMENT: Complete NFT form fields
      collection: "Classic", // Default collection
      display_name: "",
      buy_price_nft: 0, // Buy Price NFT field
      rarity: "Common",
      mint_quantity: 1000, // Mint field
      is_upgradeable: false, // Upgrade (Yes/No)
      is_evolvable: true, // Evolve (Yes/No)
      is_fractional_eligible: true, // Fractional (Yes/No)
      is_custodial: true,
      auto_staking_duration: "Forever", // Auto Staking in platform
      earn_on_spend_ratio: 0.01, // Earn on Spend (%)
      upgrade_bonus_ratio: 0, // Upgrade Bonus from Tokenization (%)
      evolution_min_investment: 0, // Evolution Minimum Investment
      evolution_earnings_ratio: 0, // Evolution Earnings (%)
      passive_income_rate: 0.01,
      custodial_income_rate: 0
    }
  });

  // Watch for pricing type changes
  const watchPricingType = form.watch("pricing_type");

  useEffect(() => {
    loadCards();
  }, []);

  // Helper function to add a new card type
  // const addNewCardType = (newType: string) => {
  //   const formattedType = newType
  //     .split(' ')
  //     .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  //     .join(' ');
  //   
  //   if (!availableCardTypes.includes(formattedType)) {
  //     const updatedTypes = [...availableCardTypes, formattedType].sort();
  //     setAvailableCardTypes(updatedTypes);
  //     return formattedType;
  //   }
  //   return formattedType;
  // };

  const loadCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('nft_types' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        // Handle database connection errors gracefully
        if (error.message === 'Database not connected') {
          console.warn('Database not connected, using mock data for cards');
          // Provide mock data when database is not connected
          const mockCards = [
            {
              id: 'mock-card-1',
              card_name: 'Free Loyalty Card',
              card_type: 'Common',
              description: 'Basic loyalty card with standard rewards',
              image_url: '',
              pricing_type: 'free',
              one_time_fee: 0,
              monthly_fee: 0,
              annual_fee: 0,
              features: {},
              is_active: true,
              created_at: new Date().toISOString(),
              display_name: 'Free Loyalty Card',
              rarity: 'Common',
              mint_quantity: 1000,
              is_upgradeable: true,
              is_evolvable: false,
              is_fractional_eligible: false,
              is_custodial: true,
              auto_staking_duration: 0,
              earn_on_spend_ratio: 0.01,
              upgrade_bonus_ratio: 0,
              evolution_min_investment: 0,
              evolution_earnings_ratio: 0,
              passive_income_rate: 0.01,
              custodial_income_rate: 0
            }
          ];
          setCards(mockCards);
          setAvailableCardTypes(["Common", "Less Common", "Rare", "Very Rare"]);
          return;
        }
        throw error;
      }
      
      // Transform nft_types data to match VirtualCard interface
      const transformedData = (data || []).map((nft: Record<string, unknown>) => ({
        id: nft.id,
        card_name: nft.nft_name || nft.display_name,
        card_type: nft.rarity || "Common",
        description: nft.description || "",
        image_url: nft.image_url || "",
        evolution_image_url: nft.evolution_image_url || "",
        pricing_type: nft.buy_price_usdt > 0 ? "one_time" : "free",
        one_time_fee: nft.buy_price_usdt || 0,
        monthly_fee: 0,
        annual_fee: 0,
        features: nft.features || {},
        is_active: nft.is_active,
        created_at: nft.created_at,
        // NFT fields
        display_name: nft.display_name,
        rarity: nft.rarity,
        mint_quantity: nft.mint_quantity,
        is_upgradeable: nft.is_upgradeable,
        is_evolvable: nft.is_evolvable,
        is_fractional_eligible: nft.is_fractional_eligible,
        is_custodial: nft.is_custodial,
        auto_staking_duration: nft.auto_staking_duration,
        earn_on_spend_ratio: nft.earn_on_spend_ratio,
        upgrade_bonus_ratio: nft.upgrade_bonus_ratio,
        evolution_min_investment: nft.evolution_min_investment,
        evolution_earnings_ratio: nft.evolution_earnings_ratio,
        passive_income_rate: nft.passive_income_rate,
        custodial_income_rate: nft.custodial_income_rate
      }));
      
      setCards(transformedData);
      
      // Extract unique card types
      if (data && data.length > 0) {
        const existingTypes = [...new Set(data.map((nft: any) => nft.rarity).filter(Boolean))];
        const defaultTypes = ["Common", "Less Common", "Rare", "Very Rare"];
        const allTypes = [...new Set([...defaultTypes, ...existingTypes])].sort();
        setAvailableCardTypes(allTypes);
      } else {
        setAvailableCardTypes(["Common", "Less Common", "Rare", "Very Rare"]);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      // Don't show error toast for database connection issues
      if (error instanceof Error && !error.message.includes('Database not connected')) {
        toast({
          title: "Error",
          description: "Failed to load loyalty cards",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      // Validate form data using schema
      const validation = validateFormData(virtualCardSchema, data);
      
      if (!validation.success) {
        const firstError = validation.errors?.[0] || 'Please check your input';
        toast({
          title: "Validation Error",
          description: firstError,
          variant: "destructive",
        });
        return;
      }
      // Handle custom card type
      // const _finalCardType = data.card_type;
      if (data.card_type === "custom" && data.custom_card_type) {
        // const finalCardType = addNewCardType(data.custom_card_type);
      }

      // Custom plan handling removed - no longer needed for NFT cards

      // Parse features JSON
      let parsedFeatures = null;
      if (data.features) {
        try {
          parsedFeatures = JSON.parse(data.features);
        } catch {
          toast({
            title: "Validation Error",
            description: "Features field contains invalid JSON format",
            variant: "destructive"
          });
          return;
        }
      }

      // Prepare NFT data for nft_types table
      const nftData = {
        nft_name: data.card_name,
        display_name: data.display_name || data.card_name,
        buy_price_usdt: data.pricing_type === "free" ? 0 : Number(data.one_time_fee),
        rarity: data.rarity || "Common",
        mint_quantity: Number(data.mint_quantity) || 1000,
        is_upgradeable: Boolean(data.is_upgradeable),
        is_evolvable: Boolean(data.is_evolvable),
        is_fractional_eligible: Boolean(data.is_fractional_eligible),
        is_custodial: Boolean(data.is_custodial),
        auto_staking_duration: data.auto_staking_duration || "Forever",
        earn_on_spend_ratio: Number(data.earn_on_spend_ratio) || 0.01,
        upgrade_bonus_ratio: Number(data.upgrade_bonus_ratio) || 0,
        evolution_min_investment: Number(data.evolution_min_investment) || 0,
        evolution_earnings_ratio: Number(data.evolution_earnings_ratio) || 0,
        passive_income_rate: Number(data.passive_income_rate) || 0.01,
        custodial_income_rate: Number(data.custodial_income_rate) || 0,
        is_active: data.is_active,
        description: data.description,
        image_url: data.image_url,
        evolution_image_url: data.evolution_image_url,
        features: parsedFeatures
      };

      let result;
      if (editingCard) {
        result = await supabase
          .from("nft_types" as any)
          .update(nftData as any)
          .eq("id", editingCard.id);
        
        if (result.error) throw result.error;
        
        toast({
          title: "Success",
          description: "Loyalty card updated successfully"
        });
      } else {
        result = await supabase
          .from("nft_types" as any)
          .insert([nftData as any])
          .select();
        
        if (result.error) throw result.error;
        
        toast({
          title: "Success",
          description: "Loyalty card created successfully"
        });
      }

      setShowForm(false);
      setEditingCard(null);
      form.reset();
      loadCards();
      onStatsUpdate();
    } catch (error) {
      console.error('Error saving card:', error);
      toast({
        title: "Error",
        description: "Failed to save loyalty card",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (card: VirtualCard) => {
    setEditingCard(card);
    form.reset({
      card_name: card.card_name,
      card_type: card.card_type,
      description: card.description,
      image_url: card.image_url,
      evolution_image_url: card.evolution_image_url || "",
      pricing_type: card.pricing_type,
      one_time_fee: card.one_time_fee,
      monthly_fee: card.monthly_fee,
      annual_fee: card.annual_fee,
      features: card.features ? JSON.stringify(card.features) : "",
      is_active: card.is_active,
      custom_card_type: "",
      custom_plan: "",
      // New NFT fields (using defaults for now until migration is applied)
      display_name: card.display_name || card.card_name,
      rarity: card.rarity || "Common",
      mint_quantity: card.mint_quantity || 1000,
      is_upgradeable: card.is_upgradeable || false,
      is_evolvable: card.is_evolvable || true,
      is_fractional_eligible: card.is_fractional_eligible || true,
      is_custodial: card.is_custodial || true,
      auto_staking_duration: card.auto_staking_duration || "Forever",
      earn_on_spend_ratio: card.earn_on_spend_ratio || 0.01,
      upgrade_bonus_ratio: card.upgrade_bonus_ratio || 0,
      evolution_min_investment: card.evolution_min_investment || 0,
      evolution_earnings_ratio: card.evolution_earnings_ratio || 0,
      passive_income_rate: card.passive_income_rate || 0.01,
      custodial_income_rate: card.custodial_income_rate || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this loyalty card?")) return;
    
    try {
      const { error } = await supabase
        .from("nft_types" as any)
        .delete()
        .eq("id", cardId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Loyalty card deleted successfully"
      });
      
      loadCards();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: "Error",
        description: "Failed to delete loyalty card",
        variant: "destructive",
      });
    }
  };

  const getPricingDisplay = (card: VirtualCard) => {
    if (card.pricing_type === "free") return "Free";
    if (card.pricing_type === "one_time") return `$${card.one_time_fee}`;
    return `$${card.monthly_fee}/mo`;
  };

  // If showing form, render the full-page form
  if (showForm) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingCard(null);
                  form.reset();
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Cards
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {editingCard ? "Edit Loyalty Card" : "Create New Loyalty Card"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Configure the loyalty card details, pricing, and NFT properties.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="shadow-lg bg-card border-border">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-12">
                  {/* Section 1: Basic Information */}
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>
                      <p className="text-sm text-muted-foreground mt-1">Essential details about the loyalty card</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Card Name */}
                      <FormField
                        control={form.control}
                        name="card_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Card Name
                              <CustomTooltip content="The display name for this loyalty card" />
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Premium Rewards Card" {...field} className="mt-1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Card Type */}
                      <FormField
                        control={form.control}
                        name="card_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Card Type
                              <CustomTooltip content="Category of the loyalty card" />
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableCardTypes.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                                <SelectItem value="custom">+ Add New Type...</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* ✅ IMPLEMENT REQUIREMENT: Collection field */}
                      <FormField
                        control={form.control}
                        name="collection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Collection
                              <CustomTooltip content="NFT collection category (Classic, Premium, etc.)" />
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "Classic"}>
                              <FormControl>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Classic">Classic</SelectItem>
                                <SelectItem value="Premium">Premium</SelectItem>
                                <SelectItem value="Elite">Elite</SelectItem>
                                <SelectItem value="Exclusive">Exclusive</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Subscription Plan field removed - not needed for NFT/loyalty cards */}
                    </div>

                    {/* Custom Card Type Input */}
                    {form.watch("card_type") === "custom" && (
                      <div className="max-w-md">
                        <FormField
                          control={form.control}
                          name="custom_card_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-sm font-medium">
                                New Card Type Name
                                <CustomTooltip content="Create any new card type you need" />
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., VIP, Corporate, Platinum" 
                                  {...field}
                                  className="mt-1 capitalize"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Custom plan input removed - not needed for NFT/loyalty cards */}
                  </div>

                  {/* Section 2: Content & Media */}
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-foreground">Content & Media</h2>
                      <p className="text-sm text-muted-foreground mt-1">Description and visual elements</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Description
                              <CustomTooltip content="Detailed description of card benefits and features" />
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Card description and benefits..." 
                                {...field} 
                                className="mt-1 min-h-[120px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="image_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Standard Image URL
                              <CustomTooltip content="URL to the standard card image (.jpg or .png format)" />
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/card-image.jpg" {...field} className="mt-1" />
                            </FormControl>
                            <div className="text-xs text-muted-foreground mt-1">
                              Supported formats: .jpg, .jpeg, .png
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="evolution_image_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Evolution Image URL (3D Animated)
                              <CustomTooltip content="URL to the evolved NFT's 3D animated image (.gif format)" />
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/evolved-card.gif" {...field} className="mt-1" />
                            </FormControl>
                            <div className="text-xs text-muted-foreground mt-1">
                              Required format: .gif (for 3D animation)
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* ✅ IMPLEMENT REQUIREMENT: Evolution system preview with file format validation */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-foreground">Image Preview & Validation</h3>
                      <EvolutionPreview
                        standardImageUrl={form.watch('image_url')}
                        evolutionImageUrl={form.watch('evolution_image_url')}
                        cardName={form.watch('card_name') || 'Untitled Card'}
                        rarity={form.watch('rarity') || 'Common'}
                      />
                    </div>
                  </div>

                  {/* Section 3: Pricing */}
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-foreground">Pricing Structure</h2>
                      <p className="text-sm text-muted-foreground mt-1">Configure how customers pay for this card</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <FormField
                        control={form.control}
                        name="pricing_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Pricing Type
                              <CustomTooltip content="How customers pay for this card" />
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="one_time">One Time Fee</SelectItem>
                                <SelectItem value="subscription">Subscription</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* ✅ IMPLEMENT REQUIREMENT: Buy Price NFT field */}
                      <FormField
                        control={form.control}
                        name="buy_price_nft"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Buy Price NFT ($)
                              <CustomTooltip content="NFT purchase price in USD (separate from subscription pricing)" />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                placeholder="0.00"
                                {...field} 
                                className="mt-1"
                              />
                            </FormControl>
                            <div className="text-xs text-muted-foreground">
                              Direct NFT purchase price (0 = free for custodial users)
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Fee Fields */}
                      {(watchPricingType === "one_time" || watchPricingType === "free") && (
                        <FormField
                          control={form.control}
                          name="one_time_fee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-sm font-medium">
                                One Time Fee ($)
                                <CustomTooltip content="Single payment amount" />
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field} 
                                  disabled={watchPricingType === "free"}
                                  className={`mt-1 ${watchPricingType === "free" ? "opacity-50" : ""}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {(watchPricingType === "subscription" || watchPricingType === "free") && (
                        <>
                          <FormField
                            control={form.control}
                            name="monthly_fee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-sm font-medium">
                                  Monthly Fee ($)
                                  <CustomTooltip content="Monthly payment amount" />
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field} 
                                    disabled={watchPricingType === "free"}
                                    className={`mt-1 ${watchPricingType === "free" ? "opacity-50" : ""}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="annual_fee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-sm font-medium">
                                  Annual Fee ($)
                                  <CustomTooltip content="Yearly payment amount (usually discounted)" />
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01" 
                                    {...field} 
                                    disabled={watchPricingType === "free"}
                                    className={`mt-1 ${watchPricingType === "free" ? "opacity-50" : ""}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>

                    {/* Pricing Info */}
                    {watchPricingType === "free" && (
                      <div className="bg-muted border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                          💡 Fee fields are locked because pricing type is set to "Free"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Section 4: NFT Properties */}
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-foreground">NFT Properties</h2>
                      <p className="text-sm text-muted-foreground mt-1">Configure the NFT characteristics and blockchain properties</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <FormField
                        control={form.control}
                        name="display_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Display Name
                              <CustomTooltip content="Public display name shown to users" />
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Premium Rewards Card" {...field} className="mt-1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rarity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Rarity
                              <CustomTooltip content="NFT rarity level" />
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Common">Common</SelectItem>
                                <SelectItem value="Less Common">Less Common</SelectItem>
                                <SelectItem value="Rare">Rare</SelectItem>
                                <SelectItem value="Very Rare">Very Rare</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mint_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Mint Count
                              <CustomTooltip content="Total number of NFTs that can be minted" />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1000" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="mt-1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="auto_staking_duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Auto Staking Duration
                              <CustomTooltip content="Duration for auto-staking" />
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Forever">Forever</SelectItem>
                                <SelectItem value="1 Year">1 Year</SelectItem>
                                <SelectItem value="2 Years">2 Years</SelectItem>
                                <SelectItem value="5 Years">5 Years</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Section 5: NFT Features */}
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-foreground">NFT Features & Capabilities</h2>
                      <p className="text-sm text-muted-foreground mt-1">Configure advanced NFT functionality</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <FormField
                        control={form.control}
                        name="is_upgradeable"
                        render={({ field }) => (
                          <FormItem className="flex flex-col items-center justify-center rounded-lg border p-6 h-full">
                            <div className="space-y-3 text-center">
                              <FormLabel className="text-base font-medium flex items-center justify-center gap-2">
                                Upgrade
                                <CustomTooltip content="Can this NFT be upgraded to increase earning ratios?" />
                              </FormLabel>
                              <div className="text-sm text-gray-600">
                                Can be upgraded
                              </div>
                            </div>
                            <FormControl className="mt-4">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_evolvable"
                        render={({ field }) => (
                          <FormItem className="flex flex-col items-center justify-center rounded-lg border p-6 h-full">
                            <div className="space-y-3 text-center">
                              <FormLabel className="text-base font-medium flex items-center justify-center gap-2">
                                Evolve
                                <CustomTooltip content="Can this NFT be evolved with additional investment?" />
                              </FormLabel>
                              <div className="text-sm text-gray-600">
                                Can be evolved
                              </div>
                            </div>
                            <FormControl className="mt-4">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_fractional_eligible"
                        render={({ field }) => (
                          <FormItem className="flex flex-col items-center justify-center rounded-lg border p-6 h-full">
                            <div className="space-y-3 text-center">
                              <FormLabel className="text-base font-medium flex items-center justify-center gap-2">
                                Fractional
                                <CustomTooltip content="Is this NFT eligible for fractional ownership?" />
                              </FormLabel>
                              <div className="text-sm text-gray-600">
                                Fractional eligible
                              </div>
                            </div>
                            <FormControl className="mt-4">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_custodial"
                        render={({ field }) => (
                          <FormItem className="flex flex-col items-center justify-center rounded-lg border p-6 h-full">
                            <div className="space-y-3 text-center">
                              <FormLabel className="text-base font-medium flex items-center justify-center gap-2">
                                Custodial
                                <CustomTooltip content="Is this NFT held in custody or self-custody?" />
                              </FormLabel>
                              <div className="text-sm text-gray-600">
                                Custodial NFT
                              </div>
                            </div>
                            <FormControl className="mt-4">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Section 6: Earning Ratios */}
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-foreground">Earning Ratios</h2>
                      <p className="text-sm text-muted-foreground mt-1">Configure how users earn rewards and bonuses</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <FormField
                        control={form.control}
                        name="earn_on_spend_ratio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Earn on Spend %
                              <CustomTooltip content="Percentage earned on spending (e.g., 1.00% = 0.0100)" />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.0001" 
                                placeholder="0.0100" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="mt-1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="upgrade_bonus_ratio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Upgrade Bonus %
                              <CustomTooltip content="Additional percentage for upgraded NFTs" />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.0001" 
                                placeholder="0.0000" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="mt-1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="evolution_min_investment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Evolution Min Invest (USDT)
                              <CustomTooltip content="Minimum USDT investment required to evolve" />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="100" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="mt-1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="evolution_earnings_ratio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Evolution Earnings %
                              <CustomTooltip content="Additional percentage earned after evolution" />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.0001" 
                                placeholder="0.0025" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="mt-1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Section 7: Income Rates */}
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-foreground">Income Rates</h2>
                      <p className="text-sm text-muted-foreground mt-1">Configure passive and custodial income rates</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="passive_income_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Passive Income Rate %
                              <CustomTooltip content="Base passive income percentage earned by NFT holders" />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.0001" 
                                placeholder="0.0100" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="mt-1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="custodial_income_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                              Custodial Income Rate %
                              <CustomTooltip content="Additional income rate for custodial NFTs" />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.0001" 
                                placeholder="0.0000" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="mt-1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Section 8: Features & Settings */}
                  <div className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-xl font-semibold text-foreground">Features & Settings</h2>
                      <p className="text-sm text-muted-foreground mt-1">Additional features and card status</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <FormField
                          control={form.control}
                          name="features"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-sm font-medium">
                                Features (JSON)
                                <CustomTooltip content="List of card features in JSON format" />
                              </FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder='["Feature 1", "Feature 2", "Feature 3"]'
                                  {...field} 
                                  className="mt-1 min-h-[100px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-center">
                        <FormField
                          control={form.control}
                          name="is_active"
                          render={({ field }) => (
                            <FormItem className="flex flex-col items-center justify-center rounded-lg border p-6 h-full w-full">
                              <div className="space-y-3 text-center">
                                <FormLabel className="text-base font-medium flex items-center justify-center gap-2">
                                  Active Status
                                  <CustomTooltip content="Whether this card is available for customers" />
                                </FormLabel>
                                <div className="text-sm text-gray-600">
                                  Make this card available
                                </div>
                              </div>
                              <FormControl className="mt-4">
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-4 pt-8 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingCard(null);
                        form.reset();
                      }}
                      className="px-8"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="px-8 flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {editingCard ? "Update Card" : "Create Card"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main cards list view
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Loyalty Cards</h3>
        <Button onClick={() => {
          setEditingCard(null);
          form.reset({
            card_name: "",
            card_type: "Standard",
            description: "",
            image_url: "",
            evolution_image_url: "",
            pricing_type: "free",
            one_time_fee: 0,
            monthly_fee: 0,
            annual_fee: 0,
            features: "",
            is_active: true,
            custom_card_type: "",
            custom_plan: "",
            // New NFT fields
            display_name: "",
            rarity: "Common",
            mint_quantity: 1000,
            is_upgradeable: false,
            is_evolvable: true,
            is_fractional_eligible: true,
            is_custodial: true,
            auto_staking_duration: "Forever",
            earn_on_spend_ratio: 0.01,
            upgrade_bonus_ratio: 0,
            evolution_min_investment: 0,
            evolution_earnings_ratio: 0,
            passive_income_rate: 0.01,
            custodial_income_rate: 0
          });
          setShowForm(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Loyalty Card
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading loyalty cards...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-8">
          <Card className="p-8">
            <div className="text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Loyalty Cards</h3>
              <p className="text-muted-foreground mb-4">
                Create your first loyalty card product to get started.
              </p>
              <Button onClick={() => {
                setEditingCard(null);
                form.reset();
                setShowForm(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Loyalty Card
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-medium">{card.card_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{card.card_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{card.pricing_type}</Badge>
                  </TableCell>
                  <TableCell>{getPricingDisplay(card)}</TableCell>
                  <TableCell>
                    <Badge variant={card.is_active ? "default" : "secondary"}>
                      {card.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(card.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(card)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(card.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default VirtualCardManager;