import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Clock, Users, Share2, Calendar1 } from 'lucide-react';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { cn } from '@/lib/utils';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const Index = () => {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState({ start: '09:00', end: '17:00' });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateSelectionMode, setDateSelectionMode] = useState<
    'specific' | 'weekly'
  >('specific');

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    setSelectedDates((prev) => {
      const isAlreadySelected = prev.some(
        (d) =>
          d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
      );

      if (isAlreadySelected) {
        return prev.filter(
          (d) =>
            !(
              d.getDate() === date.getDate() &&
              d.getMonth() === date.getMonth() &&
              d.getFullYear() === date.getFullYear()
            )
        );
      } else {
        return [...prev, date];
      }
    });
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

  const handleCreateEvent = () => {
    if (!eventName.trim()) {
      toast({
        title: 'Event name required',
        description: 'Please enter a name for your event.',
        variant: 'destructive',
      });
      return;
    }

    let dates: string[] = [];
    const mode: 'specific' | 'weekly' = dateSelectionMode;
    let daysOfWeek: number[] = [];

    if (dateSelectionMode === 'specific') {
      if (selectedDates.length === 0) {
        toast({
          title: 'Dates required',
          description: 'Please select at least one date for your event.',
          variant: 'destructive',
        });
        return;
      }
      dates = selectedDates.map((date) => date.toISOString().split('T')[0]);
    } else {
      if (selectedDaysOfWeek.length === 0) {
        toast({
          title: 'Days required',
          description: 'Please select at least one day of the week.',
          variant: 'destructive',
        });
        return;
      }
      daysOfWeek = selectedDaysOfWeek;
    }

    // Generate a simple ID for the event
    const eventId = Math.random().toString(36).substring(2, 15);

    // Store event data in localStorage
    const eventData = {
      id: eventId,
      name: eventName,
      mode,
      dates,
      daysOfWeek,
      timeRange,
      responses: {},
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(`event_${eventId}`, JSON.stringify(eventData));

    toast({
      title: 'Event created!',
      description: 'Your scheduling event has been created successfully.',
    });

    navigate(`/event/${eventId}`);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50'>
      <div className='container mx-auto px-4 py-16'>
        {/* Header */}
        <div className='text-center mb-16 animate-fade-in'>
          <h1 className='text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4'>
            When2Meet
          </h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Find the perfect time when everyone is available. Create your
            scheduling poll in seconds.
          </p>
        </div>

        {/* Features */}
        <div className='grid md:grid-cols-3 gap-8 mb-16'>
          <div className='text-center p-6 rounded-lg bg-white/50 backdrop-blur-sm border border-white/20 hover:bg-white/70 transition-all duration-300 hover:scale-105'>
            <Calendar1 className='w-12 h-12 mx-auto mb-4 text-blue-600' />
            <h3 className='text-lg font-semibold mb-2'>Easy Scheduling</h3>
            <p className='text-gray-600'>
              Select multiple dates and time ranges with just a few clicks
            </p>
          </div>
          <div className='text-center p-6 rounded-lg bg-white/50 backdrop-blur-sm border border-white/20 hover:bg-white/70 transition-all duration-300 hover:scale-105'>
            <Users className='w-12 h-12 mx-auto mb-4 text-green-600' />
            <h3 className='text-lg font-semibold mb-2'>Visual Availability</h3>
            <p className='text-gray-600'>
              See everyone's availability at a glance with our heatmap grid
            </p>
          </div>
          <div className='text-center p-6 rounded-lg bg-white/50 backdrop-blur-sm border border-white/20 hover:bg-white/70 transition-all duration-300 hover:scale-105'>
            <Share2 className='w-12 h-12 mx-auto mb-4 text-purple-600' />
            <h3 className='text-lg font-semibold mb-2'>Easy Sharing</h3>
            <p className='text-gray-600'>
              Share your poll with a simple link and optional password
              protection
            </p>
          </div>
        </div>

        {/* Main Form */}
        <Card className='max-w-2xl mx-auto shadow-xl bg-white/80 backdrop-blur-sm border-white/20'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>Create Your Event</CardTitle>
            <CardDescription>
              Set up your scheduling poll and share it with others
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Event Name */}
            <div className='space-y-2'>
              <Label htmlFor='eventName'>Event Name</Label>
              <Input
                id='eventName'
                placeholder='Team Meeting, Birthday Party, etc.'
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className='text-lg'
              />
            </div>

            {/* Date Selection */}
            <div className='space-y-2'>
              <Label>Select Dates</Label>
              <Tabs
                defaultValue='specific'
                className='w-full'
                onValueChange={(value) =>
                  setDateSelectionMode(value as 'specific' | 'weekly')
                }
              >
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='specific'>Specific Dates</TabsTrigger>
                  <TabsTrigger value='weekly'>Days of Week</TabsTrigger>
                </TabsList>
                <TabsContent value='specific'>
                  <Popover
                    open={isCalendarOpen}
                    onOpenChange={setIsCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-full justify-start text-left font-normal h-auto py-3',
                          !selectedDates.length && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {selectedDates.length > 0 ? (
                          <div className='flex flex-wrap gap-1'>
                            {selectedDates.slice(0, 3).map((date, i) => (
                              <span
                                key={i}
                                className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm'
                              >
                                {format(date, 'MMM d')}
                              </span>
                            ))}
                            {selectedDates.length > 3 && (
                              <span className='text-sm text-gray-500'>
                                +{selectedDates.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>Pick your dates</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='multiple'
                        selected={selectedDates}
                        onSelect={(dates) => {
                          if (dates) {
                            setSelectedDates(dates);
                          }
                        }}
                        className='pointer-events-auto'
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {selectedDates.length > 0 && (
                    <p className='text-sm text-gray-600'>
                      {selectedDates.length} date
                      {selectedDates.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </TabsContent>
                <TabsContent value='weekly'>
                  <div className='grid grid-cols-2 gap-2 p-2'>
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day.value}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={selectedDaysOfWeek.includes(day.value)}
                          onCheckedChange={() =>
                            handleDayOfWeekToggle(day.value)
                          }
                        />
                        <label
                          htmlFor={`day-${day.value}`}
                          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                        >
                          {day.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedDaysOfWeek.length > 0 && (
                    <p className='text-sm text-gray-600 mt-2'>
                      Will generate dates for the next 4 weeks
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Time Range */}
            <div className='space-y-2'>
              <Label className='flex items-center gap-2'>
                <Clock className='w-4 h-4' />
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
              className='w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl'
            >
              Create Event
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
