import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, ArrowLeft, Users } from "lucide-react";
import { format, parse } from "date-fns";
import { toast } from "@/hooks/use-toast";
import AvailabilityGrid from "@/components/AvailabilityGrid";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface EventData {
  id: string;
  name: string;
  mode?: "specific" | "weekly";
  dates: string[];
  days_of_week?: number[];
  time_range: { start: string; end: string };
  responses: Record<string, Record<string, boolean>>;
  createdAt: string;
}

const EventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [userName, setUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userAvailability, setUserAvailability] = useState<
    Record<string, boolean>
  >({});
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [userNameError, setUserNameError] = useState<string | null>(null);
  const [showBestOnly, setShowBestOnly] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledSlot, setScheduledSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoading(true);
      if (id) {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();
        if (data) {
          // Fetch votes for this event
          const { data: votesData } = await supabase
            .from("votes")
            .select("*")
            .eq("event_id", id);
          // Merge votes into responses
          const responses: Record<string, Record<string, boolean>> = {};
          if (votesData) {
            votesData.forEach(
              (vote: {
                user_name: string;
                availability: Record<string, boolean>;
              }) => {
                responses[vote.user_name] = vote.availability || {};
              }
            );
          }
          setEventData({ ...data, responses });
        }
      }
      setIsLoading(false);
    };
    fetchEvent();
  }, [id]);

  const handleShareUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copied!",
      description: "The event URL has been copied to your clipboard.",
    });
  };

  const handleUserNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value.length > 250) {
      setUserNameError("Name cannot exceed 250 characters");
    } else {
      setUserNameError(null);
    }
    setUserName(e.target.value);
  };

  const handleSubmitAvailability = async () => {
    const sanitizedUserName = userName.trim();

    if (!sanitizedUserName) {
      setUserNameError("Name is required");
      toast({
        title: "Name required",
        description: "Please enter your name to submit availability.",
        variant: "destructive",
      });
      return;
    }

    if (sanitizedUserName.length > 250) {
      setUserNameError("Name cannot exceed 250 characters");
      toast({
        title: "Invalid name",
        description: "Name cannot exceed 250 characters.",
        variant: "destructive",
      });
      return;
    }

    if (!eventData) return;

    setIsSubmitting(true);

    // Insert or update vote in Supabase
    const { error } = await supabase.from("votes").upsert([
      {
        event_id: id,
        user_name: sanitizedUserName,
        availability: userAvailability,
      },
    ]);

    if (error) {
      toast({
        title: "Error submitting availability",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "Availability submitted!",
      description: "Your availability has been recorded successfully.",
    });

    setHasSubmitted(true);
    setIsEditing(false);

    // Refetch event and votes
    const { data, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();
    if (data) {
      const { data: votesData } = await supabase
        .from("votes")
        .select("*")
        .eq("event_id", id);
      const responses: Record<string, Record<string, boolean>> = {};
      if (votesData) {
        votesData.forEach(
          (vote: {
            user_name: string;
            availability: Record<string, boolean>;
          }) => {
            responses[vote.user_name] = vote.availability || {};
          }
        );
      }
      setEventData({ ...data, responses });
    }
    setIsSubmitting(false);
  };

  const generateTimeSlots = () => {
    if (!eventData) return [];

    const slots = [];
    const startTime = parse(eventData.time_range.start, "HH:mm", new Date());
    const endTime = parse(eventData.time_range.end, "HH:mm", new Date());

    const currentTime = new Date(startTime);

    while (currentTime < endTime) {
      const timeString = format(currentTime, "HH:mm");
      slots.push(timeString);
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return slots;
  };

  const totalParticipants = eventData
    ? Object.keys(eventData.responses).length
    : 0;

  const handleNameSubmit = () => {
    const sanitizedUserName = userName.trim();

    if (!sanitizedUserName) {
      setUserNameError("Name is required");
      toast({
        title: "Name required",
        description: "Please enter your name to continue.",
        variant: "destructive",
      });
      return;
    }

    if (sanitizedUserName.length > 250) {
      setUserNameError("Name cannot exceed 250 characters");
      toast({
        title: "Invalid name",
        description: "Name cannot exceed 250 characters.",
        variant: "destructive",
      });
      return;
    }

    setHasEnteredName(true);
  };

  // Helper to get best slots
  function getBestTimes() {
    if (!eventData) return [];
    const slotCounts = {};
    const slots = generateTimeSlots();
    const dates = gridColumns;

    // Count votes for each slot
    for (const date of dates) {
      for (const time of slots) {
        const key = `${date}_${time}`;
        let count = 0;
        for (const user in eventData.responses) {
          if (eventData.responses[user][key]) count++;
        }
        slotCounts[key] = count;
      }
    }

    // Find max count
    const max = Math.max(...(Object.values(slotCounts) as number[]));
    if (max === 0) return [];

    // Collect all slots with max count
    const best = [];
    for (const [key, count] of Object.entries(slotCounts)) {
      if (count === max) {
        const idx = key.lastIndexOf("_");
        const date = key.slice(0, idx);
        const time = key.slice(idx + 1);
        best.push({ date, time, count });
      }
    }
    return best;
  }

  // Helper to filter responses for best slots only
  function filterResponsesForBestOnly(responses) {
    const best = getBestTimes();
    if (!best.length) return {};
    const bestKeys = new Set(best.map((slot) => `${slot.date}_${slot.time}`));
    const filtered = {};
    for (const [user, userResp] of Object.entries(responses)) {
      filtered[user] = {};
      for (const key of Object.keys(userResp)) {
        if (bestKeys.has(key)) {
          filtered[user][key] = userResp[key];
        }
      }
    }
    return filtered;
  }

  if (!eventData && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Event not found</h2>
            <p className="text-gray-600 mb-4">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/")} data-testid="go-home-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare columns for the grid
  let gridColumns: string[] = [];
  const gridMode: "specific" | "weekly" = eventData?.mode || "specific";
  if (gridMode === "weekly" && eventData?.days_of_week) {
    // Map daysOfWeek numbers to day names (e.g., 1 -> 'Monday')
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    gridColumns = eventData?.days_of_week.map((d) => dayNames[d]) || [];
  } else {
    gridColumns = eventData?.dates || [];
  }

  const handleAddToCalendar = () => {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayIndex = dayNames.indexOf(scheduledSlot.date);

    // Get current date and set to next occurrence of the selected day
    const date = new Date();
    const daysUntilNext = (dayIndex - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + daysUntilNext);

    // Set the time
    const [hours, minutes] = scheduledSlot.time.split(":");
    date.setHours(parseInt(hours), parseInt(minutes));

    // Create end time (1 hour later)
    const endDate = new Date(date);
    endDate.setHours(date.getHours() + 1);

    // Base URL parameters
    const baseParams = new URLSearchParams({
      action: "TEMPLATE",
      text: eventData?.name || "",
      dates: `${date.toISOString().replace(/-|:|\.\d+/g, "")}/${endDate
        .toISOString()
        .replace(/-|:|\.\d+/g, "")}`,
    });

    // Add recurrence rule for weekly events
    if (eventData?.mode === "weekly") {
      baseParams.append(
        "recur",
        `RRULE:FREQ=WEEKLY;BYDAY=${scheduledSlot.date
          .slice(0, 2)
          .toUpperCase()}`
      );
    }

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?${baseParams.toString()}`;
    window.open(googleCalendarUrl, "_blank");
  };

  return (
    <div
      className={`h-screen overflow-x-hidden ${
        isDragging ? "overflow-y-hidden" : "overflow-y-auto"
      } bg-gradient-to-br from-blue-50 via-white to-green-50`}
    >
      <div className="container mx-auto  px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <div className="flex items-center gap-4 mt-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900">
                  {eventData?.name}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Users className="w-3 h-3" />
                    {totalParticipants} participant
                    {totalParticipants !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </>
            )}
          </div>
          <Button
            onClick={handleShareUrl}
            variant="outline"
            data-testid="share-button"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Input */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>
                  {hasEnteredName
                    ? "Select your availability and submit"
                    : "Enter your name to continue"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    placeholder="Your name"
                    value={userName}
                    onChange={handleUserNameChange}
                    disabled={hasEnteredName}
                    className={cn(
                      userNameError &&
                        "border-red-500 focus-visible:ring-red-500"
                    )}
                    maxLength={250}
                    data-testid="user-name-input"
                  />
                </div>
                {userNameError && (
                  <p className="text-sm text-red-500 mt-1">{userNameError}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {userName.length}/250 characters
                </p>
                {!hasEnteredName ? (
                  <Button
                    onClick={handleNameSubmit}
                    className="w-full"
                    disabled={!userName.trim()}
                    data-testid="continue-button"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitAvailability}
                    className="w-full"
                    disabled={isSubmitting}
                    data-testid="submit-availability-button"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Availability"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <div className="flex flex-wrap gap-1">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>Time Range:</strong>{" "}
                      {eventData?.time_range &&
                        format(
                          parse(
                            eventData.time_range.start,
                            "HH:mm",
                            new Date()
                          ),
                          "h:mm a"
                        )}{" "}
                      -{" "}
                      {eventData?.time_range &&
                        format(
                          parse(eventData.time_range.end, "HH:mm", new Date()),
                          "h:mm a"
                        )}
                    </div>
                    {eventData?.mode === "specific" && (
                      <div>
                        <strong>Dates:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {eventData.dates.map((dateStr, index) => (
                            <Badge key={index} variant="outline">
                              {format(new Date(dateStr), "MMM d, yyyy")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {eventData?.mode === "weekly" && (
                      <div>
                        <strong>Days of Week:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {eventData.days_of_week?.map((day) => (
                            <Badge key={day} variant="outline">
                              {
                                [
                                  "Sunday",
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday",
                                ][day]
                              }
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Availability Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Your Availability</CardTitle>
                <CardDescription>
                  {hasEnteredName
                    ? "Click and drag to select the times when you're available. Green areas show where more people are available."
                    : "Please enter your name to select availability"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <Skeleton key={i} className="h-8" />
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 28 }).map((_, i) => (
                        <Skeleton key={i} className="h-8" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {hasSubmitted && !isEditing && (
                      <Button
                        className="mb-4"
                        onClick={() => setIsEditing(true)}
                        data-testid="edit-button"
                      >
                        Edit
                      </Button>
                    )}
                    <div className="flex items-center mb-4 gap-2">
                      <Switch
                        id="show-best-only"
                        checked={showBestOnly}
                        onCheckedChange={setShowBestOnly}
                        data-testid="show-best-only-switch"
                      />
                      <label
                        htmlFor="show-best-only"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Show only best time(s)
                      </label>
                    </div>
                    <div className="flex items-center mb-4 gap-2 justify-between w-full">
                      <Button
                        variant={isScheduling ? "secondary" : "default"}
                        onClick={() => {
                          setIsScheduling((prev) => !prev);
                          setScheduledSlot(null);
                        }}
                        data-testid="schedule-toggle-button"
                      >
                        {isScheduling ? "Cancel Scheduling" : "Schedule Event"}
                      </Button>
                      {isScheduling && scheduledSlot && (
                        <Button
                          onClick={handleAddToCalendar}
                          data-testid="add-to-calendar-button"
                        >
                          Add to Calendar
                        </Button>
                      )}
                    </div>
                    <AvailabilityGrid
                      mode={gridMode}
                      dates={gridColumns}
                      hasSubmitted={hasSubmitted}
                      timeSlots={generateTimeSlots()}
                      responses={
                        showBestOnly
                          ? filterResponsesForBestOnly(
                              !hasEnteredName
                                ? eventData?.responses || {}
                                : hasSubmitted && !isEditing
                                ? eventData?.responses || {}
                                : { [userName]: userAvailability }
                            )
                          : !hasEnteredName
                          ? eventData?.responses || {}
                          : hasSubmitted && !isEditing
                          ? eventData?.responses || {}
                          : { [userName]: userAvailability }
                      }
                      setIsDragging={setIsDragging}
                      userAvailability={userAvailability}
                      onAvailabilityChange={setUserAvailability}
                      isReadOnly={
                        !hasEnteredName || (hasSubmitted && !isEditing)
                      }
                      isScheduling={isScheduling}
                      scheduledSlot={scheduledSlot}
                      setScheduledSlot={setScheduledSlot}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPage;
