import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, ArrowLeft, Users } from 'lucide-react';
import { format, parse } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import AvailabilityGrid from '@/components/AvailabilityGrid';
import { supabase } from '@/lib/supabaseClient';

interface EventData {
  id: string;
  name: string;
  mode?: 'specific' | 'weekly';
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
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userAvailability, setUserAvailability] = useState<
    Record<string, boolean>
  >({});
  const [hasEnteredName, setHasEnteredName] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (id) {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();
        if (data) {
          // Fetch votes for this event
          const { data: votesData } = await supabase
            .from('votes')
            .select('*')
            .eq('event_id', id);
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
    };
    fetchEvent();
  }, [id]);

  const handleShareUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: 'URL copied!',
      description: 'The event URL has been copied to your clipboard.',
    });
  };

  const handleSubmitAvailability = async () => {
    if (!userName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name to submit availability.',
        variant: 'destructive',
      });
      return;
    }

    if (!eventData) return;

    setIsSubmitting(true);

    // Insert or update vote in Supabase
    const { error } = await supabase.from('votes').upsert([
      {
        event_id: id,
        user_name: userName,
        availability: userAvailability,
      },
    ]);

    if (error) {
      toast({
        title: 'Error submitting availability',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: 'Availability submitted!',
      description: 'Your availability has been recorded successfully.',
    });

    // Refetch event and votes
    const { data, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    if (data) {
      const { data: votesData } = await supabase
        .from('votes')
        .select('*')
        .eq('event_id', id);
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
    const startTime = parse(eventData.time_range.start, 'HH:mm', new Date());
    const endTime = parse(eventData.time_range.end, 'HH:mm', new Date());

    const currentTime = new Date(startTime);

    while (currentTime < endTime) {
      const timeString = format(currentTime, 'HH:mm');
      slots.push(timeString);
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return slots;
  };

  const totalParticipants = eventData
    ? Object.keys(eventData.responses).length
    : 0;

  const handleNameSubmit = () => {
    if (!userName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name to continue.',
        variant: 'destructive',
      });
      return;
    }
    setHasEnteredName(true);
  };

  if (!eventData) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50'>
        <Card className='w-full max-w-md'>
          <CardContent className='text-center py-8'>
            <h2 className='text-xl font-semibold mb-2'>Event not found</h2>
            <p className='text-gray-600 mb-4'>
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare columns for the grid
  let gridColumns: string[] = [];
  const gridMode: 'specific' | 'weekly' = eventData.mode || 'specific';
  if (gridMode === 'weekly' && eventData.days_of_week) {
    // Map daysOfWeek numbers to day names (e.g., 1 -> 'Monday')
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    gridColumns = eventData.days_of_week.map((d) => dayNames[d]);
  } else {
    gridColumns = eventData.dates;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <Button
              variant='ghost'
              onClick={() => navigate('/')}
              className='mb-4'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Home
            </Button>
            <h1 className='text-3xl font-bold text-gray-900'>
              {eventData.name}
            </h1>
            <div className='flex items-center gap-4 mt-2'>
              <Badge variant='secondary' className='flex items-center gap-1'>
                <Users className='w-3 h-3' />
                {totalParticipants} participant
                {totalParticipants !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          <Button onClick={handleShareUrl} variant='outline'>
            <Share2 className='w-4 h-4 mr-2' />
            Share
          </Button>
        </div>

        <div className='grid lg:grid-cols-3 gap-8'>
          {/* User Input */}
          <div className='lg:col-span-1 space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>
                  {hasEnteredName
                    ? 'Select your availability and submit'
                    : 'Enter your name to continue'}
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Input
                    placeholder='Your name'
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    disabled={hasEnteredName}
                  />
                </div>
                {!hasEnteredName ? (
                  <Button
                    onClick={handleNameSubmit}
                    className='w-full'
                    disabled={!userName.trim()}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitAvailability}
                    className='w-full'
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Availability'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div>
                  <strong>Time Range:</strong>{' '}
                  {eventData.time_range &&
                    format(
                      parse(eventData.time_range.start, 'HH:mm', new Date()),
                      'h:mm a'
                    )}{' '}
                  -{' '}
                  {eventData.time_range &&
                    format(
                      parse(eventData.time_range.end, 'HH:mm', new Date()),
                      'h:mm a'
                    )}
                </div>
                {eventData.mode === 'specific' && (
                  <div>
                    <strong>Dates:</strong>
                    <div className='flex flex-wrap gap-1 mt-1'>
                      {eventData.dates.map((dateStr, index) => (
                        <Badge key={index} variant='outline'>
                          {format(new Date(dateStr), 'MMM d, yyyy')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {eventData.mode === 'weekly' && (
                  <div>
                    <strong>Days of Week:</strong>
                    <div className='flex flex-wrap gap-1 mt-1'>
                      {eventData.days_of_week.map((day) => (
                        <Badge key={day} variant='outline'>
                          {
                            [
                              'Sunday',
                              'Monday',
                              'Tuesday',
                              'Wednesday',
                              'Thursday',
                              'Friday',
                              'Saturday',
                            ][day]
                          }
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Availability Grid */}
          <div className='lg:col-span-2'>
            <Card>
              <CardHeader>
                <CardTitle>Select Your Availability</CardTitle>
                <CardDescription>
                  {hasEnteredName
                    ? "Click and drag to select the times when you're available. Green areas show where more people are available."
                    : 'Please enter your name to select availability'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasEnteredName ? (
                  <AvailabilityGrid
                    mode={gridMode}
                    dates={gridColumns}
                    timeSlots={generateTimeSlots()}
                    responses={eventData.responses}
                    userAvailability={userAvailability}
                    onAvailabilityChange={setUserAvailability}
                  />
                ) : (
                  <div className='h-[400px] flex items-center justify-center text-gray-500'>
                    Enter your name to start selecting availability
                  </div>
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
