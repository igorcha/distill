import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/api/contact";
import { useAuth } from "@/contexts/AuthContext";

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const inputStyles =
  "bg-[#1a1f2e] border-[#2a2f42] text-white placeholder:text-[#8b92a5] h-11 focus-visible:border-[#3B5BDB] focus-visible:ring-[#3B5BDB]/25";

const textareaStyles =
  "bg-[#1a1f2e] border-[#2a2f42] text-white placeholder:text-[#8b92a5] focus-visible:border-[#3B5BDB] focus-visible:ring-[#3B5BDB]/25 min-h-[140px] resize-none";

const labelStyles =
  "text-[#8b92a5] text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 block";

export default function ContactPage() {
  const { isAuthenticated } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ContactForm>();

  const onSubmit = async (data: ContactForm) => {
    setError(null);
    try {
      await sendContactMessage(data);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {isAuthenticated && <Navbar />}
      <main className="mx-auto max-w-2xl px-6 py-10">
        {!isAuthenticated && (
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#3B5BDB] hover:text-[#2645c7] transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        )}

        <h1 className="text-4xl font-bold text-white">Contact Us</h1>
        <p className="mt-1.5 text-lg text-[#8b92a5]">
          Have a question or feedback? We'd love to hear from you.
        </p>

        <div className="mt-8">
          {submitted ? (
            <div className="rounded-xl border border-[#2a2f42] bg-[#1a1f2e] p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10">
                  <CheckCircle className="size-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Message sent</h2>
              </div>
              <p className="text-[#8b92a5]">
                Thanks for reaching out! We'll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#2a2f42] bg-[#1a1f2e] p-6">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className={labelStyles}>Name</label>
                  <Input
                    placeholder="Your name"
                    className={inputStyles}
                    {...register("name", { required: true })}
                  />
                </div>

                <div>
                  <label className={labelStyles}>Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className={inputStyles}
                    {...register("email", { required: true })}
                  />
                </div>

                <div>
                  <label className={labelStyles}>Subject</label>
                  <Input
                    placeholder="What's this about?"
                    className={inputStyles}
                    {...register("subject", { required: true })}
                  />
                </div>

                <div>
                  <label className={labelStyles}>Message</label>
                  <Textarea
                    placeholder="How can we help?"
                    className={textareaStyles}
                    {...register("message", { required: true })}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#3B5BDB] hover:bg-[#2645c7] text-white cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
