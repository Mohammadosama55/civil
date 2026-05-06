import { Layout } from "@/components/layout/Layout";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MapPin } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setAuthUser } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate({ data: values }, {
      onSuccess: (response) => {
        setAuthUser(response.user);
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        setLocation("/");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Please check your email and password and try again.",
        });
      }
    });
  }

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
        <Card className="w-full max-w-md border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-primary/10 p-6 flex flex-col items-center justify-center text-center border-b border-primary/10">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-4 shadow-inner">
              <MapPin className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back to Civix</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
              Sign in to your account to continue making an impact.
            </CardDescription>
          </div>
          
          <CardContent className="p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 dark:text-white font-semibold">Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" className="bg-slate-50 dark:bg-slate-900 h-12" {...field} data-testid="input-login-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-slate-900 dark:text-white font-semibold">Password</FormLabel>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="bg-slate-50 dark:bg-slate-900 h-12" {...field} data-testid="input-login-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login-submit"
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 justify-center">
            <p className="text-slate-600 dark:text-slate-400">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline" data-testid="link-to-register">
                Register here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}