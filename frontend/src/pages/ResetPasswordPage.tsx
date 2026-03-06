import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, Diamond, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/api/auth";

interface ResetPasswordForm {
  new_password: string;
  confirm_password: string;
}

function PasswordInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={className} {...props} />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b92a5] hover:text-white transition-colors"
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

const inputStyles =
  "bg-[#1a1f2e] border-[#2a2f42] text-white placeholder:text-[#8b92a5] h-11 focus-visible:border-[#3B5BDB] focus-visible:ring-[#3B5BDB]/25";

const labelStyles =
  "text-[#8b92a5] text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 block";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordForm>();

  const onSubmit = async (data: ResetPasswordForm) => {
    setError(null);

    if (data.new_password !== data.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (!uid || !token) {
      setError("Invalid reset link.");
      return;
    }

    try {
      await resetPassword(uid, token, data.new_password);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Something went wrong. Please try again.";
      setError(message);
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
          {success ? (
            <div className="space-y-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 mb-2">
                <CheckCircle className="size-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Password reset successful
                </h2>
                <p className="text-[#8b92a5] mt-2">
                  Your password has been updated. You can now log in with your
                  new password.
                </p>
              </div>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 text-sm text-[#3B5BDB] hover:text-[#2645c7] transition-colors"
              >
                <ArrowLeft className="size-4" />
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Set a new password
                </h2>
                <p className="text-[#8b92a5] mt-1">
                  Enter your new password below.
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={labelStyles}>New Password</label>
                  <PasswordInput
                    placeholder="Enter new password"
                    className={inputStyles}
                    {...register("new_password", { required: true, minLength: 8 })}
                  />
                </div>

                <div>
                  <label className={labelStyles}>Confirm Password</label>
                  <PasswordInput
                    placeholder="Confirm new password"
                    className={inputStyles}
                    {...register("confirm_password", { required: true })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-[#3B5BDB] hover:bg-[#2645c7] text-white font-medium cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Reset Password"
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
