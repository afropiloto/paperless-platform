"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileType2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ImportPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.name.endsWith('.tt') || selectedFile.name.endsWith('.json') || selectedFile.type === 'application/json') {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid TradeTrust (.tt) or JSON file.");
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    
    // Simulate reading the file and extracting data
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        
        // Mock delay for "Agent Analysis"
        setTimeout(() => {
          setIsAnalyzing(false);
          
          // Mock parsed response
          setParsedData({
            documentId: "doc-" + Math.random().toString(36).substr(2, 9),
            type: "Bill of Lading",
            reference: content.blNumber || "BL-7823901",
            parties: {
              seller: "Oceanic Freight Ltd",
              buyer: "Global Imports Inc",
            },
            amount: "45000.00",
            currency: "USD",
            isElectronicTransferableRecord: true,
            compliant: true
          });
        }, 1500);
      } catch (err) {
        setIsAnalyzing(false);
        alert("Failed to parse file. Is it a valid JSON/TradeTrust document?");
      }
    };
    reader.readAsText(file);
  };

  const handleProceed = () => {
    // Navigate to settlement page with the mock document ID
    if (parsedData) {
      // In a real app we'd pass this via context/state or create the settlement in backend first
      router.push(`/settlement/${parsedData.documentId}`);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Import Trade Document</h1>
        <p className="text-muted-foreground">
          Upload a tokenised TrustVC document (.tt) or third-party invoice (CargoX / WaveBL) for agentic analysis.
        </p>
      </div>

      {!parsedData ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>Drag and drop your electronic record here</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileType2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">
                {file ? file.name : "Select a document"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {file ? "File selected and ready for analysis" : "Supports .tt and .json files"}
              </p>
              
              {!file && (
                <div className="flex justify-center">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" type="button" onClick={() => document.getElementById('file-upload')?.click()}>
                      <span>Browse Files</span>
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".tt,.json,application/json"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </label>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleAnalyze} 
              disabled={!file || isAnalyzing}
              className="w-full sm:w-auto"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agent Analyzing...
                </>
              ) : (
                <>
                  Analyze via Agent
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-green-500/20 bg-green-50/10">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
              Agent Analysis Complete
            </CardTitle>
            <CardDescription>mLETR compliance validated and terms extracted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Document Type</span>
                <p className="font-medium">{parsedData.type}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Reference</span>
                <p className="font-medium">{parsedData.reference}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Seller (Transferor)</span>
                <p className="font-medium">{parsedData.parties.seller}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Buyer (Transferee)</span>
                <p className="font-medium">{parsedData.parties.buyer}</p>
              </div>
            </div>

            <div className="p-4 bg-background border rounded-lg flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Settlement Amount</span>
                <span className="text-2xl font-bold tracking-tight">
                  {Number(parsedData.amount).toLocaleString()} {parsedData.currency}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm text-muted-foreground block mb-1">mLETR Status</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Transferable eTR
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => { setFile(null); setParsedData(null); }}>
              Upload Different File
            </Button>
            <Button onClick={handleProceed}>
              Proceed to Settlement
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
