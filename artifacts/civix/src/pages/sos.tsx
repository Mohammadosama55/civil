import Layout from "@/components/layout/Layout";
import { AlertTriangle, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTriggerSOS } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const sosSchema = z.object({
  location: z.string().min(5, "Please provide a specific location"),
  description: z.string().min(10, "Please describe the emergency"),
  contactName: z.string().optional(),
});

export default function SOS() {
  const { toast } = useToast();
  const triggerSOS = useTriggerSOS();

  const form = useForm<z.infer<typeof sosSchema>>({
    resolver: zodResolver(sosSchema),
    defaultValues: {
      location: "",
      description: "",
      contactName: "",
    },
  });

  function onSubmit(values: z.infer<typeof sosSchema>) {
    triggerSOS.mutate({ data: values }, {
      onSuccess: () => {
        toast({
          variant: "destructive",
          title: "SOS Alert Sent",
          description: "Emergency services and local authorities have been notified.",
        });
        form.reset();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Failed to send alert",
          description: "Please try again or call emergency services directly.",
        });
      }
    });
  }

  return (
    <Layout>
      <div className="flex-1 w-full bg-red-50 dark:bg-red-950/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-red-200 dark:border-red-900/50 shadow-2xl overflow-hidden relative">
            {/* Red header area */}
            <div className="bg-red-600 p-8 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg animate-pulse">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-4xl font-black uppercase tracking-wider mb-2">Emergency SOS</h1>
                <p className="text-red-100 font-medium text-lg">
                  Use this only for severe civic emergencies requiring immediate attention.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-10">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl p-4 mb-8 flex gap-4 items-start">
                <Phone className="w-6 h-6 text-red-600 shrink-0 mt-1" />
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  If you or someone else is in immediate physical danger, call 911 directly. This form notifies local civic authorities (public works, non-emergency police) for critical infrastructure issues.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500" />
                          Exact Location <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="E.g., Intersection of Main St & 5th Ave" 
                            className="h-14 bg-slate-50 dark:bg-slate-950 border-slate-200 focus-visible:ring-red-500 text-lg" 
                            {...field} 
                            data-testid="input-sos-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-900 dark:text-white font-bold">
                          Describe the Emergency <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="E.g., Massive sinkhole opened up, car stuck, water main broken..." 
                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 focus-visible:ring-red-500 min-h-[120px] resize-none text-base" 
                            {...field} 
                            data-testid="input-sos-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-900 dark:text-white font-bold">Your Name (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John Doe" 
                            className="h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 focus-visible:ring-red-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-16 text-xl font-black bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all uppercase tracking-wider mt-4" 
                    disabled={triggerSOS.isPending}
                    data-testid="button-sos-submit"
                  >
                    {triggerSOS.isPending ? "Sending Alert..." : "Send Emergency Alert"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}