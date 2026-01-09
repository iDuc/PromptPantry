'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileJson, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface ImportFormProps {
  categories: Category[];
}

interface MidjourneyJob {
  id: string;
  prompt: string;
  full_command?: string;
  timestamp?: string;
  image_paths?: string[];
  reference_job_id?: string;
  event_type?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export function ImportForm({ categories }: ImportFormProps) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const parsePromptFromCommand = (fullCommand: string): { prompt: string; parameters: string } => {
    // Remove /imagine prompt: prefix if present
    let prompt = fullCommand.replace(/^\/imagine\s+prompt:\s*/i, '');

    // Extract parameters (--ar, --v, --style, etc.)
    const paramMatch = prompt.match(/(--[\w\s:.]+)+$/);
    const parameters = paramMatch ? paramMatch[0].trim() : '';

    // Remove parameters from prompt
    if (parameters) {
      prompt = prompt.replace(parameters, '').trim();
    }

    return { prompt, parameters };
  };

  const extractTitleFromPrompt = (prompt: string): string => {
    // Take first 50 chars, cut at last space, capitalize first letter
    const truncated = prompt.substring(0, 50);
    const lastSpace = truncated.lastIndexOf(' ');
    const title = lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated;
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  const importMidjourneyData = async (jobs: MidjourneyJob[]) => {
    setIsImporting(true);
    setResult(null);

    const results: ImportResult = { success: 0, failed: 0, errors: [] };

    // Filter to only imagine jobs (not upscales, variations, etc.)
    const imagineJobs = jobs.filter(
      (job) => !job.event_type || job.event_type === 'imagine'
    );

    // Group by prompt to avoid duplicates
    const uniquePrompts = new Map<string, MidjourneyJob>();
    for (const job of imagineJobs) {
      const promptText = job.full_command || job.prompt;
      if (promptText && !uniquePrompts.has(promptText)) {
        uniquePrompts.set(promptText, job);
      }
    }

    for (const [, job] of uniquePrompts) {
      try {
        const promptText = job.full_command || job.prompt;
        const { prompt, parameters } = parsePromptFromCommand(promptText);

        if (!prompt || prompt.length < 3) {
          results.failed++;
          continue;
        }

        const title = extractTitleFromPrompt(prompt);

        // Create the prompt
        const promptResponse = await fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            base_prompt: prompt,
            category_id: defaultCategoryId || null,
            tags: ['midjourney', 'imported'],
          }),
        });

        if (!promptResponse.ok) {
          results.failed++;
          results.errors.push(`Failed to import: ${title.substring(0, 30)}...`);
          continue;
        }

        const createdPrompt = await promptResponse.json();

        // Create Midjourney variant with parameters
        if (parameters) {
          await fetch(`/api/prompts/${createdPrompt.id}/variants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: 'midjourney',
              optimized_prompt: prompt,
              parameters: { raw: parameters },
              notes: `Imported from Midjourney on ${new Date().toLocaleDateString()}`,
            }),
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setResult(results);
    setIsImporting(false);

    if (results.success > 0) {
      toast.success(`Successfully imported ${results.success} prompts`);
    }
    if (results.failed > 0) {
      toast.error(`Failed to import ${results.failed} prompts`);
    }
  };

  const handleJsonImport = async () => {
    try {
      const data = JSON.parse(jsonInput);

      // Handle different JSON formats
      let jobs: MidjourneyJob[] = [];

      if (Array.isArray(data)) {
        jobs = data;
      } else if (data.jobs && Array.isArray(data.jobs)) {
        jobs = data.jobs;
      } else if (data.prompts && Array.isArray(data.prompts)) {
        // Simple format: { prompts: ["prompt1", "prompt2"] }
        jobs = data.prompts.map((p: string, i: number) => ({
          id: `import-${i}`,
          prompt: p,
        }));
      } else {
        throw new Error('Unrecognized JSON format');
      }

      if (jobs.length === 0) {
        toast.error('No prompts found in the JSON data');
        return;
      }

      await importMidjourneyData(jobs);
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON format. Please check your input.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Import failed');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setJsonInput(text);
      toast.success(`Loaded ${file.name}`);
    } catch {
      toast.error('Failed to read file');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="midjourney" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="midjourney">Midjourney</TabsTrigger>
          <TabsTrigger value="json">JSON / CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="midjourney" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import from Midjourney</CardTitle>
              <CardDescription>
                Export your Midjourney history and paste the JSON here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h4 className="font-medium mb-2">How to export from Midjourney:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to <a href="https://www.midjourney.com/archive" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">midjourney.com/archive</a></li>
                  <li>Sign in with your Discord account</li>
                  <li>Click on <strong>Settings</strong> (gear icon) in the top right</li>
                  <li>Scroll down to <strong>Request Data Export</strong></li>
                  <li>Wait for the email with your data download link</li>
                  <li>Download and unzip the archive</li>
                  <li>Find the <code className="bg-muted px-1 rounded">prompts.json</code> file</li>
                  <li>Upload it below or paste the contents</li>
                </ol>
              </div>

              {/* Default Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Category (optional)</label>
                <Select value={defaultCategoryId} onValueChange={setDefaultCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload JSON file</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1">
                    <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-muted/50">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Drop your prompts.json here or click to browse
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* JSON Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Or paste JSON data</label>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='[{"prompt": "a beautiful sunset...", "full_command": "/imagine prompt: a beautiful sunset --ar 16:9"}]'
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              {/* Import Button */}
              <Button
                onClick={handleJsonImport}
                disabled={isImporting || !jsonInput.trim()}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileJson className="mr-2 h-4 w-4" />
                    Import Prompts
                  </>
                )}
              </Button>

              {/* Results */}
              {result && (
                <div className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    {result.success > 0 && (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="h-4 w-4" />
                        <span>{result.success} imported</span>
                      </div>
                    )}
                    {result.failed > 0 && (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{result.failed} failed</span>
                      </div>
                    )}
                  </div>
                  {result.errors.length > 0 && (
                    <ul className="text-sm text-muted-foreground">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>...and {result.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/')}
                  >
                    View Imported Prompts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import from JSON</CardTitle>
              <CardDescription>
                Import prompts from a custom JSON format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h4 className="font-medium mb-2">Supported formats:</h4>
                <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`// Array of prompts
[
  { "prompt": "your prompt text", "full_command": "optional full command" },
  { "prompt": "another prompt" }
]

// Simple list
{ "prompts": ["prompt 1", "prompt 2", "prompt 3"] }

// With jobs wrapper
{ "jobs": [{ "prompt": "...", "timestamp": "..." }] }`}
                </pre>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Default Category (optional)</label>
                <Select value={defaultCategoryId} onValueChange={setDefaultCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your JSON here..."
                className="min-h-[200px] font-mono text-sm"
              />

              <Button
                onClick={handleJsonImport}
                disabled={isImporting || !jsonInput.trim()}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileJson className="mr-2 h-4 w-4" />
                    Import Prompts
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
