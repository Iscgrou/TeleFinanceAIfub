import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, Database, TestTube, MessageSquare } from "lucide-react";

interface SampleCommand {
  category: string;
  commands: string[];
}

interface TestResult {
  command: string;
  result: string;
}

export default function DemoPage() {
  const [testCommand, setTestCommand] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sample commands
  const { data: sampleCommands, isLoading: loadingCommands } = useQuery({
    queryKey: ["/api/demo/sample-commands"],
  });

  // Create sample data mutation
  const createSampleDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/demo/create-sample-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to create sample data");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sample data created",
        description: "Test data has been successfully created in the database",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create sample data",
        variant: "destructive",
      });
    },
  });

  // Test AI agent mutation
  const testAIMutation = useMutation({
    mutationFn: async (command: string) => {
      const response = await fetch("/api/demo/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      if (!response.ok) throw new Error("Failed to test AI agent");
      return response.json();
    },
    onSuccess: (data) => {
      setTestResults(prev => [...prev, { command: data.command, result: data.result }]);
      setTestCommand("");
      toast({
        title: "AI Response Generated",
        description: "The AI agent has processed your command",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process AI command",
        variant: "destructive",
      });
    },
  });

  const handleTestCommand = () => {
    if (!testCommand.trim()) return;
    testAIMutation.mutate(testCommand);
  };

  const handleQuickTest = (command: string) => {
    testAIMutation.mutate(command);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <TestTube className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">AI Agent Demo & Testing</h1>
          <p className="text-muted-foreground">
            Test the advanced AI capabilities of your financial management system
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setup Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Test Data Setup</span>
            </CardTitle>
            <CardDescription>
              Create sample data to demonstrate AI agent capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => createSampleDataMutation.mutate()}
              disabled={createSampleDataMutation.isPending}
              className="w-full"
            >
              {createSampleDataMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Sample Data...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Create Sample Data
                </>
              )}
            </Button>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>This will create:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>2 Sales Colleagues with different commission rates</li>
                <li>3 Representatives with varying debt levels</li>
                <li>Sample invoices and payments</li>
                <li>Test data for commission calculations</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* AI Testing Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>AI Agent Testing</span>
            </CardTitle>
            <CardDescription>
              Test complex AI commands in Persian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter your command in Persian (فارسی) or English..."
                value={testCommand}
                onChange={(e) => setTestCommand(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleTestCommand}
                disabled={testAIMutation.isPending || !testCommand.trim()}
                className="w-full"
              >
                {testAIMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Command...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Test AI Command
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Commands</CardTitle>
          <CardDescription>
            Click on any command to test the AI agent's capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCommands ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {sampleCommands?.sampleCommands?.map((category: SampleCommand, index: number) => (
                <div key={index}>
                  <Badge variant="outline" className="mb-3">
                    {category.category}
                  </Badge>
                  <div className="grid grid-cols-1 gap-2">
                    {category.commands.map((command: string, cmdIndex: number) => (
                      <Button
                        key={cmdIndex}
                        variant="ghost"
                        className="justify-start h-auto p-3 text-right"
                        onClick={() => handleQuickTest(command)}
                        disabled={testAIMutation.isPending}
                      >
                        <span className="text-sm">{command}</span>
                      </Button>
                    ))}
                  </div>
                  {index < sampleCommands.sampleCommands.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              AI agent responses to your commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="mb-2">
                    <Badge variant="secondary" className="text-xs">
                      Command
                    </Badge>
                    <p className="mt-1 text-sm font-medium text-right">
                      {result.command}
                    </p>
                  </div>
                  <div>
                    <Badge variant="default" className="text-xs">
                      AI Response
                    </Badge>
                    <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap text-right">
                      {result.result}
                    </div>
                  </div>
                </div>
              )).reverse()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}