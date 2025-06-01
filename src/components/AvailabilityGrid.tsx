
import { useState, useCallback } from 'react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';

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

  const getAvailabilityCount = (dateStr: string, timeSlot: string) => {
    const slotKey = getSlotKey(dateStr, timeSlot);
    let count = 0;
    
    Object.values(responses).forEach(userResponse => {
      if (userResponse[slotKey]) {
        count++;
      }
    });
    
    return count;
  };

  const getTotalParticipants = () => Object.keys(responses).length;

  const getHeatmapColor = (count: number, total: number, isUserSelected: boolean) => {
    if (isUserSelected) {
      return 'bg-blue-500 border-blue-600';
    }
    
    if (total === 0) return 'bg-gray-100 border-gray-200';
    
    const ratio = count / total;
    if (ratio >= 0.8) return 'bg-green-400 border-green-500';
    if (ratio >= 0.6) return 'bg-green-300 border-green-400';
    if (ratio >= 0.4) return 'bg-yellow-300 border-yellow-400';
    if (ratio >= 0.2) return 'bg-orange-300 border-orange-400';
    return 'bg-red-200 border-red-300';
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
    
    // Update all slots in the drag range
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
    return format(parse(timeSlot, 'HH:mm', new Date()), 'h:mm a');
  };

  const totalParticipants = getTotalParticipants();

  return (
    <div className="overflow-auto" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="grid gap-2 min-w-fit">
        {/* Header Row */}
        <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${dates.length}, 120px)` }}>
          <div className="h-16"></div>
          {dates.map((dateStr, index) => (
            <div key={index} className="text-center p-2 font-medium text-sm">
              <div>{format(new Date(dateStr), 'EEE')}</div>
              <div className="text-xs text-gray-600">{format(new Date(dateStr), 'MMM d')}</div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        {timeSlots.map((timeSlot) => (
          <div 
            key={timeSlot} 
            className="grid gap-1" 
            style={{ gridTemplateColumns: `80px repeat(${dates.length}, 120px)` }}
          >
            {/* Time Label */}
            <div className="text-xs text-gray-600 p-2 text-right font-medium">
              {formatTimeSlot(timeSlot)}
            </div>
            
            {/* Date Slots */}
            {dates.map((dateStr) => {
              const slotKey = getSlotKey(dateStr, timeSlot);
              const isUserSelected = userAvailability[slotKey];
              const availabilityCount = getAvailabilityCount(dateStr, timeSlot);
              const heatmapColor = getHeatmapColor(availabilityCount, totalParticipants, isUserSelected);
              
              return (
                <div
                  key={slotKey}
                  className={cn(
                    "h-8 border-2 cursor-pointer transition-all duration-150 rounded flex items-center justify-center text-xs font-medium hover:scale-105 select-none",
                    heatmapColor,
                    isDragging && "pointer-events-none"
                  )}
                  onMouseDown={() => handleMouseDown(dateStr, timeSlot)}
                  onMouseEnter={() => handleMouseEnter(dateStr, timeSlot)}
                >
                  {availabilityCount > 0 && (
                    <span className={cn(
                      "text-xs font-bold",
                      isUserSelected ? "text-white" : "text-gray-700"
                    )}>
                      {availabilityCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Legend:</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 border-2 border-blue-600 rounded"></div>
            <span>Your selection</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 border-2 border-green-500 rounded"></div>
            <span>High availability (80%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-300 border-2 border-yellow-400 rounded"></div>
            <span>Medium availability (40-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 border-2 border-red-300 rounded"></div>
            <span>Low availability (0-20%)</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Numbers show how many people are available for each time slot. Click and drag to select multiple slots at once.
        </p>
      </div>
    </div>
  );
};

export default AvailabilityGrid;
