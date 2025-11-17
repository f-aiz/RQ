"use client";

import { useState } from "react";
import TopNav from "@/components/home/TopNav";
import ProductSearchBar from "@/components/products/ProductSearchBar";
import ProductSearchList from "@/components/products/ProductSearchList";
import ProductDetailsPanel from "@/components/products/ProductDetailsPanel";
import ProductAgeAnalysis from "@/components/products/ProductAgeAnalysis";

export default function ProductsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  return (
    <main className="min-h-screen w-full bg-black text-white font-sans">
      <TopNav />

      <div className="pt-32 px-10 max-w-6xl mx-auto space-y-10">

        <h1 className="text-3xl font-bold text-white">Product Analytics</h1>
        
        <ProductAgeAnalysis />


        {/* SEARCH BAR */}
        <ProductSearchBar onResults={setResults} />

        {/* SEARCH RESULTS DROPDOWN */}
        {results.length > 0 && !selectedProduct && (
          <ProductSearchList
            results={results}
            onSelect={setSelectedProduct}
          />
        )}

        {/* PRODUCT DETAILS */}
        {selectedProduct && (
          <ProductDetailsPanel product={selectedProduct} />
        )}

      </div>
    </main>
  );
}
