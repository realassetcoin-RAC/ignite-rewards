import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  BarChart3,
  Users,
  Building2,
  Vote,
  CreditCard,
  Store
} from 'lucide-react';
import TestDataGenerator from '@/utils/testDataGenerator';

const TestDataManager: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const { toast } = useToast();

  const generator = new TestDataGenerator();

  const handleGenerateTestData = async () => {
    try {
      setIsGenerating(true);
      
      toast({
        title: "Generating Test Data",
        description: "Creating comprehensive test data for all models...",
      });

      await generator.insertTestData();
      
      setLastGenerated(new Date());
      
      toast({
        title: "Success",
        description: "Test data generated successfully! All models now have realistic test data.",
      });
    } catch (error) {
      console.error('Error generating test data:', error);
      toast({
        title: "Error",
        description: "Failed to generate test data. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearTestData = async () => {
    try {
      setIsClearing(true);
      
      toast({
        title: "Clearing Test Data",
        description: "Removing all test data from the database...",
      });

      await generator.clearTestData();
      
      setLastGenerated(null);
      
      toast({
        title: "Success",
        description: "Test data cleared successfully!",
      });
    } catch (error) {
      console.error('Error clearing test data:', error);
      toast({
        title: "Error",
        description: "Failed to clear test data. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportData = () => {
    const data = generator.getGeneratedData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: "Test data has been exported to a JSON file.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Test Data Management</h3>
        <p className="text-sm text-muted-foreground">
          Generate comprehensive test data for all application models to enable thorough testing.
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lastGenerated ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Test data available</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">No test data</span>
                </>
              )}
            </div>
            {lastGenerated && (
              <Badge variant="outline" className="text-xs">
                Generated: {lastGenerated.toLocaleDateString()}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Test Data Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">50</div>
              <div className="text-xs text-muted-foreground">Users</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">20</div>
              <div className="text-xs text-muted-foreground">Merchants</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Vote className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">5</div>
              <div className="text-xs text-muted-foreground">DAOs</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">200</div>
              <div className="text-xs text-muted-foreground">Transactions</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Store className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">15</div>
              <div className="text-xs text-muted-foreground">Listings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Generate Test Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create comprehensive test data including users, merchants, DAOs, proposals, transactions, and marketplace listings.
            </p>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will add new test data to your database. Existing data will be preserved.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleGenerateTestData}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Test Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Clear Test Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Remove all test data from the database. This action cannot be undone.
            </p>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This will delete all test data permanently.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleClearTestData}
              disabled={isClearing}
              variant="destructive"
              className="w-full"
            >
              {isClearing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Test Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Test Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Export the generated test data to a JSON file for backup or sharing.
          </p>
          <Button 
            onClick={handleExportData}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Export as JSON
          </Button>
        </CardContent>
      </Card>

      {/* Test Data Details */}
      <Card>
        <CardHeader>
          <CardTitle>Test Data Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Users (50)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Mix of regular users, merchants, and admins</li>
                <li>• Realistic names, emails, and phone numbers</li>
                <li>• Various creation dates over the past year</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Merchants (20)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Different business types (restaurants, retail, services)</li>
                <li>• Various subscription plans and statuses</li>
                <li>• Geographic distribution across major cities</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">DAOs (5)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Different governance tokens and voting thresholds</li>
                <li>• Treasury addresses and proposal requirements</li>
                <li>• Various statuses (active, inactive, suspended)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Proposals (30)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Different categories (governance, treasury, technical)</li>
                <li>• Various voting types and statuses</li>
                <li>• Realistic vote counts and timeframes</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Transactions (200)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Various amounts and reward point calculations</li>
                <li>• Different statuses (completed, pending, failed)</li>
                <li>• Realistic receipt numbers and timestamps</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Marketplace Listings (15)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Different asset types and risk levels</li>
                <li>• Various funding goals and current amounts</li>
                <li>• Featured and verified listings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestDataManager;
