// src/pages/TermsPage.tsx
import ReactMarkdown from "react-markdown";
import { TERMS_OF_SERVICE } from "@/constants/legal";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0f1117]">
            <div className="mx-auto max-w-3xl px-6 py-16">
                <div
                    className="prose prose-invert max-w-none
            prose-headings:text-white
            prose-p:text-[#8b92a5]
            prose-li:text-[#8b92a5]
            prose-strong:text-white
            prose-a:text-[#3B5BDB]
            prose-hr:border-[#2a2f42]"
                >
                    <ReactMarkdown>
                        {TERMS_OF_SERVICE}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}