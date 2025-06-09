import { useState, useCallback, useRef } from 'react';
import { format, parse } from 'date-fns';
import Selecto, { SelectoEvents } from 'react-selecto';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AvailabilityGridProps {
  mode?: 'specific' | 'weekly';
  dates: string[];
  setIsDragging: (isDragging: boolean) => void;
  timeSlots: string[];
  responses: Record<string, Record<string, boolean>>;
  userAvailability: Record<string, boolean>;
  onAvailabilityChange: (availability: Record<string, boolean>) => void;
  isReadOnly?: boolean;
  hasSubmitted?: boolean;
  isScheduling?: boolean;
  scheduledSlot?: { date: string; time: string } | null;
  setScheduledSlot?: (slot: { date: string; time: string }) => void;
}

interface TimeSlotProps {
  dateStr: string;
  timeSlot: string;
  isSelected: boolean;
  count: number;
  totalParticipants: number;
  availableUsers: string[];
  isReadOnly?: boolean;
  hasSubmitted?: boolean;
  className?: string;
}

const TimeSlot = ({
  dateStr,
  timeSlot,
  isSelected,
  count,
  totalParticipants,
  availableUsers,
  isReadOnly,
  hasSubmitted,
  className,
}: TimeSlotProps) => {
  const getHeatmapColor = (
    count: number,
    total: number,
    isUserSelected: boolean
  ) => {
    if (total === 0) return 'bg-gray-50 hover:bg-gray-100';

    const ratio = count / total;

    if (isUserSelected) {
      if (ratio >= 0.8) return 'bg-green-600 border-green-700';
      if (ratio >= 0.6) return 'bg-green-500 border-green-600';
      if (ratio >= 0.4) return 'bg-green-400 border-green-500';
      if (ratio >= 0.2) return 'bg-green-300 border-green-400';
      return 'bg-green-200 border-green-300';
    }

    if (ratio >= 0.8) return 'bg-green-500 hover:bg-green-600';
    if (ratio >= 0.6) return 'bg-green-400 hover:bg-green-500';
    if (ratio >= 0.4) return 'bg-green-300 hover:bg-green-400';
    if (ratio >= 0.2) return 'bg-green-200 hover:bg-green-300';
    if (ratio > 0) return 'bg-green-100 hover:bg-green-200';
    return 'bg-gray-50 hover:bg-gray-100';
  };

  const heatmapColor = getHeatmapColor(count, totalParticipants, isSelected);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'h-full cursor-pointer transition-all duration-200 border-r border-gray-200 last:border-r-0 flex items-center justify-center relative selecto-item',
            heatmapColor,
            isSelected && 'ring-2 ring-green-600 ring-inset',
            className
          )}
          data-date={dateStr}
          data-time={timeSlot}
        >
          {isSelected && !isReadOnly && !hasSubmitted && (
            <div className='w-full h-full border-dashed border border-black bg-green-400 rounded'></div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side='top' className='max-w-xs'>
        <div className='text-sm'>
          <div className='font-medium mb-1'>
            {dateStr} at {timeSlot}
          </div>
          {count > 0 ? (
            <div>
              <div className='text-xs text-gray-600 mb-1'>
                {count} of {totalParticipants} available:
              </div>
              <div className='space-y-1'>
                {availableUsers.map((user) => (
                  <div key={user} className='text-xs'>
                    • {user}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className='text-xs text-gray-500'>No one available</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

const AvailabilityGrid = ({
  mode = 'specific',
  dates,
  timeSlots,
  responses,
  userAvailability,
  onAvailabilityChange,
  isReadOnly = false,
  hasSubmitted = false,
  setIsDragging,
  isScheduling = false,
  scheduledSlot = null,
  setScheduledSlot,
}: AvailabilityGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const getSlotKey = (dateStr: string, timeSlot: string) =>
    mode === 'weekly' ? `${dateStr}_${timeSlot}` : `${dateStr}_${timeSlot}`;

  const getAvailabilityData = (dateStr: string, timeSlot: string) => {
    const slotKey = getSlotKey(dateStr, timeSlot);
    const availableUsers: string[] = [];
    let count = 0;

    Object.entries(responses).forEach(([userName, userResponse]) => {
      if (userResponse[slotKey]) {
        count++;
        availableUsers.push(userName);
      }
    });

    return { count, availableUsers };
  };

  const getTotalParticipants = () => Object.keys(responses).length;

  const onSchedule = useCallback(
    (e: SelectoEvents['select']) => {
      // Scheduling mode: only allow one slot selection
      if (isScheduling && setScheduledSlot) {
        if (e.selected.length === 1) {
          const el = e.selected[0] as HTMLElement;
          const dateStr = el.dataset.date;
          const timeSlot = el.dataset.time;
          if (dateStr && timeSlot) {
            setScheduledSlot({ date: dateStr, time: timeSlot });
          }
        }
        return;
      }
    },
    [isScheduling, setScheduledSlot]
  );

  const handleSelect = useCallback(
    (e: SelectoEvents['selectEnd']) => {
      if (isReadOnly) return;
      if (isScheduling) return;

      const newAvailability = { ...userAvailability };
      // For single click selections
      if (
        (e.inputEvent && e.inputEvent.type === 'mouseup') ||
        (e.inputEvent && e.inputEvent.type === 'touchend')
      ) {
        e.selected.forEach((el: HTMLElement) => {
          const dateStr = el.dataset.date;
          const timeSlot = el.dataset.time;
          if (dateStr && timeSlot) {
            const slotKey = getSlotKey(dateStr, timeSlot);
            newAvailability[slotKey] = !newAvailability[slotKey];
          }
        });
      } else {
        // For drag selections
        e.selected.forEach((el: HTMLElement) => {
          const dateStr = el.dataset.date;
          const timeSlot = el.dataset.time;
          if (dateStr && timeSlot) {
            const slotKey = getSlotKey(dateStr, timeSlot);
            newAvailability[slotKey] = true;
          }
        });
      }
      onAvailabilityChange(newAvailability);
    },
    [
      isReadOnly,
      isScheduling,
      setScheduledSlot,
      userAvailability,
      onAvailabilityChange,
      getSlotKey,
    ]
  );

  const totalParticipants = getTotalParticipants();

  // Helper for weekly mode: abbreviate day name
  const getDayAbbr = (day: string) => day.slice(0, 3);

  return (
    <TooltipProvider>
      <div className='overflow-x-auto bg-white' ref={containerRef}>
        <Selecto
          container={containerRef.current}
          selectableTargets={['.selecto-item']}
          selectByClick={true}
          selectFromInside={true}
          continueSelect={false}
          toggleContinueSelect={'shift'}
          hitRate={0}
          onSelect={onSchedule}
          onSelectEnd={(e) => {
            handleSelect(e);
          }}
          onDragStart={() => {
            setIsDragging(true);
          }}
          onDragEnd={() => {
            setIsDragging(false);
          }}
        />
        <div className='border border-gray-200 rounded-lg min-w-[350px] sm:min-w-0'>
          {/* Header Row */}
          <div
            className='grid border-b border-gray-200'
            style={{
              gridTemplateColumns: `100px repeat(${dates.length}, 1fr)`,
            }}
          >
            <div className='p-4 bg-gray-50 border-r border-gray-200'></div>
            {dates.map((dateStr, index) => (
              <div
                key={index}
                className='p-4 text-center bg-gray-50 border-r border-gray-200 last:border-r-0'
              >
                <div className='font-medium text-gray-900'>
                  {mode === 'weekly'
                    ? getDayAbbr(dateStr)
                    : format(new Date(dateStr), 'MMM d')}
                </div>
                <div className='text-sm text-gray-600'>
                  {mode === 'weekly'
                    ? dateStr
                    : format(new Date(dateStr), 'EEE')}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {timeSlots.map((timeSlot, timeIndex) => (
            <div
              key={timeSlot}
              className={cn(
                'grid border-b border-gray-200 last:border-b-0',
                timeIndex % 2 === 0 ? 'bg-gray-25' : 'bg-white'
              )}
              style={{
                gridTemplateColumns: `100px repeat(${dates.length}, 1fr)`,
              }}
            >
              {/* Time Label */}
              <div className='px-2 py-1 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200 flex items-center'>
                {format(parse(timeSlot, 'HH:mm', new Date()), 'h:mm a')}
              </div>

              {/* Date Slots */}
              {dates.map((dateStr, dateIndex) => {
                const slotKey = getSlotKey(dateStr, timeSlot);
                const isUserSelected = userAvailability[slotKey];
                const { count, availableUsers } = getAvailabilityData(
                  dateStr,
                  timeSlot
                );
                // Scheduling mode: highlight if this is the scheduled slot
                const isScheduled =
                  isScheduling &&
                  scheduledSlot &&
                  scheduledSlot.date === dateStr &&
                  scheduledSlot.time === timeSlot;
                return (
                  <TimeSlot
                    key={slotKey}
                    dateStr={dateStr}
                    timeSlot={timeSlot}
                    isSelected={isUserSelected}
                    count={count}
                    totalParticipants={totalParticipants}
                    availableUsers={availableUsers}
                    isReadOnly={isReadOnly}
                    hasSubmitted={hasSubmitted}
                    className={cn(
                      'min-h-[40px] min-w-[40px] touch-manipulation',
                      isScheduled && 'ring-2 ring-blue-500 ring-inset z-10'
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
          <h4 className='text-sm font-medium mb-3'>How to use:</h4>
          <div className='space-y-2 text-sm'>
            <div className='flex items-center gap-3'>
              <div className='w-4 h-4 bg-green-600 border-2 border-dashed border-green-800 rounded'></div>
              <span>Your selection (dashed border)</span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-4 h-4 bg-green-500 rounded'></div>
              <span>High availability (many people available)</span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-4 h-4 bg-green-200 rounded'></div>
              <span>Low availability (few people available)</span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AvailabilityGrid;
