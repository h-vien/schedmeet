
import { useState, useCallback } from 'react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AvailabilityGridProps {
  dates: string[];
  timeSlots: string[];
  responses: Record<string, Record<string, boolean>>;
  userAvailability: Record<string, boolean>;
  onAvailabilityChange: (availability: Record<string, boolean>) => void;
}

const AvailabilityGrid = ({
  dates,
  timeSlots,
  responses,
  userAvailability,
  onAvailabilityChange
}: AvailabilityGridProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');
  const [dragStartSlot, setDragStartSlot] = useState<string | null>(null);

  const getSlotKey = (dateStr: string, timeSlot: string) => `${dateStr}_${timeSlot}`;

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

  const getHeatmapColor = (count: number, total: number, isUserSelected: boolean) => {
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

  const getSlotsBetween = (startSlot: string, endSlot: string) => {
    const [startDate, startTime] = startSlot.split('_');
    const [endDate, endTime] = endSlot.split('_');
    
    const startDateIndex = dates.indexOf(startDate);
    const endDateIndex = dates.indexOf(endDate);
    const startTimeIndex = timeSlots.indexOf(startTime);
    const endTimeIndex = timeSlots.indexOf(endTime);
    
    const minDateIndex = Math.min(startDateIndex, endDateIndex);
    const maxDateIndex = Math.max(startDateIndex, endDateIndex);
    const minTimeIndex = Math.min(startTimeIndex, endTimeIndex);
    const maxTimeIndex = Math.max(startTimeIndex, endTimeIndex);
    
    const selectedSlots: string[] = [];
    
    for (let dateIndex = minDateIndex; dateIndex <= maxDateIndex; dateIndex++) {
      for (let timeIndex = minTimeIndex; timeIndex <= maxTimeIndex; timeIndex++) {
        selectedSlots.push(getSlotKey(dates[dateIndex], timeSlots[timeIndex]));
      }
    }
    
    return selectedSlots;
  };

  const handleSlotToggle = useCallback((dateStr: string, timeSlot: string) => {
    const slotKey = getSlotKey(dateStr, timeSlot);
    const newAvailability = {
      ...userAvailability,
      [slotKey]: !userAvailability[slotKey]
    };
    onAvailabilityChange(newAvailability);
  }, [userAvailability, onAvailabilityChange]);

  const handleMouseDown = (dateStr: string, timeSlot: string) => {
    const slotKey = getSlotKey(dateStr, timeSlot);
    const currentState = userAvailability[slotKey];
    setDragMode(currentState ? 'deselect' : 'select');
    setIsDragging(true);
    setDragStartSlot(slotKey);
    handleSlotToggle(dateStr, timeSlot);
  };

  const handleMouseEnter = (dateStr: string, timeSlot: string) => {
    if (!isDragging || !dragStartSlot) return;
    
    const currentSlot = getSlotKey(dateStr, timeSlot);
    const slotsInRange = getSlotsBetween(dragStartSlot, currentSlot);
    
    const newAvailability = { ...userAvailability };
    const shouldSelect = dragMode === 'select';
    
    slotsInRange.forEach(slot => {
      newAvailability[slot] = shouldSelect;
    });
    
    onAvailabilityChange(newAvailability);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartSlot(null);
  };

  const formatTimeSlot = (timeSlot: string) => {
    return format(parse(timeSlot, 'HH:mm', new Date()), 'h a');
  };

  const totalParticipants = getTotalParticipants();

  return (
    <TooltipProvider>
      <div className="overflow-auto bg-white" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div className="border border-gray-200 rounded-lg">
          {/* Header Row */}
          <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: `100px repeat(${dates.length}, 1fr)` }}>
            <div className="p-4 bg-gray-50 border-r border-gray-200"></div>
            {dates.map((dateStr, index) => (
              <div key={index} className="p-4 text-center bg-gray-50 border-r border-gray-200 last:border-r-0">
                <div className="font-medium text-gray-900">
                  {format(new Date(dateStr), 'MMM d')}
                </div>
                <div className="text-sm text-gray-600">
                  {format(new Date(dateStr), 'EEE')}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {timeSlots.map((timeSlot, timeIndex) => (
            <div 
              key={timeSlot} 
              className={cn(
                "grid border-b border-gray-200 last:border-b-0",
                timeIndex % 2 === 0 ? "bg-gray-25" : "bg-white"
              )}
              style={{ gridTemplateColumns: `100px repeat(${dates.length}, 1fr)` }}
            >
              {/* Time Label */}
              <div className="p-4 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200 flex items-center">
                {formatTimeSlot(timeSlot)}
              </div>
              
              {/* Date Slots */}
              {dates.map((dateStr, dateIndex) => {
                const slotKey = getSlotKey(dateStr, timeSlot);
                const isUserSelected = userAvailability[slotKey];
                const { count, availableUsers } = getAvailabilityData(dateStr, timeSlot);
                const heatmapColor = getHeatmapColor(count, totalParticipants, isUserSelected);
                
                return (
                  <Tooltip key={slotKey}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "h-16 cursor-pointer transition-all duration-200 border-r border-gray-200 last:border-r-0 flex items-center justify-center relative",
                          heatmapColor,
                          isDragging && "pointer-events-none",
                          isUserSelected && "ring-2 ring-green-600 ring-inset"
                        )}
                        onMouseDown={() => handleMouseDown(dateStr, timeSlot)}
                        onMouseEnter={() => handleMouseEnter(dateStr, timeSlot)}
                      >
                        {isUserSelected && (
                          <div className="absolute inset-0 border-2 border-dashed border-green-800 m-1 rounded"></div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="text-sm">
                        <div className="font-medium mb-1">
                          {format(new Date(dateStr), 'EEE, MMM d')} at {formatTimeSlot(timeSlot)}
                        </div>
                        {count > 0 ? (
                          <div>
                            <div className="text-xs text-gray-600 mb-1">
                              {count} of {totalParticipants} available:
                            </div>
                            <div className="space-y-1">
                              {availableUsers.map(user => (
                                <div key={user} className="text-xs">
                                  • {user}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            No one available
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-3">How to use:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-600 border-2 border-dashed border-green-800 rounded"></div>
              <span>Your selection (dashed border)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>High availability (many people available)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-200 rounded"></div>
              <span>Low availability (few people available)</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Click and drag to select multiple time slots. Hover over any slot to see who's available.
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AvailabilityGrid;
