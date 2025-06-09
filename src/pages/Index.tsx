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
import {
  CalendarIcon,
  Clock,
  Users,
  Share2,
  Calendar1,
  Github,
  Mail,
} from 'lucide-react';
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Particles } from '@/components/magicui/particles';
import { ReviewSection } from '@/components/ReviewSection';

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
  const [eventNameError, setEventNameError] = useState<string | null>(null);

  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState({
    start: '09:00',
    end: '17:00',
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateSelectionMode, setDateSelectionMode] = useState<
    'specific' | 'weekly'
  >('specific');

  const handleEventNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value.length > 250) {
      setEventNameError('Event name cannot exceed 250 characters');
    } else {
      setEventNameError(null);
    }
    setEventName(e.target.value);
  };

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

  const handleCreateEvent = async () => {
    if (eventNameError) {
      toast({
        title: 'Event name required',
        description: eventNameError,
        variant: 'destructive',
      });
      return;
    }

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

    // Insert event into Supabase
    const { data, error } = await supabase
      .from('events')
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
        title: 'Error creating event',
        description: error?.message || 'Unknown error',
        variant: 'destructive',
      });
      return;
    }

    const eventId = data[0].id;

    toast({
      title: 'Event created!',
      description: 'Your scheduling event has been created successfully.',
    });

    navigate(`/event/${eventId}`);
  };

  return (
    <div className='relative min-h-screen overflow-hidden '>
      <div className='container mx-auto px-4 py-16'>
        {/* Header */}
        <Particles className='absolute inset-0' color='#000000' />

        <div className='text-center mb-16 animate-fade-in'>
          <h1 className='text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4'>
            SchedMeet
          </h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Find the perfect time when everyone is available. Create your
            scheduling poll in seconds.
          </p>
        </div>
        <div className='flex justify-center mb-8'>
          <Button
            variant='outline'
            className='flex items-center gap-2'
            onClick={() =>
              window.open('https://github.com/h-vien/schedmeet', '_blank')
            }
          >
            <Github className='w-4 h-4' />
            Star on GitHub
          </Button>
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
                onChange={handleEventNameChange}
                className='text-lg'
              />
              {eventNameError && (
                <p className='text-sm text-red-500'>{eventNameError}</p>
              )}
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
                  <div className='flex justify-center gap-0.5 my-2'>
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type='button'
                        className={cn(
                          'px-4 mt-4 py-2 border border-gray-300 text-sm font-medium rounded-none first:rounded-l last:rounded-r focus:outline-none',
                          selectedDaysOfWeek.includes(day.value)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                        onClick={() => handleDayOfWeekToggle(day.value)}
                        aria-pressed={selectedDaysOfWeek.includes(day.value)}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
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
              className='w-full text-lg py-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg hover:shadow-xl'
            >
              Create Event
            </Button>
          </CardContent>
        </Card>
        {/* Features */}
        <div className='text-center mb-8 mt-16'>
          <h2 className='text-2xl font-bold mb-4'>Why SchedMeet?</h2>
          <p className='text-gray-600 max-w-2xl mx-auto'>
            A simple and efficient way to coordinate schedules with your team
          </p>
        </div>
        <div className='grid md:grid-cols-3 gap-8 md:px-12'>
          <div className='text-center p-6 rounded-lg bg-white/50 backdrop-blur-sm border border-white/20 hover:bg-white/70 transition-all duration-300 hover:scale-105'>
            <Calendar1 className='w-8 h-8 mx-auto mb-3 text-blue-600' />
            <h3 className='text-base font-semibold mb-2'>Easy Scheduling</h3>
            <p className='text-sm text-gray-600'>
              Select multiple dates and time ranges with just a few clicks
            </p>
          </div>
          <div className='text-center p-6 rounded-lg bg-white/50 backdrop-blur-sm border border-white/20 hover:bg-white/70 transition-all duration-300 hover:scale-105'>
            <Users className='w-8 h-8 mx-auto mb-3 text-green-600' />
            <h3 className='text-base font-semibold mb-2'>
              Visual Availability
            </h3>
            <p className='text-sm text-gray-600'>
              See everyone's availability at a glance with our heatmap grid
            </p>
          </div>
          <div className='text-center p-6 rounded-lg bg-white/50 backdrop-blur-sm border border-white/20 hover:bg-white/70 transition-all duration-300 hover:scale-105'>
            <Share2 className='w-8 h-8 mx-auto mb-3 text-purple-600' />
            <h3 className='text-base font-semibold mb-2'>Easy Sharing</h3>
            <p className='text-sm text-gray-600'>
              Share your poll with a simple link
            </p>
          </div>
        </div>
        {/* <ReviewSection /> */}
        <footer className='mt-16 py-8 border-t border-gray-200'>
          <div className='container mx-auto px-4'>
            <div className='flex flex-col items-center gap-2 mb-4'>
              <a
                href='mailto:contact@SchedMeet.com'
                className='text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2'
              >
                <Mail className='w-4 h-4' />
                hdhvien2002@gmail.com
              </a>
            </div>
            <div className='text-gray-600 w-full text-center'>
              <p className='!mb-0'>
                © {new Date().getFullYear()} SchedMeet. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
