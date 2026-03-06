import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { ArrowLeft, Diamond, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/api/auth";

interface ForgotPasswordForm {
  email: string;
}

const inputStyles =
  "bg-[#1a1f2e] border-[#2a2f42] text-white placeholder:text-[#8b92a5] h-11 focus-visible:border-[#3B5BDB] focus-visible:ring-[#3B5BDB]/25";

const labelStyles =
  "text-[#8b92a5] text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 block";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError(null);
    try {
      await forgotPassword(data.email);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-b from-[#3B5BDB] to-[#2645c7] flex-col justify-between p-10">
        <div className="flex items-center gap-2.5">
          <Diamond className="size-7 text-white" />
          <span className="text-xl font-bold text-white">Distill</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Master any subject with AI-powered study decks.
          </h1>
          <p className="text-white/60 italic">
            &ldquo;The capacity to learn is a gift; the ability to learn is a
            skill.&rdquo;
          </p>
        </div>
      </div>

      <div className="flex w-full lg:w-[60%] justify-center bg-[#0f1117] px-6 pt-[25vh]">
        <div className="w-full max-w-[400px]">
          {submitted ? (
            <div className="space-y-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#3B5BDB]/10 mb-2">
                <Mail className="size-6 text-[#3B5BDB]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Check your email</h2>
                <p className="text-[#8b92a5] mt-2">
                  If an account exists with that email, you'll receive a reset
                  link shortly.
                </p>
              </div>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 text-sm text-[#3B5BDB] hover:text-[#2645c7] transition-colors"
              >
                <ArrowLeft className="size-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Forgot your password?
                </h2>
                <p className="text-[#8b92a5] mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className={labelStyles}>Email Address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className={inputStyles}
                  {...register("email", { required: true })}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-[#3B5BDB] hover:bg-[#2645c7] text-white font-medium cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 text-sm text-[#3B5BDB] hover:text-[#2645c7] transition-colors"
              >
                <ArrowLeft className="size-4" />
                Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
