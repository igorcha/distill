
import { PRIVACY_POLICY_HTML } from "@/constants/legal";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0f1117]">
            <div className="mx-auto max-w-3xl px-6 py-16">
                <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: PRIVACY_POLICY_HTML }}
                />
            </div>
        </div>
    );
}