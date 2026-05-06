import { Layout } from "@/components/layout/Layout";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MapPin } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
  location: z.string().optional(),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { login: setAuthUser } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      name: "",
      location: "",
    },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate({ data: values }, {
      onSuccess: (response) => {
        setAuthUser(response.user);
        toast({
          title: "Account created!",
          description: "Welcome to Civix. Let's make an impact together.",
        });
        setLocation("/");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.error || "Please check your details and try again.",
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
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Join Civix</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
              Create an account to start reporting issues and voting.
            </CardDescription>
          </div>
          
          <CardContent className="p-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 dark:text-white font-semibold">Username</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" className="bg-slate-50 dark:bg-slate-900 h-12" {...field} data-testid="input-register-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 dark:text-white font-semibold">Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" className="bg-slate-50 dark:bg-slate-900 h-12" {...field} data-testid="input-register-email" />
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
                      <FormLabel className="text-slate-900 dark:text-white font-semibold">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="bg-slate-50 dark:bg-slate-900 h-12" {...field} data-testid="input-register-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white" 
                  disabled={registerMutation.isPending}
                  data-testid="button-register-submit"
                >
                  {registerMutation.isPending ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 justify-center">
            <p className="text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline" data-testid="link-to-login">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}