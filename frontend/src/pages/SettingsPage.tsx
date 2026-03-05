import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import UpgradeCards from "@/components/UpgradeCards";
import { useMe, useProfile, useUpdateMe } from "@/hooks/useProfile";
import { useBillingPortal } from "@/hooks/useBilling";

const inputStyles =
  "bg-[#1a1f2e] border-[#2a2f42] text-white placeholder:text-[#8b92a5] h-11 focus-visible:border-[#3B5BDB] focus-visible:ring-[#3B5BDB]/25";

const labelStyles =
  "text-[#8b92a5] text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 block";

interface ProfileForm {
  first_name: string;
  last_name: string;
  email: string;
}

function ProfileCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#2a2f42] bg-[#1a1f2e] p-6">
      <div className="h-5 w-16 animate-pulse rounded bg-[#2a2f42]" />
      <Separator className="my-4 bg-[#2a2f42]" />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1.5 h-3 w-20 animate-pulse rounded bg-[#2a2f42]" />
            <div className="h-11 animate-pulse rounded-md bg-[#2a2f42]" />
          </div>
          <div>
            <div className="mb-1.5 h-3 w-20 animate-pulse rounded bg-[#2a2f42]" />
            <div className="h-11 animate-pulse rounded-md bg-[#2a2f42]" />
          </div>
        </div>
        <div>
          <div className="mb-1.5 h-3 w-12 animate-pulse rounded bg-[#2a2f42]" />
          <div className="h-11 animate-pulse rounded-md bg-[#2a2f42]" />
        </div>
      </div>
    </div>
  );
}

function ProfileCard() {
  const { data: user, isLoading } = useMe();
  const updateMe = useUpdateMe();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProfileForm>();

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateMe.mutateAsync(data);
      toast.success("Profile updated.");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  if (isLoading) return <ProfileCardSkeleton />;

  return (
    <div className="rounded-xl border border-[#2a2f42] bg-[#1a1f2e] p-6">
      <h2 className="text-base font-semibold text-white">Profile</h2>
      <Separator className="my-4 bg-[#2a2f42]" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelStyles}>First Name</label>
            <Input
              className={inputStyles}
              placeholder="First name"
              {...register("first_name")}
            />
          </div>
          <div>
            <label className={labelStyles}>Last Name</label>
            <Input
              className={inputStyles}
              placeholder="Last name"
              {...register("last_name")}
            />
          </div>
        </div>

        <div>
          <label className={labelStyles}>Email</label>
          <Input
            type="email"
            className={inputStyles}
            placeholder="you@example.com"
            {...register("email", { required: true })}
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
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function BillingCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#2a2f42] bg-[#1a1f2e] p-6">
      <div className="flex items-center justify-between">
        <div className="h-5 w-16 animate-pulse rounded bg-[#2a2f42]" />
        <div className="h-5 w-12 animate-pulse rounded-full bg-[#2a2f42]" />
      </div>
      <Separator className="my-4 bg-[#2a2f42]" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 animate-pulse rounded bg-[#2a2f42]" />
          <div className="h-4 w-14 animate-pulse rounded bg-[#2a2f42]" />
        </div>
        <div className="h-2 animate-pulse rounded-full bg-[#2a2f42]" />
      </div>
      <div className="mt-6 h-9 animate-pulse rounded-md bg-[#2a2f42]" />
    </div>
  );
}

function BillingCard() {
  const { data: profile, isLoading } = useProfile();
  const portal = useBillingPortal();

  const isPro = profile?.tier === "pro";
  const used = profile?.monthly_credits_used ?? 0;
  const limit = profile?.credits_limit ?? 10;
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  if (isLoading) return <BillingCardSkeleton />;

  return (
    <div className="rounded-xl border border-[#2a2f42] bg-[#1a1f2e] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Billing</h2>
        <Badge
          variant="secondary"
          className={`border-none text-xs ${isPro
            ? "bg-[#3B5BDB]/20 text-[#3B5BDB]"
            : "bg-[#2a2f42] text-[#8b92a5]"
            }`}
        >
          {isPro ? "Pro" : "Free"}
        </Badge>
      </div>
      <Separator className="my-4 bg-[#2a2f42]" />

      {/* Credits usage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#8b92a5]">Monthly credits</span>
          <span className="text-white">
            {used} / {limit}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#2a2f42]">
          <div
            className="h-2 rounded-full bg-[#3B5BDB] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Plan actions */}
      <div className="mt-6">
        {isPro ? (
          <Button
            onClick={() => portal.mutate()}
            disabled={portal.isPending}
            className="w-full border-[#2a2f42] bg-transparent text-[#8b92a5] hover:bg-[#2a2f42] hover:text-white cursor-pointer"
            variant="outline"
          >
            {portal.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Manage Subscription"
            )}
          </Button>
        ) : (
          <UpgradeCards />
        )}
      </div>

      {/* Delete account */}
      <Separator className="my-6 bg-[#2a2f42]" />
      <p className="text-sm text-[#8b92a5]">
        Please contact support if you want to delete your account.
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("You're now on Distill Pro!");
      setSearchParams({}, { replace: true });
    } else if (searchParams.get("canceled") === "true") {
      toast("Checkout canceled.");
      setSearchParams({}, { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-4xl font-bold text-white">Settings</h1>
        <p className="mt-1.5 text-lg text-[#8b92a5]">
          Manage your account and subscription.
        </p>

        <div className="mt-8 space-y-6">
          <ProfileCard />
          <BillingCard />
        </div>
      </main>
    </div>
  );
}
