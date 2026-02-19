import { BuyMeACoffeeModal } from "@/components/BuyMeACoffeeModal";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import {
  format
} from "date-fns";
import {
  Calendar1,
  CalendarIcon,
  Clock,
  Github,
  Mail,
  Share2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const Index = () => {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  // Single selected date for "Specific Dates" mode
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventNameError, setEventNameError] = useState<string | null>(null);

  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState({
    start: "09:00",
    end: "17:00",
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateSelectionMode, setDateSelectionMode] = useState<
    "specific" | "weekly"
  >("specific");

  const handleEventNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value.length > 250) {
      setEventNameError("Event name cannot exceed 250 characters");
    } else {
      setEventNameError(null);
    }
    setEventName(e.target.value);
  };

  const handleDayOfWeekToggle = (dayValue: number) => {
    setSelectedDaysOfWeek((prev) => {
      if (prev.includes(dayValue)) {
        return prev.filter((d) => d !== dayValue);
      } else {
        return [...prev, dayValue];
      }
    });
  };

  const handleCreateEvent = async () => {
    if (eventNameError) {
      toast({
        title: "Event name required",
        description: eventNameError,
        variant: "destructive",
      });
      return;
    }

    if (!eventName.trim()) {
      toast({
        title: "Event name required",
        description: "Please enter a name for your event.",
        variant: "destructive",
      });
      return;
    }

    let dates: string[] = [];
    const mode: "specific" | "weekly" = dateSelectionMode;
    let daysOfWeek: number[] = [];

    if (dateSelectionMode === "specific") {
      if (!selectedDate) {
        toast({
          title: "Dates required",
          description: "Please select a date for your event.",
          variant: "destructive",
        });
        return;
      }
      dates = [selectedDate.toISOString().split("T")[0]];
    } else {
      if (selectedDaysOfWeek.length === 0) {
        toast({
          title: "Days required",
          description: "Please select at least one day of the week.",
          variant: "destructive",
        });
        return;
      }
      daysOfWeek = selectedDaysOfWeek;
    }

    // Insert event into Supabase
    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          name: eventName,
          mode,
          dates,
          days_of_week: daysOfWeek,
          time_range: timeRange,
        },
      ])
      .select();

    if (error || !data || !data[0]) {
      toast({
        title: "Error creating event",
        description: error?.message || "Unknown error",
        variant: "destructive",
      });
      return;
    }

    const eventId = data[0].id;

    toast({
      title: "Event created!",
      description: "Your scheduling event has been created successfully.",
    });

    navigate(`/event/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <div className="md:container mx-auto max-w-6xl px-3 sm:px-4 py-8 md:py-16 flex flex-col gap-10 md:gap-16">
        {/* Hero */}
        <div className="grid gap-8 md:gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start md:items-center">
          <div className="space-y-5 md:space-y-6 order-2 md:order-1">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              New · Plan meetings without back-and-forth
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
              The fastest way to{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                find a time
              </span>{" "}
              that works.
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-700 max-w-xl">
              Create a scheduling poll, share a single link, and instantly see
              when your team is free. No more DMs, spreadsheets, or timezone
              confusion.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <Button
                variant="default"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base rounded-full shadow-lg shadow-emerald-500/30 w-full sm:w-auto justify-center"
                data-testid="primary-hero-button"
                onClick={() => {
                  const el = document.getElementById("create-event-card");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              >
                Get started free
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-full border-slate-300 bg-white text-slate-800 hover:bg-slate-50 w-full sm:w-auto justify-center"
                data-testid="github-star-button"
                onClick={() =>
                  window.open("https://github.com/h-vien/schedmeet", "_blank")
                }
              >
                <Github className="w-4 h-4" />
                Star on GitHub
              </Button>
              <BuyMeACoffeeModal />
            </div>
            <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-slate-500">
              <div className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                No login required for participants
              </div>
              <div className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Works across timezones
              </div>
            </div>
          </div>
          <div className="relative order-1 md:order-2">
            <div className="pointer-events-none absolute -inset-2 sm:-inset-6 rounded-3xl bg-emerald-200/40 blur-2xl sm:blur-3xl" />
            {/* Main Form */}
            <Card
              id="create-event-card"
              className="relative w-full max-w-md mx-auto md:ml-auto border-slate-200 bg-white shadow-2xl shadow-emerald-500/10 backdrop-blur"
            >
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-slate-900">Create your event</CardTitle>
                <CardDescription className="text-slate-500">
                  Set up a poll and share it in under a minute.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
            {/* Event Name */}
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                placeholder="Team Meeting, Birthday Party, etc."
                value={eventName}
                onChange={handleEventNameChange}
                className="text-lg"
                data-testid="event-name-input"
              />
              {eventNameError && (
                <p className="text-sm text-red-500">{eventNameError}</p>
              )}
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Select Dates</Label>
              <Tabs
                defaultValue="specific"
                className="w-full"
                onValueChange={(value) =>
                  setDateSelectionMode(value as "specific" | "weekly")
                }
                data-testid="date-selection-tabs"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="specific" data-testid="tab-specific">
                    Specific Dates
                  </TabsTrigger>
                  <TabsTrigger value="weekly" data-testid="tab-weekly">
                    Days of Week
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="specific">
                  <Popover
                    open={isCalendarOpen}
                    onOpenChange={setIsCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-auto py-3",
                          !selectedDate && "text-muted-foreground"
                        )}
                        data-testid="open-calendar-button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          <div className="flex flex-wrap gap-1">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              {format(selectedDate, "MMM d")}
                            </span>
                          </div>
                        ) : (
                          <span>Pick your dates</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate ?? undefined}
                        onSelect={(date) => {
                          setSelectedDate(date ?? null);
                        }}
                        className="pointer-events-auto"
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </TabsContent>
                <TabsContent value="weekly">
                  <div className="flex justify-center gap-0.5 my-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        className={cn(
                          "px-4 mt-4 py-2 border border-gray-300 text-sm font-medium rounded-none first:rounded-l last:rounded-r focus:outline-none",
                          selectedDaysOfWeek.includes(day.value)
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                        onClick={() => handleDayOfWeekToggle(day.value)}
                        aria-pressed={selectedDaysOfWeek.includes(day.value)}
                        data-testid={`day-toggle-${day.label.toLowerCase()}`}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Time Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Range
              </Label>
              <TimeRangeSelector
                startTime={timeRange.start}
                endTime={timeRange.end}
                onTimeChange={setTimeRange}
              />
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreateEvent}
              className="w-full text-base py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
              data-testid="create-event-button"
            >
              Create event
            </Button>
          </CardContent>
        </Card>
          </div>
        </div>

        {/* Features */}
        <section className="mt-4 -mx-3 sm:-mx-4">
          <div className="w-full max-w-3xl mx-auto px-3 sm:px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-semibold mb-3">
                Built for modern teams
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
                Powerful enough for product squads, simple enough for family
                dinners.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7 shadow-sm">
                <Calendar1 className="w-7 h-7 mb-3 md:mb-4 text-emerald-500" />
                <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">
                  Smart date picking
                </h3>
                <p className="text-sm text-slate-600">
                  Offer specific dates or recurring weekdays so everyone can vote
                  on what works.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7 shadow-sm">
                <Users className="w-7 h-7 mb-3 md:mb-4 text-sky-500" />
                <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">
                  Clear availability
                </h3>
                <p className="text-sm text-slate-600">
                  See at a glance which time slots fit the most people with an
                  intuitive visual layout.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7 shadow-sm">
                <Share2 className="w-7 h-7 mb-3 md:mb-4 text-violet-500" />
                <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">
                  One simple link
                </h3>
                <p className="text-sm text-slate-600">
                  Share your event anywhere – Slack, email, or chat – and start
                  collecting responses instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-20 border-t border-slate-200 pt-8">
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="flex items-center gap-4">
              <a
                href="mailto:contact@SchedMeet.com"
                className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2 text-sm"
              >
                <Mail className="w-4 h-4" />
                hdhvien2002@gmail.com
              </a>
            </div>
          </div>
          <div className="text-slate-500 w-full text-center text-xs md:text-sm">
            <p className="!mb-0">
              © {new Date().getFullYear()} SchedMeet. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
