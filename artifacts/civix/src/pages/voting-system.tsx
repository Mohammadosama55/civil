import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { CheckSquare, PlusCircle, BarChart3, Inbox } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetPolls, useGetPollStats, useCreatePoll, useVoteOnPoll, getGetPollsQueryKey, getGetPollStatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Link } from "wouter";

const createPollSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters"),
  description: z.string().optional(),
  options: z.array(
    z.object({
      value: z.string().min(1, "Option cannot be empty")
    })
  ).min(2, "At least two options are required"),
});

export default function VotingSystem() {
  const [activeTab, setActiveTab] = useState("browse");
  const { data: polls, isLoading: isLoadingPolls } = useGetPolls({ status: "active" });
  const { data: stats, isLoading: isLoadingStats } = useGetPollStats();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPoll = useCreatePoll();
  const voteOnPoll = useVoteOnPoll();

  const form = useForm<z.infer<typeof createPollSchema>>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      question: "",
      description: "",
      options: [{ value: "" }, { value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  function onSubmit(values: z.infer<typeof createPollSchema>) {
    createPoll.mutate({ 
      data: {
        question: values.question,
        description: values.description,
        options: values.options.map(opt => opt.value),
      }
    }, {
      onSuccess: () => {
        toast({ title: "Poll Created", description: "Your poll is now live." });
        queryClient.invalidateQueries({ queryKey: getGetPollsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPollStatsQueryKey() });
        form.reset();
        setActiveTab("browse");
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to create poll." });
      }
    });
  }

  function handleVote(pollId: string, optionId: string) {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please login to vote." });
      return;
    }

    voteOnPoll.mutate({
      data: { optionId }
    }, {
      onSuccess: () => {
        toast({ title: "Vote Cast", description: "Your vote has been recorded." });
        queryClient.invalidateQueries({ queryKey: getGetPollsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPollStatsQueryKey() });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to cast vote." });
      }
    });
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <CheckSquare className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Voting System</h1>
              <p className="text-slate-600 dark:text-slate-400">Have your say on community proposals and initiatives.</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3 flex-1 md:flex-initial min-w-[120px]">
              <div className="text-sm text-slate-500 font-medium">Active Polls</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{isLoadingStats ? "-" : stats?.activePolls || 0}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3 flex-1 md:flex-initial min-w-[120px]">
              <div className="text-sm text-slate-500 font-medium">Total Votes</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{isLoadingStats ? "-" : stats?.totalVotes || 0}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl h-auto">
            <TabsTrigger value="browse" className="py-3 text-sm sm:text-base font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-browse">
              <CheckSquare className="w-4 h-4 mr-2 hidden sm:inline" />
              Browse Polls
            </TabsTrigger>
            <TabsTrigger value="create" className="py-3 text-sm sm:text-base font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-create">
              <PlusCircle className="w-4 h-4 mr-2 hidden sm:inline" />
              Create Poll
            </TabsTrigger>
            <TabsTrigger value="analytics" className="py-3 text-sm sm:text-base font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2 hidden sm:inline" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6 focus-visible:outline-none">
            {isLoadingPolls ? (
              <div className="grid gap-6">
                {[1, 2].map(i => <Skeleton key={i} className="h-[250px] rounded-2xl w-full" />)}
              </div>
            ) : polls?.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Polls</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">There are currently no active polls to vote on. Be the first to create one!</p>
                <Button onClick={() => setActiveTab("create")} className="bg-primary text-white font-semibold">
                  Create a Poll
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {polls?.map((poll) => (
                  <div key={poll.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow" data-testid={`poll-card-${poll.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{poll.question}</h3>
                      <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ml-4">
                        Active
                      </span>
                    </div>
                    
                    {poll.description && (
                      <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                        {poll.description}
                      </p>
                    )}

                    <div className="space-y-4 mb-6">
                      {poll.options.map((option) => {
                        const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
                        return (
                          <div key={option.id} className="space-y-1.5">
                            <div className="flex justify-between text-sm font-medium">
                              <span className="text-slate-900 dark:text-white">{option.text}</span>
                              <span className="text-slate-500">{percentage}% ({option.votes})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Progress value={percentage} className="h-2 flex-1" />
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="shrink-0 font-semibold"
                                onClick={() => handleVote(poll.id, option.id)}
                                data-testid={`button-vote-${option.id}`}
                              >
                                Vote
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
                      <div>Total Votes: <span className="font-semibold text-slate-900 dark:text-white">{poll.totalVotes}</span></div>
                      <div>By: {poll.creatorName || "Anonymous"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="focus-visible:outline-none">
            {!user ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Login Required</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">You must be logged in to create a poll.</p>
                <Button asChild className="bg-primary text-white font-semibold">
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-2xl mx-auto shadow-sm">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="question"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-900 dark:text-white font-semibold text-lg">Poll Question</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., Should we install more bike lanes on Main St?" className="bg-slate-50 dark:bg-slate-950 h-12 text-lg" {...field} data-testid="input-poll-question" />
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
                          <FormLabel className="text-slate-900 dark:text-white font-semibold">Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide more context about this poll..." 
                              className="bg-slate-50 dark:bg-slate-950 resize-none min-h-[100px]" 
                              {...field} 
                              data-testid="input-poll-desc"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 pt-2">
                      <FormLabel className="text-slate-900 dark:text-white font-semibold">Options</FormLabel>
                      {fields.map((field, index) => (
                        <FormField
                          key={field.id}
                          control={form.control}
                          name={`options.${index}.value`}
                          render={({ field: inputField }) => (
                            <FormItem>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input 
                                    placeholder={`Option ${index + 1}`} 
                                    className="bg-slate-50 dark:bg-slate-950" 
                                    {...inputField} 
                                    data-testid={`input-poll-opt-${index}`}
                                  />
                                </FormControl>
                                {fields.length > 2 && (
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => remove(index)}
                                    className="shrink-0 text-destructive border-destructive/20 hover:bg-destructive/10"
                                  >
                                    &times;
                                  </Button>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => append({ value: "" })}
                        className="w-full border-dashed"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" /> Add Option
                      </Button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white mt-8" 
                      disabled={createPoll.isPending}
                      data-testid="button-create-poll"
                    >
                      {createPoll.isPending ? "Creating..." : "Create Poll"}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="focus-visible:outline-none">
             <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Analytics Coming Soon</h3>
                <p className="text-slate-500 max-w-md mx-auto">Detailed voting analytics and demographic breakdowns will be available in the next update.</p>
              </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}