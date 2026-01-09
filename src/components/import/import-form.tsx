'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Copy } from 'lucide-react';
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

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export function ImportForm({ categories }: ImportFormProps) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const parsePromptFromCommand = (fullCommand: string): { prompt: string; parameters: string } => {
    // Remove /imagine prompt: prefix if present
    let prompt = fullCommand.replace(/^\/imagine\s+prompt:\s*/i, '').trim();

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

  const importPrompts = async (prompts: string[]) => {
    setIsImporting(true);
    setResult(null);

    const results: ImportResult = { success: 0, failed: 0, skipped: 0, errors: [] };

    // Filter and deduplicate
    const uniquePrompts = [...new Set(prompts.map(p => p.trim()).filter(p => p.length > 5))];

    for (const promptText of uniquePrompts) {
      try {
        const { prompt, parameters } = parsePromptFromCommand(promptText);

        if (!prompt || prompt.length < 3) {
          results.skipped++;
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
            tags: ['imported'],
          }),
        });

        if (!promptResponse.ok) {
          results.failed++;
          results.errors.push(`Failed: ${title.substring(0, 30)}...`);
          continue;
        }

        const createdPrompt = await promptResponse.json();

        // Create Midjourney variant if there are parameters
        if (parameters) {
          await fetch(`/api/prompts/${createdPrompt.id}/variants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: 'midjourney',
              optimized_prompt: prompt,
              parameters: { raw: parameters },
              notes: `Imported on ${new Date().toLocaleDateString()}`,
            }),
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    setResult(results);
    setIsImporting(false);

    if (results.success > 0) {
      toast.success(`Imported ${results.success} prompts`);
    }
  };

  const handleTextImport = async () => {
    // Split by newlines, handle various formats
    const lines = textInput
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      toast.error('No prompts found');
      return;
    }

    await importPrompts(lines);
  };

  const handleCsvImport = async () => {
    try {
      // Try to parse as CSV (from Notion or other sources)
      const lines = textInput.split(/\n/).filter(line => line.trim());

      if (lines.length === 0) {
        toast.error('No data found');
        return;
      }

      // Check if first line is a header
      const firstLine = lines[0].toLowerCase();
      const hasHeader = firstLine.includes('prompt') || firstLine.includes('name') || firstLine.includes('title');

      const dataLines = hasHeader ? lines.slice(1) : lines;
      const prompts: string[] = [];

      for (const line of dataLines) {
        // Handle CSV with quotes
        const match = line.match(/"([^"]+)"/);
        if (match) {
          prompts.push(match[1]);
        } else {
          // Try comma-separated, take the longest field (likely the prompt)
          const fields = line.split(',').map(f => f.trim());
          const longestField = fields.reduce((a, b) => a.length > b.length ? a : b, '');
          if (longestField.length > 10) {
            prompts.push(longestField);
          }
        }
      }

      if (prompts.length === 0) {
        toast.error('Could not parse any prompts from CSV');
        return;
      }

      await importPrompts(prompts);
    } catch {
      toast.error('Failed to parse CSV');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setTextInput(text);
      toast.success(`Loaded ${file.name}`);
    } catch {
      toast.error('Failed to read file');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text">Plain Text</TabsTrigger>
          <TabsTrigger value="gallery">From Gallery</TabsTrigger>
          <TabsTrigger value="csv">CSV / Notion</TabsTrigger>
        </TabsList>

        {/* Plain Text Import */}
        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import from Text</CardTitle>
              <CardDescription>
                Paste your prompts, one per line
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h4 className="font-medium mb-2">Format:</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  One prompt per line. Parameters like <code className="bg-background px-1 rounded">--ar 16:9</code> will be automatically extracted.
                </p>
                <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`a beautiful sunset over mountains --ar 16:9 --v 6
portrait of a woman, soft lighting, studio photo
/imagine prompt: cyberpunk city at night --ar 21:9`}
                </pre>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Default Category</label>
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
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your prompts here, one per line..."
                className="min-h-[200px] font-mono text-sm"
              />

              <Button
                onClick={handleTextImport}
                disabled={isImporting || !textInput.trim()}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Import Prompts
                  </>
                )}
              </Button>

              <ResultDisplay result={result} onViewPrompts={() => router.push('/')} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Copy Instructions */}
        <TabsContent value="gallery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Copy from Midjourney Gallery</CardTitle>
              <CardDescription>
                Manually copy prompts from your Midjourney gallery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h4 className="font-medium mb-2">How to copy from Midjourney:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to <a href="https://www.midjourney.com/imagine" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">midjourney.com/imagine</a></li>
                  <li>Sign in and go to your gallery</li>
                  <li>Click on an image to open it</li>
                  <li>Click the <strong>Copy</strong> button (or <kbd className="px-1.5 py-0.5 bg-background rounded border text-xs">...</kbd> → Copy → Prompt)</li>
                  <li>Paste the prompt below</li>
                  <li>Repeat for each prompt you want to import</li>
                </ol>
              </div>

              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                <h4 className="font-medium mb-2 text-amber-500">Tip: Use Prompt Hunter Extension</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Install the <a href="https://chromewebstore.google.com/detail/midjourney-prompt-hunter/bjdnhgolddapgkagnbhnnaaoejjnhfgc" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Midjourney Prompt Hunter</a> Chrome extension to bulk capture prompts to Notion, then export as CSV.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Default Category</label>
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
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste copied prompts here (one per line)..."
                className="min-h-[200px] font-mono text-sm"
              />

              <Button
                onClick={handleTextImport}
                disabled={isImporting || !textInput.trim()}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Import Prompts
                  </>
                )}
              </Button>

              <ResultDisplay result={result} onViewPrompts={() => router.push('/')} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV / Notion Import */}
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import from CSV / Notion</CardTitle>
              <CardDescription>
                Import from Notion export or any CSV file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h4 className="font-medium mb-2">How to export from Notion:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Open your Notion database with prompts</li>
                  <li>Click <strong>...</strong> (three dots) in the top right</li>
                  <li>Select <strong>Export</strong></li>
                  <li>Choose <strong>CSV</strong> format</li>
                  <li>Upload the file below or paste the contents</li>
                </ol>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Upload CSV file</label>
                <label className="block">
                  <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary hover:bg-muted/50">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Drop your CSV file here or click to browse
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Default Category</label>
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
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste CSV data here..."
                className="min-h-[200px] font-mono text-sm"
              />

              <Button
                onClick={handleCsvImport}
                disabled={isImporting || !textInput.trim()}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Import from CSV
                  </>
                )}
              </Button>

              <ResultDisplay result={result} onViewPrompts={() => router.push('/')} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResultDisplay({ result, onViewPrompts }: { result: ImportResult | null; onViewPrompts: () => void }) {
  if (!result) return null;

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center gap-4">
        {result.success > 0 && (
          <div className="flex items-center gap-1 text-green-500">
            <CheckCircle className="h-4 w-4" />
            <span>{result.success} imported</span>
          </div>
        )}
        {result.skipped > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>{result.skipped} skipped</span>
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
          {result.errors.slice(0, 3).map((err, i) => (
            <li key={i}>{err}</li>
          ))}
          {result.errors.length > 3 && (
            <li>...and {result.errors.length - 3} more</li>
          )}
        </ul>
      )}
      {result.success > 0 && (
        <Button variant="outline" size="sm" onClick={onViewPrompts}>
          View Imported Prompts
        </Button>
      )}
    </div>
  );
}
