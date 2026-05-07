import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Search, Grid, List, Trophy, Shield, Medal, Medal as BronzeMedal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetContributors } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Contributors() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("contributions");

  const { data, isLoading } = useGetContributors({ sort, search });

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500 drop-shadow-sm" />;
      case 2: return <Shield className="w-5 h-5 text-slate-400 drop-shadow-sm" />;
      case 3: return <Medal className="w-5 h-5 text-amber-700 drop-shadow-sm" />;
      default: return <span className="text-sm font-bold text-slate-400">#{rank}</span>;
    }
  };

  const getLabelColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case "legend": return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
      case "expert": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "advanced": return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      default: return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  return (
    <Layout>
      <div className="w-full">
        {/* Hero Header */}
        <div className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight">Our Amazing Contributors</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
                <div className="text-4xl font-bold mb-1">{data?.stats?.totalContributors || 0}</div>
                <div className="text-emerald-100 font-medium">Contributors</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
                <div className="text-4xl font-bold mb-1">{data?.stats?.totalContributions || 0}</div>
                <div className="text-emerald-100 font-medium">Total Contributions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
                <div className="text-4xl font-bold mb-1">{data?.stats?.topContributions || 0}</div>
                <div className="text-emerald-100 font-medium">Top Contributions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search contributors..." 
                className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-contributors"
              />
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white dark:bg-slate-900" data-testid="select-sort-contributors">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contributions">Most Contributions</SelectItem>
                  <SelectItem value="recent">Recently Joined</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center rounded-md border border-input p-1 bg-slate-50 dark:bg-slate-900">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 rounded-sm ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''}`}
                  onClick={() => setViewMode('grid')}
                  data-testid="button-view-grid"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 rounded-sm ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''}`}
                  onClick={() => setViewMode('list')}
                  data-testid="button-view-list"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Grid/List */}
          {isLoading ? (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className={viewMode === 'grid' ? "h-[220px] rounded-xl" : "h-[88px] rounded-xl"} />
              ))}
            </div>
          ) : data?.contributors?.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400">
              No contributors found.
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
              {data?.contributors?.map((contributor) => (
                <div 
                  key={contributor.id} 
                  className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex ${viewMode === 'grid' ? 'flex-col items-center text-center' : 'flex-row items-center gap-6'} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
                  data-testid={`card-contributor-${contributor.id}`}
                >
                  {/* Rank Indicator */}
                  <div className={`absolute top-4 ${viewMode === 'grid' ? 'left-4' : 'left-6'} flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700`}>
                    {getRankBadge(contributor.rank)}
                  </div>

                  <Avatar className={`${viewMode === 'grid' ? 'w-20 h-20 mb-4' : 'w-16 h-16'} border-2 border-white dark:border-slate-800 shadow-sm`}>
                    <AvatarImage src={contributor.avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{(contributor.username ?? contributor.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className={`${viewMode === 'grid' ? '' : 'flex-1'} flex flex-col`}>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{contributor.name || contributor.username}</h3>
                    {contributor.username && <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">@{contributor.username}</p>}
                    
                    <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'justify-center mb-4' : 'mb-0'}`}>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getLabelColor(contributor.badge)}`}>
                        {contributor.badge}
                      </span>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {contributor.contributions} contributions
                      </span>
                    </div>
                  </div>

                  <div className={`${viewMode === 'grid' ? 'w-full mt-auto pt-2' : ''}`}>
                    <Button variant="default" className={`bg-primary hover:bg-primary/90 text-primary-foreground font-semibold ${viewMode === 'grid' ? 'w-full' : ''}`} asChild>
                      <Link href={`/profile/${contributor.username}`} data-testid={`button-view-profile-${contributor.username}`}>View Profile</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}