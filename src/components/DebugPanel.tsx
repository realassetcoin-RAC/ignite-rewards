import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DebugLogger } from '@/lib/debugLogger';
// import { supabase } from '@/lib/supabaseDebugClient';
import { 
  Bug, 
  Download, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error' | 'unknown'>('unknown');
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
      testConnection();
    }
  }, [isOpen]);

  const refreshLogs = () => {
    setLogs(DebugLogger.getLogs());
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    const result = await supabase.testConnection();
    
    if (result.success) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('error');
    }
    
    setTestResults(result);
  };

  const clearLogs = () => {
    DebugLogger.clearLogs();
    setLogs([]);
  };

  const exportLogs = () => {
    DebugLogger.exportLogs();
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'testing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      default:
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warn':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug Panel
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              {connectionStatus.toUpperCase()}
            </Badge>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          <Tabs defaultValue="logs" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
              <TabsTrigger value="connection">Connection Test</TabsTrigger>
              <TabsTrigger value="supabase">Supabase Status</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="logs" className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="flex gap-2 mb-4">
                  <Button size="sm" onClick={refreshLogs}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearLogs}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportLogs}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <ScrollArea className="flex-1 border rounded-md">
                  <div className="p-4 space-y-2">
                    {logs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No logs available</p>
                    ) : (
                      logs.map((log, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-md border ${getLogColor(log.level)}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {getLogIcon(log.level)}
                            <span className="font-mono text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.category}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{log.message}</p>
                          {log.data && (
                            <pre className="text-xs text-muted-foreground mt-2 overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="connection" className="flex-1 overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button onClick={testConnection} disabled={connectionStatus === 'testing'}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
                    Test Connection
                  </Button>
                  <Badge className={getStatusColor()}>
                    {getStatusIcon()}
                    {connectionStatus.toUpperCase()}
                  </Badge>
                </div>
                
                {testResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Test Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(testResults, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="supabase" className="flex-1 overflow-hidden">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Supabase Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>URL:</strong> https://wndswqvqogeblksrujpg.supabase.co
                      </div>
                      <div>
                        <strong>Key:</strong> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                      </div>
                      <div>
                        <strong>Schema:</strong> public
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      Network Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Internet Connection: Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {connectionStatus === 'connected' ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          Supabase API: {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="actions" className="flex-1 overflow-hidden">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Debug Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        DebugLogger.info('MANUAL_TEST', 'Manual test triggered');
                        testConnection();
                      }}
                    >
                      Run Full Connection Test
                    </Button>
                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        DebugLogger.info('MANUAL_TEST', 'Testing DAO tables access');
                        supabase.from('dao_organizations').select('*').limit(1).then(result => {
                          DebugLogger.logDAOOperation('SELECT dao_organizations', result.data, result.error);
                        });
                      }}
                    >
                      Test DAO Tables Access
                    </Button>
                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        DebugLogger.info('MANUAL_TEST', 'Testing RPC functions');
                        supabase.rpc('is_admin').then(result => {
                          DebugLogger.logDAOOperation('RPC is_admin', result.data, result.error);
                        });
                      }}
                    >
                      Test RPC Functions
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};



