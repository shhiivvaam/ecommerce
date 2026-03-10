"use client";

import Link from "next/link";
import { Search, Package, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const buttonStyles = "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors";
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 font-body"
         style={{ background: "var(--paper, #f5f3ef)", color: "var(--ink, #0a0a0a)" }}>
      <div className="text-center max-w-md">
        <div className="mb-8">
          <Package 
            size={64} 
            className="mx-auto mb-4" 
            style={{ color: "#c8ff00" }}
          />
          <h1 
            className="font-display uppercase font-black mb-4"
            style={{ fontSize: "clamp(32px, 6vw, 64px)", letterSpacing: "-.02em" }}
          >
            Page Not Found
          </h1>
          <p 
            className="mb-6"
            style={{ color: "var(--mid, #8a8a8a)", fontSize: 18, fontWeight: 300, lineHeight: 1.6 }}
          >
            The page you&apos;re looking for doesn&apos;t exist or has been moved. 
            Let&apos;s get you back on track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className={`${buttonStyles} bg-blue-600 text-white hover:bg-blue-700`}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          
          <Link
            href="/products"
            className={`${buttonStyles} border border-gray-300 text-gray-700 hover:bg-gray-50`}
          >
            <Search size={16} />
            Browse Products
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p style={{ fontSize: 14, color: "var(--mid, #8a8a8a)" }}>
            If you believe this is an error, please contact our support team.
          </p>
          <Link 
            href="/"
            className="inline-block mt-2 text-sm hover:underline"
            style={{ color: "#c8ff00" }}
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  );
}
