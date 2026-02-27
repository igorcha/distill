import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { Diamond, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
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

function LoginTab() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Login failed. Please try again.";
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Welcome back</h2>
        <p className="text-[#8b92a5] mt-1">
          Please enter your details to sign in.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className={labelStyles}>Email Address</label>
          <Input
            type="email"
            placeholder="you@example.com"
            className={inputStyles}
            {...register("email", { required: true })}
          />
        </div>

        <div>
          <label className={labelStyles}>Password</label>
          <PasswordInput
            placeholder="Enter your password"
            className={inputStyles}
            {...register("password", { required: true })}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 bg-[#3B5BDB] hover:bg-[#2645c7] text-white font-medium cursor-pointer"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Sign In"}
      </Button>
    </form>
  );
}

function RegisterTab() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    try {
      await registerUser(
        data.email,
        data.password,
        data.first_name,
        data.last_name
      );
      navigate("/dashboard");
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: Record<string, unknown> } })
        ?.response?.data;
      if (resp) {
        const firstError = Object.values(resp).flat()[0];
        if (typeof firstError === "string") {
          setError(firstError);
        } else {
          setError("Registration failed. Please try again.");
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Create your account</h2>
        <p className="text-[#8b92a5] mt-1">Start learning smarter today.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelStyles}>First Name</label>
            <Input
              placeholder="Jane"
              className={inputStyles}
              {...register("first_name", { required: true })}
            />
          </div>
          <div>
            <label className={labelStyles}>Last Name</label>
            <Input
              placeholder="Doe"
              className={inputStyles}
              {...register("last_name", { required: true })}
            />
          </div>
        </div>

        <div>
          <label className={labelStyles}>Email Address</label>
          <Input
            type="email"
            placeholder="you@example.com"
            className={inputStyles}
            {...register("email", { required: true })}
          />
        </div>

        <div>
          <label className={labelStyles}>Password</label>
          <PasswordInput
            placeholder="Create a password"
            className={inputStyles}
            {...register("password", { required: true })}
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
          "Create Account"
        )}
      </Button>
    </form>
  );
}

export default function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

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
          <Tabs defaultValue="login">
            <TabsList className="w-full bg-[#1a1f2e] h-11 rounded-lg p-1 mb-8">
              <TabsTrigger
                value="login"
                className="flex-1 h-full rounded-md text-sm font-medium text-[#8b92a5] data-[state=active]:bg-[#2a2f42] data-[state=active]:text-white data-[state=active]:shadow-none cursor-pointer"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 h-full rounded-md text-sm font-medium text-[#8b92a5] data-[state=active]:bg-[#2a2f42] data-[state=active]:text-white data-[state=active]:shadow-none cursor-pointer"
              >
                Register
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginTab />
            </TabsContent>
            <TabsContent value="register">
              <RegisterTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
