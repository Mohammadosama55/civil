import { Layout } from "@/components/layout/Layout";
import { MessageSquare, Angry, Frown, Meh, Smile, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSubmitFeedback } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const feedbackSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  rating: z.number().min(1).max(5),
  message: z.string().min(1, "Feedback message is required").max(500, "Maximum 500 characters allowed"),
});

export default function Feedback() {
  const { toast } = useToast();
  const submitFeedback = useSubmitFeedback();

  const form = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      category: "",
      rating: 0,
      message: "",
    },
  });

  const messageVal = form.watch("message");

  const ratingEmojis = [
    { value: 1, icon: Angry, color: "text-red-500", label: "Angry" },
    { value: 2, icon: Frown, color: "text-orange-500", label: "Frown" },
    { value: 3, icon: Meh, color: "text-yellow-500", label: "Meh" },
    { value: 4, icon: Smile, color: "text-emerald-500", label: "Smile" },
    { value: 5, icon: Heart, color: "text-rose-500", label: "Love" },
  ];

  function onSubmit(values: z.infer<typeof feedbackSchema>) {
    submitFeedback.mutate({ data: values }, {
      onSuccess: () => {
        toast({
          title: "Feedback Submitted",
          description: "Thank you for sharing your voice! Your feedback helps us improve.",
        });
        form.reset();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
        });
      }
    });
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">Share Your Voice</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Tell us about your experience using Civix. We read every submission.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Optional Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 dark:text-white font-semibold">Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" {...field} data-testid="input-feedback-name" />
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
                      <FormLabel className="text-slate-900 dark:text-white font-semibold">Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" {...field} data-testid="input-feedback-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 dark:text-white font-semibold">Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1 (555) 000-0000" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" {...field} data-testid="input-feedback-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900 dark:text-white font-semibold">Category <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-12" data-testid="select-feedback-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="usability">Usability / Design</SelectItem>
                        <SelectItem value="content">Content Accuracy</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rating */}
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900 dark:text-white font-semibold">How would you rate your experience? <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="flex justify-between sm:justify-start sm:gap-6 py-2">
                        {ratingEmojis.map((emoji) => {
                          const Icon = emoji.icon;
                          const isSelected = field.value === emoji.value;
                          return (
                            <button
                              key={emoji.value}
                              type="button"
                              onClick={() => field.onChange(emoji.value)}
                              className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all border-2",
                                isSelected 
                                  ? "border-primary bg-primary/5 scale-110 shadow-sm" 
                                  : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105"
                              )}
                              data-testid={`button-rating-${emoji.value}`}
                            >
                              <Icon className={cn("w-10 h-10", isSelected ? emoji.color : "text-slate-400")} />
                              <span className={cn("text-xs font-medium", isSelected ? "text-primary" : "text-slate-500")}>
                                {emoji.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-900 dark:text-white font-semibold flex justify-between">
                      <span>Your Feedback <span className="text-red-500">*</span></span>
                      <span className="text-xs text-slate-500 font-normal">
                        {messageVal.length}/500
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please provide details about your experience..." 
                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 min-h-[150px] resize-y" 
                        {...field} 
                        maxLength={500}
                        data-testid="input-feedback-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md" 
                disabled={submitFeedback.isPending}
                data-testid="button-submit-feedback"
              >
                {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}