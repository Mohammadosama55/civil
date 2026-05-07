import Layout from "@/components/layout/Layout";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUpdateProfile, useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, Award, CheckSquare, AlertCircle } from "lucide-react";
import { useEffect } from "react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  location: z.string().min(2, "Location must be at least 2 characters").optional(),
  bio: z.string().max(200, "Bio cannot exceed 200 characters").optional(),
});

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const updateProfileMutation = useUpdateProfile();
  const logoutMutation = useLogout();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      location: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        location: user.location || "",
        bio: user.bio || "",
      });
    }
  }, [user, form]);

  if (!user) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Not Logged In</h2>
          <p className="text-slate-500 mb-6">Please log in to view your profile.</p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  function onSubmit(values: z.infer<typeof profileSchema>) {
    updateProfileMutation.mutate({ data: values }, {
      onSuccess: (updatedUser) => {
        updateUser(updatedUser);
        toast({
          title: "Profile Updated",
          description: "Your profile information has been saved.",
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Could not update your profile. Please try again.",
        });
      }
    });
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
        toast({ title: "Logged Out", description: "You have successfully logged out." });
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto w-full px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Sidebar - Profile Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center shadow-sm">
              <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white dark:border-slate-800 shadow-md">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name || user.username}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">@{user.username}</p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm font-semibold mb-6 border border-emerald-200 dark:border-emerald-800">
                <Award className="w-4 h-4" />
                Active Citizen
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{user.issueCount || 0}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Issues</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">0</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Votes</div>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-900/20"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Log Out"}
            </Button>
          </div>

          {/* Right Area - Edit Form */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Settings className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h3>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="bg-slate-50 dark:bg-slate-950" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Location / Neighborhood</FormLabel>
                          <FormControl>
                            <Input placeholder="Downtown" className="bg-slate-50 dark:bg-slate-950" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell the community a bit about yourself..." 
                            className="bg-slate-50 dark:bg-slate-950 resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="submit" 
                      className="px-8 font-semibold bg-primary hover:bg-primary/90 text-white"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}