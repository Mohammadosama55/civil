import Layout from "@/components/layout/Layout";
import { Mail, Phone, Clock, MessageSquare, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSendContactMessage } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function Contact() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const sendMessage = useSendContactMessage();

  function onSubmit(values: z.infer<typeof contactSchema>) {
    sendMessage.mutate({ data: values }, {
      onSuccess: () => {
        toast({
          title: "Message Sent",
          description: "We've received your message and will get back to you soon.",
        });
        form.reset();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to send message. Please try again.",
        });
      }
    });
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold text-primary mb-4">Contact Us</h1>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Have a question, suggestion, or experiencing a technical issue? We're here to help make Civix better for everyone.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <Mail className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Email</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-1">support@civix.city</p>
                <p className="text-slate-600 dark:text-slate-400">hello@civix.city</p>
              </div>
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <Clock className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Response Time</h3>
                <p className="text-slate-600 dark:text-slate-400">We aim to respond to all inquiries within 24-48 hours during business days.</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Why Contact Us?</h3>
              <ul className="space-y-3">
                {[
                  "Report a bug or technical issue on the platform",
                  "Partnership inquiries from local governments",
                  "Suggest a new feature for the community",
                  "Questions about our data privacy policies"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg relative">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-primary/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Send us a Message</h2>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 dark:text-white font-semibold">Your Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-12" {...field} data-testid="input-contact-name" />
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
                        <Input type="email" placeholder="john@example.com" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-12" {...field} data-testid="input-contact-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 dark:text-white font-semibold">Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How can we help you?" 
                          className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 min-h-[150px] resize-none" 
                          {...field} 
                          data-testid="input-contact-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white" 
                  disabled={sendMessage.isPending}
                  data-testid="button-contact-submit"
                >
                  {sendMessage.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>
          </div>
          
        </div>
      </div>
    </Layout>
  );
}